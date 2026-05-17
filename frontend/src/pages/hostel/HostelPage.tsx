import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { formatCurrency, formatDate } from '../../lib/utils'

type RoomStatus = 'Available' | 'PartiallyOccupied' | 'Full' | 'UnderMaintenance' | 'Reserved'
type ComplaintStatus = 'Open' | 'InProgress' | 'Resolved' | 'Closed'
type RoomType = 'Single' | 'Double' | 'Triple' | 'Dormitory'

type Room = {
  id: string
  roomNumber: string
  floor: string
  block: string
  roomType: RoomType
  capacity: number
  currentOccupancy: number
  status: RoomStatus
  monthlyFee: number
  amenities: string[]
}

type Occupant = {
  id: string
  studentName: string
  studentId: string
  class: string
  roomNumber: string
  block: string
  checkInDate: string
  checkOutDate?: string
  monthlyFee: number
  feeStatus: 'Paid' | 'Pending' | 'Overdue'
  parentContact: string
  status: 'Active' | 'CheckedOut'
}

type Complaint = {
  id: string
  complaintNumber: string
  studentName: string
  roomNumber: string
  category: 'Electrical' | 'Plumbing' | 'Cleanliness' | 'Security' | 'Food' | 'Other'
  description: string
  reportedDate: string
  resolvedDate?: string
  status: ComplaintStatus
  priority: 'Low' | 'Medium' | 'High'
  assignedTo?: string
}

type HostelSummary = {
  totalRooms: number
  totalCapacity: number
  currentOccupancy: number
  occupancyRate: number
  availableRooms: number
  openComplaints: number
  feePendingCount: number
}

const ROOM_STATUS_COLORS: Record<RoomStatus, string> = {
  Available:         'bg-emerald-100 text-emerald-700',
  PartiallyOccupied: 'bg-blue-100 text-blue-700',
  Full:              'bg-amber-100 text-amber-700',
  UnderMaintenance:  'bg-red-100 text-red-600',
  Reserved:          'bg-primary-100 text-primary-700',
}

const COMPLAINT_STATUS_COLORS: Record<ComplaintStatus, string> = {
  Open:       'bg-red-100 text-red-700',
  InProgress: 'bg-amber-100 text-amber-700',
  Resolved:   'bg-emerald-100 text-emerald-700',
  Closed:     'bg-gray-100 text-gray-600',
}

type Tab = 'rooms' | 'occupants' | 'complaints'

