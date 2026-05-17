import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { formatCurrency, formatDate } from '../../lib/utils'

type PRStatus = 'Draft' | 'Submitted' | 'UnderReview' | 'Approved' | 'Rejected' | 'Cancelled'

type PurchaseRequest = {
  id: string
  prNumber: string
  title: string
  category: string
  priority: 'Low' | 'Normal' | 'High' | 'Urgent'
  requiredByDate: string
  estimatedAmount: number
  status: PRStatus
  requestedBy: string
  department: string
  createdAt: string
  approvedBy?: string
  remarks?: string
  itemCount: number
}

type PRSummary = {
  total: number
  draft: number
  submitted: number
  approved: number
  rejected: number
}

const STATUS_COLORS: Record<string, string> = {
  Draft:       'bg-gray-100 text-gray-600',
  Submitted:   'bg-blue-100 text-blue-700',
  UnderReview: 'bg-amber-100 text-amber-700',
  Approved:    'bg-emerald-100 text-emerald-700',
  Rejected:    'bg-red-100 text-red-700',
  Cancelled:   'bg-gray-100 text-gray-500',
}

const PRIORITY_COLORS: Record<string, string> = {
  Low:    'text-gray-500',
  Normal: 'text-blue-600',
  High:   'text-amber-600',
  Urgent: 'text-red-600 font-bold',
}

const NEXT_ACTION: Partial<Record<PRStatus, { label: string; endpoint: string; color: string }>> = {
  Draft:       { label: 'Submit for Review', endpoint: 'submit',   color: 'bg-blue-600 hover:bg-blue-700 text-white' },
  Submitted:   { label: 'Recall',            endpoint: 'recall',   color: 'bg-gray-600 hover:bg-gray-700 text-white' },
}

const BLANK_FORM = { title: '', category: 'Stationery', priority: 'Normal', requiredByDate: '', estimatedAmount: '', remarks: '' }
const CATEGORIES = ['Stationery', 'IT Equipment', 'Furniture', 'Maintenance', 'Catering', 'Transport', 'Utilities', 'Other']

export default function PurchaseRequestsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<PRStatus | 'All'>('All')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)

  const summaryQuery = useQuery({
    queryKey: ['pr-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<PRSummary>('/procurement/purchase-requests/summary')
      return res.data
    },
    retry: false,
  })

  const prQuery = useQuery({
    queryKey: ['purchase-requests', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'All' ? { status: statusFilter } : {}
      const res = await axiosClient.get<PurchaseRequest[] | { items: PurchaseRequest[] }>('/procurement/purchase-requests', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof BLANK_FORM) => axiosClient.post('/procurement/purchase-requests', {
      ...data,
      estimatedAmount: parseFloat(data.estimatedAmount) || 0,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-requests'] })
      qc.invalidateQueries({ queryKey: ['pr-summary'] })
      setShowModal(false)
      setForm(BLANK_FORM)
    },
  })

  const transitionMutation = useMutation({
    mutationFn: async ({ id, endpoint }: { id: string; endpoint: string }) =>
      axiosClient.patch(`/procurement/purchase-requests/${id}/${endpoint}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-requests'] })
      qc.invalidateQueries({ queryKey: ['pr-summary'] })
    },
  })

  const s = summaryQuery.data
  const prs = prQuery.data ?? []

  const STATUS_FILTERS: Array<PRStatus | 'All'> = ['All', 'Draft', 'Submitted', 'UnderReview', 'Approved', 'Rejected']

  const columns: Column<PurchaseRequest>[] = [
    {
      key: 'prNumber',
      header: 'PR #',
      width: '110px',
      render: (r) => <span className="font-mono text-xs font-semibold text-primary-700">{r.prNumber}</span>,
    },
    {
      key: 'title',
      header: 'Title / Dept',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.title}</p>
          <p className="text-xs text-muted-foreground">{r.department} · {r.requestedBy}</p>
        </div>
      ),
    },
    { key: 'category',  header: 'Category', width: '120px' },
    {
      key: 'priority',
      header: 'Priority',
      width: '80px',
      render: (r) => <span className={`text-xs font-medium ${PRIORITY_COLORS[r.priority]}`}>{r.priority}</span>,
    },
    {
      key: 'estimatedAmount',
      header: 'Est. Amount',
      width: '120px',
      render: (r) => formatCurrency(r.estimatedAmount),
    },
    {
      key: 'requiredByDate',
      header: 'Required By',
      width: '105px',
      render: (r) => <span className="font-mono text-xs">{formatDate(r.requiredByDate)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status] ?? ''}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'id',
      header: '',
      width: '150px',
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate(form)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Purchase Requests</h1>
          <p className="text-sm text-muted-foreground">Create and track procurement requisitions through the approval workflow.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + New Request
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Total PRs"   value={s?.total ?? '—'}    icon="📋" />
        <KpiCard label="Draft"       value={s?.draft ?? '—'}    icon="✏️" />
        <KpiCard label="Submitted"   value={s?.submitted ?? '—'} icon="📤" />
        <KpiCard label="Approved"    value={s?.approved ?? '—'} icon="✅" trend="up" />
        <KpiCard label="Rejected"    value={s?.rejected ?? '—'} icon="❌" trend={s && s.rejected > 0 ? 'down' : 'neutral'} />
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {STATUS_FILTERS.map((sf) => (
          <button
            key={sf}
            onClick={() => setStatusFilter(sf)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${statusFilter === sf ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-border hover:bg-gray-50'}`}
          >
            {sf}
          </button>
        ))}
      </div>

      {prQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Purchase requests API not yet available. Will appear once the Procurement backend module is deployed.
        </p>
      )}

      {!prQuery.isLoading && !prQuery.isError && (
        <DataTable<PurchaseRequest>
          columns={columns}
          data={prs}
          rowKey={(r) => r.id}
          searchableFields={['prNumber', 'title', 'department', 'requestedBy', 'category']}
          pageSize={15}
          emptyMessage="No purchase requests found."
        />
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="New Purchase Request"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              form="pr-form"
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Saving…' : 'Create PR'}
            </button>
          </div>
        }
      >
        <form id="pr-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              required
              className="w-full border border-input rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. Office Stationery Q3"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                required
                className="w-full border border-input rounded-lg px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm"
              >
                {['Low', 'Normal', 'High', 'Urgent'].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Amount (PKR)</label>
              <input
                type="number"
                value={form.estimatedAmount}
                onChange={(e) => setForm((p) => ({ ...p, estimatedAmount: e.target.value }))}
                min={0}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Required By *</label>
              <input
                type="date"
                value={form.requiredByDate}
                onChange={(e) => setForm((p) => ({ ...p, requiredByDate: e.target.value }))}
                required
                className="w-full border border-input rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
            <textarea
              value={form.remarks}
              onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
              rows={3}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm"
              placeholder="Justification or special notes…"
            />
          </div>
          {createMutation.isError && (
            <p className="text-sm text-red-600">Failed to create purchase request. Please try again.</p>
          )}
        </form>
      </Modal>
    </div>
  )
}
