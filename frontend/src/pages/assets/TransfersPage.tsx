import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'

type TransferStatus = 'Pending' | 'Approved' | 'Dispatched' | 'Received' | 'Rejected' | 'Cancelled'
type TransferType = 'InterDepartment' | 'InterCampus'

type Transfer = {
  id: string
  transferNumber: string
  transferType: TransferType
  assetId: string
  assetCode: string
  assetName: string
  fromLocation: string
  toLocation: string
  fromDepartment?: string
  toDepartment?: string
  fromCampus?: string
  toCampus?: string
  requestedBy: string
  requestedDate: string
  approvedBy?: string
  dispatchedDate?: string
  receivedDate?: string
  status: TransferStatus
  reason?: string
  notes?: string
}

type TransferSummary = {
  total: number
  pending: number
  approved: number
  inTransit: number
  completedThisMonth: number
}

const STATUS_COLORS: Record<TransferStatus, string> = {
  Pending:    'bg-amber-100 text-amber-700',
  Approved:   'bg-blue-100 text-blue-700',
  Dispatched: 'bg-primary-100 text-primary-700',
  Received:   'bg-emerald-100 text-emerald-700',
  Rejected:   'bg-red-100 text-red-700',
  Cancelled:  'bg-gray-100 text-gray-500',
}

