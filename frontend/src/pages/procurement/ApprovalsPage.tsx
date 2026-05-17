import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatCurrency, formatDate } from '../../lib/utils'

type ApprovalType = 'PurchaseRequest' | 'PurchaseOrder'
type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected'

type ApprovalItem = {
  id: string
  referenceNumber: string
  type: ApprovalType
  title: string
  requestedBy: string
  department: string
  amount: number
  priority: 'Low' | 'Normal' | 'High' | 'Urgent'
  submittedAt: string
  status: ApprovalStatus
  approvedBy?: string
  approvedAt?: string
  remarks?: string
}

type ApprovalSummary = {
  pendingPRs: number
  pendingPOs: number
  approvedToday: number
  rejectedToday: number
}

const TYPE_COLORS: Record<ApprovalType, string> = {
  PurchaseRequest: 'bg-blue-100 text-blue-700',
  PurchaseOrder:   'bg-primary-100 text-primary-700',
}

const PRIORITY_COLORS: Record<string, string> = {
  Low:    'text-gray-500',
  Normal: 'text-blue-600',
  High:   'text-amber-600',
  Urgent: 'text-red-600 font-bold',
}

export default function ApprovalsPage() {
  const qc = useQueryClient()
  const [typeFilter, setTypeFilter] = useState<ApprovalType | 'All'>('All')
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'All'>('Pending')
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({})

  const summaryQuery = useQuery({
    queryKey: ['approval-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<ApprovalSummary>('/procurement/approvals/summary')
      return res.data
    },
    retry: false,
  })

  const approvalsQuery = useQuery({
    queryKey: ['approvals', typeFilter, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (typeFilter !== 'All') params.type = typeFilter
      if (statusFilter !== 'All') params.status = statusFilter
      const res = await axiosClient.get<ApprovalItem[] | { items: ApprovalItem[] }>('/procurement/approvals', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks: string }) =>
      axiosClient.patch(`/procurement/approvals/${id}/approve`, { remarks }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] })
      qc.invalidateQueries({ queryKey: ['approval-summary'] })
      qc.invalidateQueries({ queryKey: ['purchase-requests'] })
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks: string }) =>
      axiosClient.patch(`/procurement/approvals/${id}/reject`, { remarks }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] })
      qc.invalidateQueries({ queryKey: ['approval-summary'] })
      qc.invalidateQueries({ queryKey: ['purchase-requests'] })
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
  })

  const s = summaryQuery.data
  const items = approvalsQuery.data ?? []

  const columns: Column<ApprovalItem>[] = [
    {
      key: 'referenceNumber',
      header: 'Reference',
      width: '120px',
      render: (r) => <span className="font-mono text-xs font-semibold text-primary-700">{r.referenceNumber}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      width: '140px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[r.type]}`}>
          {r.type === 'PurchaseRequest' ? 'PR' : 'PO'}
        </span>
      ),
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
    {
      key: 'priority',
      header: 'Priority',
      width: '80px',
      render: (r) => <span className={`text-xs font-medium ${PRIORITY_COLORS[r.priority]}`}>{r.priority}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      width: '120px',
      render: (r) => <span className="font-semibold">{formatCurrency(r.amount)}</span>,
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      width: '105px',
      render: (r) => <span className="font-mono text-xs">{formatDate(r.submittedAt)}</span>,
    },
    {
      key: 'id',
      header: 'Actions',
      width: '240px',
      render: (r) => {
        if (r.status !== 'Pending') {
          return (
            <span className={`text-xs font-medium ${r.status === 'Approved' ? 'text-emerald-700' : 'text-red-600'}`}>
              {r.status} {r.approvedAt ? `· ${formatDate(r.approvedAt)}` : ''}
            </span>
          )
        }
        return (
          <div className="space-y-1">
            <input
              type="text"
              value={remarksMap[r.id] ?? ''}
              onChange={(e) => setRemarksMap((m) => ({ ...m, [r.id]: e.target.value }))}
              placeholder="Remarks (optional)"
              className="w-full border border-input rounded px-2 py-1 text-xs"
            />
            <div className="flex gap-1">
              <button
                onClick={() => approveMutation.mutate({ id: r.id, remarks: remarksMap[r.id] ?? '' })}
                disabled={approveMutation.isPending}
                className="flex-1 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => rejectMutation.mutate({ id: r.id, remarks: remarksMap[r.id] ?? '' })}
                disabled={rejectMutation.isPending}
                className="flex-1 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Procurement Approvals</h1>
        <p className="text-sm text-muted-foreground">Review and action pending purchase requests and purchase orders.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Pending PRs"     value={s?.pendingPRs ?? '—'}     icon="📋" trend={s && s.pendingPRs > 0 ? 'neutral' : 'up'} />
        <KpiCard label="Pending POs"     value={s?.pendingPOs ?? '—'}     icon="🛒" trend={s && s.pendingPOs > 0 ? 'neutral' : 'up'} />
        <KpiCard label="Approved Today"  value={s?.approvedToday ?? '—'}  icon="✅" trend="up" />
        <KpiCard label="Rejected Today"  value={s?.rejectedToday ?? '—'}  icon="❌" trend={s && s.rejectedToday > 0 ? 'down' : 'neutral'} />
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="flex gap-2">
          {(['All', 'PurchaseRequest', 'PurchaseOrder'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${typeFilter === t ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-border hover:bg-gray-50'}`}
            >
              {t === 'PurchaseRequest' ? 'PRs' : t === 'PurchaseOrder' ? 'POs' : 'All Types'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['Pending', 'Approved', 'Rejected', 'All'] as const).map((sf) => (
            <button
              key={sf}
              onClick={() => setStatusFilter(sf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${statusFilter === sf ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-border hover:bg-gray-50'}`}
            >
              {sf}
            </button>
          ))}
        </div>
      </div>

      {approvalsQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Approvals API not yet available. Will appear once the Procurement backend module is deployed.
        </p>
      )}

      {!approvalsQuery.isLoading && !approvalsQuery.isError && (
        <DataTable<ApprovalItem>
          columns={columns}
          data={items}
          rowKey={(r) => r.id}
          searchableFields={['referenceNumber', 'title', 'department', 'requestedBy']}
          pageSize={20}
          emptyMessage="No approval items in this queue."
        />
      )}
    </div>
  )
}