export default function HostelPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('rooms')
  const [showComplaintModal, setShowComplaintModal] = useState(false)
  const [complaintForm, setComplaintForm] = useState({
    studentId: '', roomNumber: '', category: 'Cleanliness', description: '', priority: 'Medium',
  })

  const summaryQuery = useQuery({
    queryKey: ['hostel-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<HostelSummary>('/hostel/summary')
      return res.data
    },
    retry: false,
  })

  const roomsQuery = useQuery({
    queryKey: ['hostel-rooms'],
    queryFn: async () => {
      const res = await axiosClient.get<Room[] | { items: Room[] }>('/hostel/rooms')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
    enabled: activeTab === 'rooms',
  })

  const occupantsQuery = useQuery({
    queryKey: ['hostel-occupants'],
    queryFn: async () => {
      const res = await axiosClient.get<Occupant[] | { items: Occupant[] }>('/hostel/occupants')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
    enabled: activeTab === 'occupants',
  })

  const complaintsQuery = useQuery({
    queryKey: ['hostel-complaints'],
    queryFn: async () => {
      const res = await axiosClient.get<Complaint[] | { items: Complaint[] }>('/hostel/complaints')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
    enabled: activeTab === 'complaints',
  })

  const createComplaintMutation = useMutation({
    mutationFn: (data: typeof complaintForm) => axiosClient.post('/hostel/complaints', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hostel-complaints'] })
      qc.invalidateQueries({ queryKey: ['hostel-summary'] })
      setShowComplaintModal(false)
      setComplaintForm({ studentId: '', roomNumber: '', category: 'Cleanliness', description: '', priority: 'Medium' })
    },
  })

  const resolveComplaintMutation = useMutation({
    mutationFn: (id: string) => axiosClient.patch(`/hostel/complaints/${id}/resolve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hostel-complaints'] })
      qc.invalidateQueries({ queryKey: ['hostel-summary'] })
    },
  })

  const s = summaryQuery.data

  const roomColumns: Column<Room>[] = [
    { key: 'roomNumber', header: 'Room', width: '90px', render: (r) => <span className="font-mono font-semibold text-primary-700">{r.roomNumber}</span> },
    { key: 'block', header: 'Block', width: '80px' },
    { key: 'floor', header: 'Floor', width: '70px' },
    { key: 'roomType', header: 'Type', width: '100px' },
    {
      key: 'currentOccupancy', header: 'Occupancy', width: '120px',
      render: (r) => {
        const pct = Math.round((r.currentOccupancy / r.capacity) * 100)
        return (
          <div>
            <p className="text-sm font-medium">{r.currentOccupancy}/{r.capacity}</p>
            <div className="bg-gray-100 rounded-full h-1.5 mt-1">
              <div className={`h-1.5 rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      },
    },
    { key: 'monthlyFee', header: 'Monthly Fee', width: '120px', render: (r) => formatCurrency(r.monthlyFee) },
    {
      key: 'status', header: 'Status', width: '155px',
      render: (r) => <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${ROOM_STATUS_COLORS[r.status]}`}>{r.status}</span>,
    },
  ]

  const occupantColumns: Column<Occupant>[] = [
    { key: 'studentName', header: 'Student', render: (r) => <div><p className="font-medium">{r.studentName}</p><p className="text-xs text-muted-foreground">{r.class}</p></div> },
    { key: 'roomNumber', header: 'Room', width: '90px', render: (r) => <span className="font-mono font-semibold">{r.roomNumber}</span> },
    { key: 'block', header: 'Block', width: '80px' },
    { key: 'checkInDate', header: 'Check-In', width: '105px', render: (r) => <span className="font-mono text-xs">{formatDate(r.checkInDate)}</span> },
    { key: 'monthlyFee', header: 'Fee', width: '110px', render: (r) => formatCurrency(r.monthlyFee) },
    {
      key: 'feeStatus', header: 'Fee Status', width: '100px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${r.feeStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : r.feeStatus === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
          {r.feeStatus}
        </span>
      ),
    },
    { key: 'parentContact', header: 'Parent Contact', width: '130px' },
  ]

  const complaintColumns: Column<Complaint>[] = [
    { key: 'complaintNumber', header: 'Ref #', width: '100px', render: (r) => <span className="font-mono text-xs font-semibold text-primary-700">{r.complaintNumber}</span> },
    { key: 'studentName', header: 'Student', render: (r) => <div><p className="font-medium">{r.studentName}</p><p className="text-xs text-muted-foreground">Room {r.roomNumber}</p></div> },
    { key: 'category', header: 'Category', width: '110px' },
    {
      key: 'priority', header: 'Priority', width: '90px',
      render: (r) => <span className={`text-xs font-medium ${r.priority === 'High' ? 'text-red-600 font-bold' : r.priority === 'Medium' ? 'text-amber-600' : 'text-gray-500'}`}>{r.priority}</span>,
    },
    { key: 'description', header: 'Description', render: (r) => <span className="text-sm text-gray-700">{r.description}</span> },
    { key: 'reportedDate', header: 'Reported', width: '105px', render: (r) => <span className="font-mono text-xs">{formatDate(r.reportedDate)}</span> },
    {
      key: 'status', header: 'Status', width: '115px',
      render: (r) => <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${COMPLAINT_STATUS_COLORS[r.status]}`}>{r.status}</span>,
    },
    {
      key: 'id', header: '', width: '95px',
      render: (r) => r.status === 'Open' || r.status === 'InProgress'
        ? <button onClick={() => resolveComplaintMutation.mutate(r.id)} disabled={resolveComplaintMutation.isPending}
            className="px-3 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50">Resolve</button>
        : null,
    },
  ]

  const TABS: { key: Tab; label: string }[] = [
    { key: 'rooms',      label: 'Rooms' },
    { key: 'occupants',  label: 'Occupants' },
    { key: 'complaints', label: `Complaints${s?.openComplaints ? ` (${s.openComplaints})` : ''}` },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Hostel Management</h1>
          <p className="text-sm text-muted-foreground">Room allocation, occupancy tracking and student complaints.</p>
        </div>
        {activeTab === 'complaints' && (
          <button onClick={() => setShowComplaintModal(true)}
            className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Log Complaint
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Rooms"    value={s?.totalRooms ?? '—'}                                         icon="🏨" />
        <KpiCard label="Occupancy"      value={s ? `${s.currentOccupancy}/${s.totalCapacity}` : '—'}         icon="👥" />
        <KpiCard label="Occupancy Rate" value={s ? `${s.occupancyRate.toFixed(0)}%` : '—'}                   icon="📊" />
        <KpiCard label="Open Complaints" value={s?.openComplaints ?? '—'}                                    icon="⚠️" trend={s && s.openComplaints > 0 ? 'down' : 'up'} />
      </div>

      {summaryQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Hostel API not yet available. Will appear once the Hostel backend module is deployed.
        </p>
      )}

      <div className="flex gap-1 mb-4">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === t.key ? 'bg-primary-700 text-white' : 'bg-white border border-border text-gray-700 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'rooms' && !roomsQuery.isLoading && !roomsQuery.isError && (
        <DataTable<Room> columns={roomColumns} data={roomsQuery.data ?? []} rowKey={(r) => r.id}
          searchableFields={['roomNumber', 'block', 'floor', 'roomType']}
          pageSize={15} emptyMessage="No rooms configured." />
      )}
      {activeTab === 'occupants' && !occupantsQuery.isLoading && !occupantsQuery.isError && (
        <DataTable<Occupant> columns={occupantColumns} data={occupantsQuery.data ?? []} rowKey={(r) => r.id}
          searchableFields={['studentName', 'roomNumber', 'block', 'class']}
          pageSize={15} emptyMessage="No current occupants." />
      )}
      {activeTab === 'complaints' && !complaintsQuery.isLoading && !complaintsQuery.isError && (
        <DataTable<Complaint> columns={complaintColumns} data={complaintsQuery.data ?? []} rowKey={(r) => r.id}
          searchableFields={['complaintNumber', 'studentName', 'roomNumber', 'category']}
          pageSize={15} emptyMessage="No complaints on record." />
      )}

      <Modal open={showComplaintModal} onClose={() => setShowComplaintModal(false)} title="Log Complaint" size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowComplaintModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50">Cancel</button>
            <button form="complaint-form" type="submit" disabled={createComplaintMutation.isPending}
              className="px-4 py-2 text-sm bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50">
              {createComplaintMutation.isPending ? 'Saving…' : 'Submit Complaint'}
            </button>
          </div>
        }>
        <form id="complaint-form" onSubmit={(e) => { e.preventDefault(); createComplaintMutation.mutate(complaintForm) }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Student ID *</label>
              <input value={complaintForm.studentId} onChange={(e) => setComplaintForm((p) => ({ ...p, studentId: e.target.value }))} required
                className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Room Number *</label>
              <input value={complaintForm.roomNumber} onChange={(e) => setComplaintForm((p) => ({ ...p, roomNumber: e.target.value }))} required
                className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select value={complaintForm.category} onChange={(e) => setComplaintForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm">
                {['Electrical', 'Plumbing', 'Cleanliness', 'Security', 'Food', 'Other'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <select value={complaintForm.priority} onChange={(e) => setComplaintForm((p) => ({ ...p, priority: e.target.value }))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm">
                {['Low', 'Medium', 'High'].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
            <textarea value={complaintForm.description} onChange={(e) => setComplaintForm((p) => ({ ...p, description: e.target.value }))} required
              rows={3} className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          {createComplaintMutation.isError && <p className="text-sm text-red-600">Failed to submit complaint.</p>}
        </form>
      </Modal>
    </div>
  )
}
