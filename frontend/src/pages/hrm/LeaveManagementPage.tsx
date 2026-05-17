import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatDate } from '../../lib/utils'

type LeaveRequest = {
  id: string
  employeeName: string
  employeeNumber: string
  department: string
  leaveType: string
  fromDate: string
  toDate: string
  days: number
  reason: string
  appliedAt: string
  status: 'Pending' | 'Approved' | 'Rejected'
}

type Summary = {
  pendingCount: number
  approvedToday: number
  onLeaveNow: number
  avgLeaveDays: number
}

const STATUS_FILTER = ['All', 'Pending', 'Approved', 'Rejected'] as const
type StatusFilter = (typeof STATUS_FILTER)[number]

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-red-100 text-red-700',
}

export default function LeaveManagementPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Pending')
  const [actionId, setActionId] = useState<string | null>(null)

  const summaryQuery = useQuery({
    queryKey: ['leave-mgmt-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<Summary>('/hrm/leaves/summary')
      return res.data
    },
    retry: false,
  })

  const leavesQuery = useQuery({
    queryKey: ['hrm-leaves', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'All' ? { status: statusFilter } : {}
      const res = await axiosClient.get<LeaveRequest[] | { items: LeaveRequest[] }>('/hrm/leaves', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const decide = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
      await axiosClient.patch(`/hrm/leaves/${id}/${action}`)
    },
    onSuccess: (_, { action }) => {
      toast.success(`Leave request ${action === 'approve' ? 'approved' : 'rejected'}.`)
      setActionId(null)
      qc.invalidateQueries({ queryKey: ['hrm-leaves'] })
      qc.invalidateQueries({ queryKey: ['leave-mgmt-summary'] })
    },
    onError: () => {
      toast.error('Could not process this request.')
    },
  })

  const summary = summaryQuery.data
  const leaves = leavesQuery.data ?? []

  const columns: Column<LeaveRequest>[] = [
    {
      key: 'employeeName',
      header: 'Employee',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.employeeName}</p>
          <p className="text-xs text-muted-foreground">{r.employeeNumber} · {r.department}</p>
        </div>
      ),
    },
    { key: 'leaveType', header: 'Type', width: '90px' },
    {
      key: 'fromDate',
      header: 'Period',
      render: (r) => `${formatDate(r.fromDate)} → ${formatDate(r.toDate)}`,
    },
    { key: 'days', header: 'Days', width: '60px' },
    { key: 'reason', header: 'Reason', render: (r) => <span className="text-sm text-gray-600 line-clamp-1">{r.reason}</span> },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] ?? ''}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      width: '140px',
      render: (r) =>
        r.status === 'Pending' ? (
          <div className="flex gap-1">
            <button
              disabled={decide.isPending && actionId === r.id}
              onClick={() => { setActionId(r.id); decide.mutate({ id: r.id, action: 'approve' }) }}
              className="px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-md disabled:opacity-50"
            >
              Approve
            </button>
            <button
              disabled={decide.isPending && actionId === r.id}
              onClick={() => { setActionId(r.id); decide.mutate({ id: r.id, action: 'reject' }) }}
              className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Leave Management</h1>
      <p className="text-sm text-muted-foreground mb-6">Review, approve and track staff leave requests.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Pending Approval" value={summary?.pendingCount ?? leaves.filter((l) => l.status === 'Pending').length} icon="⏳" trend="down" />
        <KpiCard label="Approved Today" value={summary?.approvedToday ?? '—'} icon="✅" />
        <KpiCard label="On Leave Now" value={summary?.onLeaveNow ?? '—'} icon="🌴" />
        <KpiCard label="Avg Days/Request" value={summary?.avgLeaveDays ? `${summary.avgLeaveDays.toFixed(1)}d` : '—'} icon="📅" />
      </div>

      <div className="flex gap-1 mb-4 flex-wrap">
        {STATUS_FILTER.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              statusFilter === s
                ? 'bg-primary-700 text-white'
                : 'bg-white border border-border text-gray-700 hover:bg-gray-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {leavesQuery.isLoading && <p className="text-muted-foreground">Loading leave requests…</p>}
      {leavesQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
          Leave Management API not yet available. Data will appear once the HRM backend module is deployed.
        </p>
      )}
      {!leavesQuery.isLoading && !leavesQuery.isError && (
        <DataTable<LeaveRequest>
          columns={columns}
          data={leaves}
          rowKey={(r) => r.id}
          searchableFields={['employeeName', 'employeeNumber', 'department', 'leaveType']}
          pageSize={15}
          emptyMessage="No leave requests found."
        />
      )}
    </div>
  )
}
