import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../api/axiosClient'
import KpiCard from '../components/ui/KpiCard'
import DataTable, { type Column } from '../components/ui/DataTable'
import { formatCurrency, formatDate } from '../lib/utils'

type Invoice = {
  id: string
  invoiceNumber: string
  studentName: string
  rollNumber?: string
  amount: number
  paidAmount: number
  dueDate: string
  status: 'Pending' | 'Paid' | 'PartiallyPaid' | 'Overdue'
}

type Summary = {
  totalInvoiced: number
  totalCollected: number
  totalOutstanding: number
  collectionRate: number
}

export default function FeePage() {
  const summaryQuery = useQuery({
    queryKey: ['fee-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<Summary>('/finance/collection-summary')
      return res.data
    },
  })

  const invoicesQuery = useQuery({
    queryKey: ['fee-invoices'],
    queryFn: async () => {
      const res = await axiosClient.get<Invoice[] | { items: Invoice[] }>('/finance/invoices')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
  })

  const columns: Column<Invoice>[] = [
    { key: 'invoiceNumber', header: 'Invoice #', width: '130px' },
    { key: 'studentName', header: 'Student' },
    { key: 'rollNumber', header: 'Roll #' },
    {
      key: 'amount',
      header: 'Amount',
      render: (r) => formatCurrency(r.amount),
    },
    {
      key: 'paidAmount',
      header: 'Paid',
      render: (r) => formatCurrency(r.paidAmount),
    },
    {
      key: 'dueDate',
      header: 'Due',
      render: (r) => formatDate(r.dueDate),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const cls =
          r.status === 'Paid'
            ? 'bg-emerald-100 text-emerald-700'
            : r.status === 'Overdue'
            ? 'bg-red-100 text-red-700'
            : r.status === 'PartiallyPaid'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-gray-100 text-gray-700'
        return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{r.status}</span>
      },
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Fee Management</h1>
      <p className="text-sm text-muted-foreground mb-6">Track invoices, payments and outstanding balances.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Invoiced"
          value={summaryQuery.data ? formatCurrency(summaryQuery.data.totalInvoiced) : '—'}
          icon="🧾"
        />
        <KpiCard
          label="Collected"
          value={summaryQuery.data ? formatCurrency(summaryQuery.data.totalCollected) : '—'}
          trend="up"
          trendValue={summaryQuery.data ? `${(summaryQuery.data.collectionRate ?? 0).toFixed(1)}% collection rate` : undefined}
          icon="💵"
        />
        <KpiCard
          label="Outstanding"
          value={summaryQuery.data ? formatCurrency(summaryQuery.data.totalOutstanding) : '—'}
          trend="down"
          icon="⏳"
        />
        <KpiCard
          label="Invoices"
          value={invoicesQuery.data?.length ?? 0}
          icon="📄"
        />
      </div>

      {invoicesQuery.isLoading && <p className="text-muted-foreground">Loading invoices…</p>}
      {invoicesQuery.isError && <p className="text-red-600">Failed to load invoices.</p>}
      {!invoicesQuery.isLoading && !invoicesQuery.isError && (
        <DataTable<Invoice>
          columns={columns}
          data={invoicesQuery.data ?? []}
          rowKey={(r) => r.id}
          searchableFields={['invoiceNumber', 'studentName', 'rollNumber']}
          pageSize={15}
          emptyMessage="No invoices yet."
        />
      )}
    </div>
  )
}
