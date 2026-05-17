import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'

type Tab = 'transport' | 'library' | 'hostel'

type TransportMetric = {
  id: string
  routeName: string
  vehicleCount: number
  totalCapacity: number
  assignedStudents: number
  occupancyRate: number
  onTimeRate: number
  status: 'Operational' | 'Partial' | 'Inactive'
}

type LibraryMetric = {
  id: string
  category: string
  totalBooks: number
  availableBooks: number
  issuedBooks: number
  overdueCount: number
  utilizationRate: number
}

type HostelMetric = {
  id: string
  blockName: string
  totalRooms: number
  occupiedRooms: number
  totalCapacity: number
  occupiedBeds: number
  occupancyRate: number
  pendingFees: number
  activeComplaints: number
}

type OperationalSummary = {
  transportOccupancy: number
  libraryUtilization: number
  hostelOccupancy: number
  totalOperationalIssues: number
}

const TRANSPORT_STATUS_COLORS: Record<string, string> = {
  Operational: 'bg-emerald-100 text-emerald-700',
  Partial:     'bg-amber-100 text-amber-700',
  Inactive:    'bg-gray-100 text-gray-500',
}

export default function OperationalReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('transport')

  const summaryQuery = useQuery({
    queryKey: ['operational-reports-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<OperationalSummary>('/reports/operational/summary')
      return res.data
    },
    retry: false,
  })

  const transportQuery = useQuery({
    queryKey: ['operational-transport'],
    queryFn: async () => {
      const res = await axiosClient.get<TransportMetric[]>('/reports/operational/transport')
      return Array.isArray(res.data) ? res.data : []
    },
    enabled: activeTab === 'transport',
    retry: false,
  })

  const libraryQuery = useQuery({
    queryKey: ['operational-library'],
    queryFn: async () => {
      const res = await axiosClient.get<LibraryMetric[]>('/reports/operational/library')
      return Array.isArray(res.data) ? res.data : []
    },
    enabled: activeTab === 'library',
    retry: false,
  })

  const hostelQuery = useQuery({
    queryKey: ['operational-hostel'],
    queryFn: async () => {
      const res = await axiosClient.get<HostelMetric[]>('/reports/operational/hostel')
      return Array.isArray(res.data) ? res.data : []
    },
    enabled: activeTab === 'hostel',
    retry: false,
  })

  const s = summaryQuery.data

  const transportCols: Column<TransportMetric>[] = [
    { key: 'routeName', header: 'Route', render: (r) => <span className="font-medium">{r.routeName}</span> },
    { key: 'vehicleCount', header: 'Vehicles', width: '80px', render: (r) => <span className="font-semibold">{r.vehicleCount}</span> },
    { key: 'totalCapacity', header: 'Capacity', width: '90px' },
    { key: 'assignedStudents', header: 'Students', width: '90px', render: (r) => <span className="font-semibold">{r.assignedStudents}</span> },
    {
      key: 'occupancyRate', header: 'Occupancy', width: '130px',
      render: (r) => (
        <div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full ${r.occupancyRate >= 90 ? 'bg-red-500' : r.occupancyRate >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(r.occupancyRate, 100)}%` }} />
            </div>
            <span className="text-xs font-semibold w-10 text-right">{r.occupancyRate.toFixed(0)}%</span>
          </div>
        </div>
      ),
    },
    {
      key: 'onTimeRate', header: 'On-Time', width: '90px',
      render: (r) => <span className={`font-semibold ${r.onTimeRate >= 90 ? 'text-emerald-700' : r.onTimeRate >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{r.onTimeRate.toFixed(0)}%</span>,
    },
    {
      key: 'status', header: 'Status', width: '110px',
      render: (r) => <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${TRANSPORT_STATUS_COLORS[r.status]}`}>{r.status}</span>,
    },
  ]

  const libraryCols: Column<LibraryMetric>[] = [
    { key: 'category', header: 'Category', render: (r) => <span className="font-medium">{r.category}</span> },
    { key: 'totalBooks', header: 'Total Books', width: '100px', render: (r) => <span className="font-semibold">{r.totalBooks.toLocaleString()}</span> },
    { key: 'availableBooks', header: 'Available', width: '90px', render: (r) => <span className="text-emerald-700 font-semibold">{r.availableBooks.toLocaleString()}</span> },
    { key: 'issuedBooks', header: 'Issued', width: '80px', render: (r) => <span className="text-blue-600 font-semibold">{r.issuedBooks.toLocaleString()}</span> },
    { key: 'overdueCount', header: 'Overdue', width: '80px', render: (r) => <span className={`font-semibold ${r.overdueCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{r.overdueCount}</span> },
    {
      key: 'utilizationRate', header: 'Utilisation', width: '120px',
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${r.utilizationRate}%` }} />
          </div>
          <span className="text-xs font-semibold w-10 text-right">{r.utilizationRate.toFixed(0)}%</span>
        </div>
      ),
    },
  ]

  const hostelCols: Column<HostelMetric>[] = [
    { key: 'blockName', header: 'Block', render: (r) => <span className="font-medium">{r.blockName}</span> },
    { key: 'totalRooms', header: 'Rooms', width: '80px' },
    { key: 'occupiedRooms', header: 'Occupied', width: '90px', render: (r) => <span className="font-semibold">{r.occupiedRooms}</span> },
    {
      key: 'occupancyRate', header: 'Occupancy', width: '130px',
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${r.occupancyRate >= 90 ? 'bg-emerald-500' : r.occupancyRate >= 60 ? 'bg-amber-500' : 'bg-gray-400'}`} style={{ width: `${r.occupancyRate}%` }} />
          </div>
          <span className="text-xs font-semibold w-10 text-right">{r.occupancyRate.toFixed(0)}%</span>
        </div>
      ),
    },
    {
      key: 'pendingFees', header: 'Pending Fees', width: '110px',
      render: (r) => <span className={`font-semibold ${r.pendingFees > 0 ? 'text-red-600' : 'text-gray-400'}`}>{r.pendingFees > 0 ? r.pendingFees.toLocaleString() : '—'}</span>,
    },
    {
      key: 'activeComplaints', header: 'Complaints', width: '100px',
      render: (r) => <span className={`font-semibold ${r.activeComplaints > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{r.activeComplaints > 0 ? r.activeComplaints : '—'}</span>,
    },
  ]

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'transport', label: 'Transport', icon: '🚌' },
    { key: 'library', label: 'Library', icon: '📚' },
    { key: 'hostel', label: 'Hostel', icon: '🏨' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Operational Reports</h1>
        <p className="text-sm text-muted-foreground">Transport utilisation, library activity and hostel occupancy.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Transport Occupancy" value={s ? `${s.transportOccupancy.toFixed(0)}%` : '—'} icon="🚌" />
        <KpiCard label="Library Utilisation" value={s ? `${s.libraryUtilization.toFixed(0)}%` : '—'} icon="📚" />
        <KpiCard label="Hostel Occupancy"    value={s ? `${s.hostelOccupancy.toFixed(0)}%` : '—'}    icon="🏨" />
        <KpiCard label="Open Issues"         value={s?.totalOperationalIssues?.toLocaleString() ?? '—'} icon="⚠️" />
      </div>

      {summaryQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Operational reports API not yet available. Will appear once the backend modules are deployed.
        </p>
      )}

      <div className="flex gap-1 mb-4">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${activeTab === t.key ? 'bg-primary-700 text-white' : 'bg-white border border-border text-gray-700 hover:bg-gray-50'}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {activeTab === 'transport' && !transportQuery.isLoading && !transportQuery.isError && (
        <DataTable<TransportMetric> columns={transportCols} data={transportQuery.data ?? []} rowKey={(r) => r.id}
          searchableFields={['routeName']} pageSize={20} emptyMessage="No transport data available." />
      )}
      {activeTab === 'library' && !libraryQuery.isLoading && !libraryQuery.isError && (
        <DataTable<LibraryMetric> columns={libraryCols} data={libraryQuery.data ?? []} rowKey={(r) => r.id}
          searchableFields={['category']} pageSize={20} emptyMessage="No library data available." />
      )}
      {activeTab === 'hostel' && !hostelQuery.isLoading && !hostelQuery.isError && (
        <DataTable<HostelMetric> columns={hostelCols} data={hostelQuery.data ?? []} rowKey={(r) => r.id}
          searchableFields={['blockName']} pageSize={20} emptyMessage="No hostel data available." />
      )}
    </div>
  )
}
