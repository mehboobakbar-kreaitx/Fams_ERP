import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'

type AssignmentStatus = 'Active' | 'Returned' | 'Lost' | 'Damaged'

type Assignment = {
  id: string
  assetId: string
  assetCode: string
  assetName: string
  assetCategory: string
  assignedTo: string
  assignedToId: string
  assignedToType: 'Staff' | 'Department'
  department: string
  assignedDate: string
  expectedReturnDate?: string
  actualReturnDate?: string
  status: AssignmentStatus
  assignedBy: string
  condition: 'Good' | 'Fair' | 'Poor'
  notes?: string
}

type AssignmentSummary = {
  totalAssigned: number
  activeAssignments: number
  returnedThisMonth: number
  overdue: number
}

const STATUS_COLORS: Record<AssignmentStatus, string> = {
  Active:   'bg-emerald-100 text-emerald-700',
  Returned: 'bg-gray-100 text-gray-600',
  Lost:     'bg-red-100 text-red-700',
  Damaged:  'bg-amber-100 text-amber-700',
}

const BLANK: { assetId: string; assignedToId: string; assignedToType: 'Staff' | 'Department'; assignedDate: string; expectedReturnDate: string; notes: string } = {
  assetId: '', assignedToId: '', assignedToType: 'Staff', assignedDate: '', expectedReturnDate: '', notes: '',
}

export default function AssetAssignmentPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | 'All'>('Active')
  const [showAssign, setShowAssign] = useState(false)
  const [form, setForm] = useState(BLANK)

  const summaryQuery = useQuery({
    queryKey: ['assignment-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<AssignmentSummary>('/assets/assignments/summary')
      return res.data
    },
    retry: false,
  })

  const assignmentsQuery = useQuery({
    queryKey: ['assignments', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'All' ? { status: statusFilter } : {}
      const res = await axiosClient.get<Assignment[] | { items: Assignment[] }>('/assets/assignments', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof BLANK) => axiosClient.post('/assets/assignments', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] })
      qc.invalidateQueries({ queryKey: ['assignment-summary'] })
      qc.invalidateQueries({ queryKey: ['asset-registry'] })
      setShowAssign(false)
      setForm(BLANK)
    },
  })

  const returnMutation = useMutation({
    mutationFn: ({ id, condition }: { id: string; condition: string }) =>
      axiosClient.patch(`/assets/assignments/${id}/return`, { condition }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] })
      qc.invalidateQueries({ queryKey: ['assignment-summary'] })
      qc.invalidateQueries({ queryKey: ['asset-registry'] })
    },
  })

  const s = summaryQuery.data
  const assignments = assignmentsQuery.data ?? []

  const STATUS_FILTERS: Array<AssignmentStatus | 'All'> = ['All', 'Active', 'Returned', 'Lost', 'Damaged']

  const columns: Column<Assignment>[] = [
    {
      key: 'assetCode',
      header: 'Asset',
      render: (r) => (
        <div>
          <p className="font-mono text-xs font-semibold text-primary-700">{r.assetCode}</p>
          <p className="font-medium text-gray-900">{r.assetName}</p>
          <p className="text-xs text-muted-foreground">{r.assetCategory}</p>
        </div>
      ),
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.assignedTo}</p>
          <p className="text-xs text-muted-foreground">{r.department} · {r.assignedToType}</p>
        </div>
      ),
    },
    {
      key: 'assignedDate',
      header: 'Assigned',
      width: '105px',
      render: (r) => <span className="font-mono text-xs">{formatDate(r.assignedDate)}</span>,
    },
    {
      key: 'expectedReturnDate',
      header: 'Due Return',
      width: '105px',
      render: (r) => {
        if (!r.expectedReturnDate) return <span className="text-muted-foreground">—</span>
        const overdue = r.status === 'Active' && new Date(r.expectedReturnDate) < new Date()
        return <span className={`font-mono text-xs ${overdue ? 'text-red-600 font-semibold' : ''}`}>{formatDate(r.expectedReturnDate)}</span>
      },
    },
    { key: 'condition', header: 'Condition', width: '90px' },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status]}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'id',
      header: '',
      width: '100px',
      render: (r) =>
        r.status === 'Active' ? (
          <button
            onClick={() => returnMutation.mutate({ id: r.id, condition: 'Good' })}
            disabled={returnMutation.isPending}
            className="px-3 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            Return
          </button>
        ) : null,
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Asset Assignments</h1>
          <p className="text-sm text-muted-foreground">Track which assets are assigned to staff or departments and manage returns.</p>
        </div>
        <button
          onClick={() => setShowAssign(true)}
          className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Assign Asset
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Assigned"      value={s?.totalAssigned ?? '—'}        icon="📋" />
        <KpiCard label="Active"              value={s?.activeAssignments ?? '—'}    icon="✅" trend="up" />
        <KpiCard label="Returned This Month" value={s?.returnedThisMonth ?? '—'}    icon="🔄" />
        <KpiCard label="Overdue Returns"     value={s?.overdue ?? '—'}              icon="🚨" trend={s && s.overdue > 0 ? 'down' : 'neutral'} />
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {STATUS_FILTERS.map((sf) => (
          <button key={sf} onClick={() => setStatusFilter(sf)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${statusFilter === sf ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-border hover:bg-gray-50'}`}>
            {sf}
          </button>
        ))}
      </div>

      {assignmentsQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Assignments API not yet available. Will appear once the Asset backend module is deployed.
        </p>
      )}

      {!assignmentsQuery.isLoading && !assignmentsQuery.isError && (
        <DataTable<Assignment>
          columns={columns}
          data={assignments}
          rowKey={(r) => r.id}
          searchableFields={['assetCode', 'assetName', 'assignedTo', 'department', 'assetCategory']}
          pageSize={15}
          emptyMessage="No assignments found."
        />
      )}

      <Modal
        open={showAssign}
        onClose={() => setShowAssign(false)}
        title="Assign Asset"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAssign(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50">Cancel</button>
            <button form="assign-form" type="submit" disabled={createMutation.isPending}
              className="px-4 py-2 text-sm bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50">
              {createMutation.isPending ? 'Saving…' : 'Assign'}
            </button>
          </div>
        }
      >
        <form id="assign-form" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Asset ID *</label>
            <input value={form.assetId} onChange={(e) => setForm((p) => ({ ...p, assetId: e.target.value }))} required
              placeholder="Asset Code or ID" className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Assign To Type</label>
              <select value={form.assignedToType} onChange={(e) => setForm((p) => ({ ...p, assignedToType: e.target.value as 'Staff' | 'Department' }))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm">
                <option value="Staff">Staff</option>
                <option value="Department">Department</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Assignee ID *</label>
              <input value={form.assignedToId} onChange={(e) => setForm((p) => ({ ...p, assignedToId: e.target.value }))} required
                placeholder="Staff or Dept ID" className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Assigned Date *</label>
              <input type="date" value={form.assignedDate} onChange={(e) => setForm((p) => ({ ...p, assignedDate: e.target.value }))} required
                className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Expected Return</label>
              <input type="date" value={form.expectedReturnDate} onChange={(e) => setForm((p) => ({ ...p, expectedReturnDate: e.target.value }))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={2} className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          {createMutation.isError && <p className="text-sm text-red-600">Failed to create assignment.</p>}
        </form>
      </Modal>
    </div>
  )
}
