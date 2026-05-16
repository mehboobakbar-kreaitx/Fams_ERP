import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import { formatCurrency } from '../../lib/utils'

type ChildSummary = {
  studentId: string
  name: string
  feeBalance: number
}

type Invoice = {
  id: string
  invoiceNumber: string
  amount: number
  paidAmount: number
  dueDate: string
  status: string
}

type ParentDashboardDto = { children: ChildSummary[]; totalOutstandingFees: number }

export default function ParentFeePage() {
  const dash = useQuery({
    queryKey: ['parent-fee'],
    queryFn: async () => {
      const res = await axiosClient.get<ParentDashboardDto>('/dashboard/parent')
      return res.data
    },
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Fee</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Total outstanding across all children: <b>{dash.data ? formatCurrency(dash.data.totalOutstandingFees) : '—'}</b>
      </p>

      <div className="space-y-6">
        {(dash.data?.children ?? []).map((c) => (
          <ChildInvoicesBlock key={c.studentId} child={c} />
        ))}
      </div>
    </div>
  )
}

function ChildInvoicesBlock({ child }: { child: ChildSummary }) {
  const inv = useQuery({
    queryKey: ['parent-child-invoices', child.studentId],
    queryFn: async () => {
      const res = await axiosClient.get<Invoice[] | { items: Invoice[] }>('/finance/invoices', {
        params: { studentId: child.studentId },
        headers: { 'x-skip-error-toast': '1' },
      })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: 0,
  })

  return (
    <div className="bg-white border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900">{child.name}</h2>
        <span className="text-sm">Balance: <b>{formatCurrency(child.feeBalance)}</b></span>
      </div>
      {inv.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {inv.isError && <p className="text-sm text-amber-700">Invoices not available.</p>}
      {!inv.isLoading && !inv.isError && (inv.data ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">No invoices.</p>
      )}
      {(inv.data ?? []).length > 0 && (
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-gray-700">Invoice #</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-700">Amount</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-700">Paid</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {(inv.data ?? []).map((i) => (
              <tr key={i.id} className="border-b border-border">
                <td className="px-3 py-2 font-mono text-xs">{i.invoiceNumber}</td>
                <td className="px-3 py-2">{formatCurrency(i.amount)}</td>
                <td className="px-3 py-2">{formatCurrency(i.paidAmount)}</td>
                <td className="px-3 py-2">{i.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
