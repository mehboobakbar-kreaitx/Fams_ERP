import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatDate } from '../../lib/utils'

type Resignation = {
  id: string
  employeeName: string
  employeeNumber: string
  department: string
  designation: string
  resignationDate: string
  lastWorkingDate?: string
  reason?: string
  noticePeriodDays: number
  status: 'Submitted' | 'Accepted' | 'Withdrawn' | 'Completed'
}

type Summary = {
  submittedCount: number
  acceptedCount: number
  completedThisMonth: number
  attritionRate: number
}

const STATUS_COLORS: Record<string, string> = {
  Submitted: 'bg-amber-100 text-amber-700',
  Accepted: 'bg-blue-100 text-blue-700',
  Withdrawn: 'bg-gray-100 text-gray-600',
  Completed: 'bg-emerald-100 text-emerald-700',
}

export default function ResignationsPage() {
  const qc = useQueryClient()

  const summaryQuery = useQuery({
    queryKey: ['resignations-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<Summary>('/hrm/resignations/summary')
      return res.data
    },
    retry: false,
  })

  const resignationsQuery = useQuery({
    queryKey: ['hrm-resignations'],
    queryFn: async () => {
      const res = await axiosClient.get<Resignation[] | { items: Resignation[] }>('/hrm/resignations')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const acceptMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosClient.patch(`/hrm/resignations/${id}/accept`)
    },
    onSuccess: () => {
      toast.success('Resignation accepted.')
      qc.invalidateQueries({ queryKey: ['hrm-resignations'] })
      qc.invalidateQueries({ queryKey: ['resignations-summary'] })
    },
    onError: () => toast.error('Could not process resignation.'),
  })

  const summary = summaryQuery.data
  const resignations = resignationsQuery.data ?? []

  const columns: Column<Resignation>[] = [
    {
      key: 'employeeName',
      header: 'Employee',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.employeeName}</p>
          <p className="text-xs text-muted-foreground">{r.employeeNumber} · {r.designation}</p>
        </div>
      ),
    },
    { key: 'department', header: 'Department' },
    {
      key: 'resignationDate',
      header: 'Resigned On',
      width: '110px',
      render: (r) => formatDate(r.resignationDate),
    },
    {
      key: 'lastWorkingDate',
      header: 'Last Working Day',
      width: '130px',
      render: (r) => (r.lastWorkingDate ? formatDate(r.lastWorkingDate) : '—'),
    },
    {
      key: 'noticePeriodDays',
      header: 'Notice',
      width: '80px',
      render: (r) => `${r.noticePeriodDays}d`,
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (r) => <span className="text-sm text-gray-600 line-clamp-1">{r.reason ?? '—'}</span>,
    },
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
      header: '',
      width: '90px',
      render: (r) =>
        r.status === 'Submitted' ? (
          <button
            onClick={() => acceptMutation.mutate(r.id)}
            disabled={acceptMutation.isPending}
            className="px-2 py-1 text-xs bg-primary-700 hover:bg-primary-800 text-white rounded-md disabled:opacity-50"
          >
            Accept
          </button>
        ) : null,
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Resignations</h1>
      <p className="text-sm text-muted-foreground mb-6">Track and process staff resignation requests.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Pending Review" value={summary?.submittedCount ?? resignations.filter((r) => r.status === 'Submitted').length} icon="📤" />
        <KpiCard label="Accepted" value={summary?.acceptedCount ?? '—'} icon="✅" />
        <KpiCard label="Completed This Month" value={summary?.completedThisMonth ?? '—'} icon="🏁" />
        <KpiCard
          label="Attrition Rate"
          value={summary ? `${summary.attritionRate.toFixed(1)}%` : '—'}
          icon="📉"
          trend="down"
        />
      </div>

      {resignationsQuery.isLoading && <p className="text-muted-foreground">Loading resignations…</p>}
      {resignationsQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
          Resignations API not yet available. Data will appear once the HRM backend module is deployed.
        </p>
      )}
      {!resignationsQuery.isLoading && !resignationsQuery.isError && (
        <DataTable<Resignation>
          columns={columns}
          data={resignations}
          rowKey={(r) => r.id}
          searchableFields={['employeeName', 'employeeNumber', 'department', 'designation']}
          pageSize={15}
          emptyMessage="No resignation requests on record."
        />
      )}
    </div>
  )
}
