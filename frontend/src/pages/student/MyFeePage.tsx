import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import { authStore } from '../../store/authStore'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatCurrency, formatDate } from '../../lib/utils'

type Invoice = {
  id: string
  invoiceNumber: string
  amount: number
  paidAmount: number
  dueDate: string
  status: 'Pending' | 'Paid' | 'PartiallyPaid' | 'Overdue'
  termName?: string
}

export default function MyFeePage() {
  const { user } = authStore.getState()

  const invoices = useQuery({
    queryKey: ['my-invoices', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await axiosClient.get<Invoice[] | { items: Invoice[] }>('/finance/invoices', {
        params: { studentId: user!.id },
        headers: { 'x-skip-error-toast': '1' },
      })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: 0,
  })

  const rows = invoices.data ?? []
  const billed = rows.reduce((s, r) => s + r.amount, 0)
  const paid = rows.reduce((s, r) => s + r.paidAmount, 0)
  const due = Math.max(0, billed - paid)
  const overdue = rows.filter((r) => r.status === 'Overdue').length

  const columns: Column<Invoice>[] = [
    { key: 'invoiceNumber', header: 'Invoice #', width: '130px' },
    { key: 'termName', header: 'Term', render: (r) => r.termName ?? '—' },
    { key: 'amount', header: 'Billed', render: (r) => formatCurrency(r.amount) },
    { key: 'paidAmount', header: 'Paid', render: (r) => formatCurrency(r.paidAmount) },
    { key: 'dueDate', header: 'Due', render: (r) => formatDate(r.dueDate) },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const cls =
          r.status === 'Paid' ? 'bg-emerald-100 text-emerald-700'
          : r.status === 'Overdue' ? 'bg-red-100 text-red-700'
          : r.status === 'PartiallyPaid' ? 'bg-amber-100 text-amber-700'
          : 'bg-gray-100 text-gray-700'
        return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{r.status}</span>
      },
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">My Fee Statement</h1>
      <p className="text-sm text-muted-foreground mb-6">Every invoice issued to you, with payment status.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Billed" value={formatCurrency(billed)} icon="🧾" />
        <KpiCard label="Paid" value={formatCurrency(paid)} trend="up" icon="💵" />
        <KpiCard label="Outstanding" value={formatCurrency(due)} trend={due > 0 ? 'down' : 'neutral'} icon="⏳" />
        <KpiCard label="Overdue" value={overdue} trend={overdue > 0 ? 'down' : 'neutral'} icon="⚠️" />
      </div>

      {invoices.isLoading && <p className="text-muted-foreground">Loading invoices…</p>}
      {invoices.isError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Fee statement endpoint not yet available.
        </div>
      )}
      {!invoices.isLoading && !invoices.isError && (
        <DataTable<Invoice>
          columns={columns}
          data={rows}
          rowKey={(r) => r.id}
          searchableFields={['invoiceNumber', 'termName']}
          pageSize={15}
          emptyMessage="No invoices issued yet."
        />
      )}
    </div>
  )
}
