import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatCurrency } from '../../lib/utils'

type Summary = {
  totalInvoiced: number
  totalCollected: number
  totalOutstanding: number
  collectionRate: number
}

type Campus = {
  id: string
  name: string
  studentCount?: number
  collectedAmount?: number
  outstandingAmount?: number
}

export default function FinancePage() {
  const summary = useQuery({
    queryKey: ['inst-fee-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<Summary>('/finance/collection-summary')
      return res.data
    },
  })

  const campuses = useQuery({
    queryKey: ['inst-campuses'],
    queryFn: async () => {
      const res = await axiosClient.get<Campus[] | { items: Campus[] }>('/campuses')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
  })

  const columns: Column<Campus>[] = [
    { key: 'name', header: 'Campus', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'studentCount', header: 'Students', render: (r) => r.studentCount ?? '—' },
    {
      key: 'collectedAmount',
      header: 'Collected',
      render: (r) => (r.collectedAmount != null ? formatCurrency(r.collectedAmount) : '—'),
    },
    {
      key: 'outstandingAmount',
      header: 'Outstanding',
      render: (r) => (r.outstandingAmount != null ? formatCurrency(r.outstandingAmount) : '—'),
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Institution Finance</h1>
      <p className="text-sm text-muted-foreground mb-6">Cross-campus collection and outstanding view.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Invoiced" value={summary.data ? formatCurrency(summary.data.totalInvoiced) : '—'} icon="🧾" />
        <KpiCard
          label="Collected"
          value={summary.data ? formatCurrency(summary.data.totalCollected) : '—'}
          trend="up"
          trendValue={summary.data ? `${(summary.data.collectionRate ?? 0).toFixed(1)}% collection rate` : undefined}
          icon="💵"
        />
        <KpiCard label="Outstanding" value={summary.data ? formatCurrency(summary.data.totalOutstanding) : '—'} trend="down" icon="⏳" />
        <KpiCard label="Campuses" value={campuses.data?.length ?? 0} icon="🏫" />
      </div>

      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Per-Campus Breakdown</h2>
        {campuses.isLoading && <p className="text-sm text-muted-foreground">Loading campuses…</p>}
        {campuses.isError && <p className="text-sm text-red-600">Failed to load campus list.</p>}
        {!campuses.isLoading && !campuses.isError && (
          <DataTable<Campus>
            columns={columns}
            data={campuses.data ?? []}
            rowKey={(r) => r.id}
            searchableFields={['name']}
            pageSize={15}
            emptyMessage="No campuses registered."
          />
        )}
      </div>
    </div>
  )
}