const NEXT_ACTION: Partial<Record<TransferStatus, { label: string; endpoint: string; color: string }>> = {
  Pending:    { label: 'Approve',   endpoint: 'approve',  color: 'bg-blue-600 hover:bg-blue-700 text-white' },
  Approved:   { label: 'Dispatch',  endpoint: 'dispatch', color: 'bg-primary-700 hover:bg-primary-800 text-white' },
  Dispatched: { label: 'Receive',   endpoint: 'receive',  color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
}

const BLANK = {
  assetId: '', transferType: 'InterDepartment' as TransferType,
  toLocation: '', toDepartment: '', toCampus: '', reason: '', notes: '',
}

export default function TransfersPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<TransferStatus | 'All'>('All')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(BLANK)

  const summaryQuery = useQuery({
    queryKey: ['transfer-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<TransferSummary>('/assets/transfers/summary')
      return res.data
    },
    retry: false,
  })

  const transfersQuery = useQuery({
    queryKey: ['transfers', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'All' ? { status: statusFilter } : {}
      const res = await axiosClient.get<Transfer[] | { items: Transfer[] }>('/assets/transfers', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof BLANK) => axiosClient.post('/assets/transfers', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] })
      qc.invalidateQueries({ queryKey: ['transfer-summary'] })
      setShowCreate(false)
      setForm(BLANK)
    },
  })

  const transitionMutation = useMutation({
    mutationFn: ({ id, endpoint }: { id: string; endpoint: string }) =>
      axiosClient.patch(`/assets/transfers/${id}/${endpoint}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] })
      qc.invalidateQueries({ queryKey: ['transfer-summary'] })
      qc.invalidateQueries({ queryKey: ['asset-registry'] })
    },
  })

  const s = summaryQuery.data
  const transfers = transfersQuery.data ?? []
  const STATUS_FILTERS: Array<TransferStatus | 'All'> = ['All', 'Pending', 'Approved', 'Dispatched', 'Received', 'Rejected']

  const columns: Column<Transfer>[] = [
    {
      key: 'transferNumber',
      header: 'Transfer #',
      width: '120px',
      render: (r) => <span className="font-mono text-xs font-semibold text-primary-700">{r.transferNumber}</span>,
    },
    {
      key: 'assetCode',
      header: 'Asset',
      render: (r) => (
        <div>
          <p className="font-mono text-xs text-muted-foreground">{r.assetCode}</p>
          <p className="font-medium text-gray-900">{r.assetName}</p>
        </div>
      ),
    },
    {
      key: 'transferType',
      header: 'Type',
      width: '130px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${r.transferType === 'InterDepartment' ? 'bg-blue-50 text-blue-700' : 'bg-primary-50 text-primary-700'}`}>
          {r.transferType === 'InterDepartment' ? 'Dept Transfer' : 'Campus Transfer'}
        </span>
      ),
    },
    {
      key: 'fromLocation',
      header: 'From → To',
      render: (r) => (
        <div className="text-xs">
          <span className="text-muted-foreground">{r.fromLocation}</span>
          <span className="mx-1 text-gray-400">→</span>
          <span className="font-medium">{r.toLocation}</span>
        </div>
      ),
    },
    { key: 'requestedBy', header: 'Requested By', width: '130px' },
    {
      key: 'requestedDate',
      header: 'Date',
      width: '105px',
      render: (r) => <span className="font-mono text-xs">{formatDate(r.requestedDate)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '115px',
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
      render: (r) => {
        const action = NEXT_ACTION[r.status]
        if (!action) return null
        return (
          <button
            onClick={() => transitionMutation.mutate({ id: r.id, endpoint: action.endpoint })}
            disabled={transitionMutation.isPending}
            className={`px-3 py-1 rounded-lg text-xs font-medium ${action.color} disabled:opacity-50`}
          >
            {action.label}
          </button>
        )
      },
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Asset Transfers</h1>
          <p className="text-sm text-muted-foreground">Request and track inter-department or inter-campus asset transfers.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Request Transfer
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Total"              value={s?.total ?? '—'}               icon="🔄" />
        <KpiCard label="Pending"            value={s?.pending ?? '—'}             icon="⏳" trend={s && s.pending > 0 ? 'neutral' : 'up'} />
        <KpiCard label="Approved"           value={s?.approved ?? '—'}            icon="✅" />
        <KpiCard label="In Transit"         value={s?.inTransit ?? '—'}           icon="🚚" />
        <KpiCard label="Completed (MTD)"    value={s?.completedThisMonth ?? '—'}  icon="📦" trend="up" />
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {STATUS_FILTERS.map((sf) => (
          <button key={sf} onClick={() => setStatusFilter(sf)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${statusFilter === sf ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-border hover:bg-gray-50'}`}>
            {sf}
          </button>
        ))}
      </div>

      {transfersQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Transfers API not yet available. Will appear once the Asset backend module is deployed.
        </p>
      )}

      {!transfersQuery.isLoading && !transfersQuery.isError && (
        <DataTable<Transfer>
          columns={columns}
          data={transfers}
          rowKey={(r) => r.id}
          searchableFields={['transferNumber', 'assetCode', 'assetName', 'fromLocation', 'toLocation', 'requestedBy']}
          pageSize={15}
          emptyMessage="No transfers found."
        />
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Request Asset Transfer"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50">Cancel</button>
            <button form="transfer-form" type="submit" disabled={createMutation.isPending}
              className="px-4 py-2 text-sm bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50">
              {createMutation.isPending ? 'Saving…' : 'Submit Request'}
            </button>
          </div>
        }
      >
        <form id="transfer-form" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Asset ID *</label>
            <input value={form.assetId} onChange={(e) => setForm((p) => ({ ...p, assetId: e.target.value }))} required
              placeholder="Asset Code or ID" className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Transfer Type</label>
            <select value={form.transferType} onChange={(e) => setForm((p) => ({ ...p, transferType: e.target.value as TransferType }))}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm">
              <option value="InterDepartment">Inter-Department</option>
              <option value="InterCampus">Inter-Campus</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">To Location *</label>
              <input value={form.toLocation} onChange={(e) => setForm((p) => ({ ...p, toLocation: e.target.value }))} required
                className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {form.transferType === 'InterCampus' ? 'To Campus' : 'To Department'}
              </label>
              <input
                value={form.transferType === 'InterCampus' ? form.toCampus : form.toDepartment}
                onChange={(e) => setForm((p) =>
                  form.transferType === 'InterCampus'
                    ? { ...p, toCampus: e.target.value }
                    : { ...p, toDepartment: e.target.value }
                )}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
            <input value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={2} className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          {createMutation.isError && <p className="text-sm text-red-600">Failed to submit transfer request.</p>}
        </form>
      </Modal>
    </div>
  )
}
