import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { formatCurrency, formatDate } from '../../lib/utils'

type QuotationStatus = 'Received' | 'UnderEvaluation' | 'Preferred' | 'Rejected' | 'Awarded'

type Quotation = {
  id: string
  quotationNumber: string
  prId: string
  prNumber: string
  prTitle: string
  vendorId: string
  vendorName: string
  receivedDate: string
  validUntil: string
  totalAmount: number
  deliveryDays: number
  status: QuotationStatus
  notes?: string
  items: Array<{ description: string; qty: number; unitPrice: number; total: number }>
}

type PR = { id: string; prNumber: string; title: string }

const STATUS_COLORS: Record<string, string> = {
  Received:        'bg-blue-100 text-blue-700',
  UnderEvaluation: 'bg-amber-100 text-amber-700',
  Preferred:       'bg-emerald-100 text-emerald-700',
  Rejected:        'bg-red-100 text-red-700',
  Awarded:         'bg-primary-100 text-primary-700',
}

export default function QuotationsPage() {
  const qc = useQueryClient()
  const [selectedPRId, setSelectedPRId] = useState<string>('')
  const [detailQuote, setDetailQuote] = useState<Quotation | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ prId: '', vendorId: '', receivedDate: '', validUntil: '', totalAmount: '', deliveryDays: '', notes: '' })

  const prQuery = useQuery({
    queryKey: ['procurement-prs-approved'],
    queryFn: async () => {
      const res = await axiosClient.get<PR[] | { items: PR[] }>('/procurement/purchase-requests', { params: { status: 'Approved' } })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const quotesQuery = useQuery({
    queryKey: ['quotations', selectedPRId],
    queryFn: async () => {
      const params = selectedPRId ? { prId: selectedPRId } : {}
      const res = await axiosClient.get<Quotation[] | { items: Quotation[] }>('/procurement/quotations', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const preferMutation = useMutation({
    mutationFn: (id: string) => axiosClient.patch(`/procurement/quotations/${id}/prefer`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotations'] }),
  })

  const addMutation = useMutation({
    mutationFn: (data: typeof addForm) => axiosClient.post('/procurement/quotations', {
      ...data,
      totalAmount: parseFloat(data.totalAmount) || 0,
      deliveryDays: parseInt(data.deliveryDays) || 0,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] })
      setShowAdd(false)
      setAddForm({ prId: '', vendorId: '', receivedDate: '', validUntil: '', totalAmount: '', deliveryDays: '', notes: '' })
    },
  })

  const prs = prQuery.data ?? []
  const quotes = quotesQuery.data ?? []

  // Group by PR for comparison view
  const grouped = quotes.reduce<Record<string, Quotation[]>>((acc, q) => {
    const key = `${q.prNumber} — ${q.prTitle}`
    acc[key] = [...(acc[key] ?? []), q]
    return acc
  }, {})

  const columns: Column<Quotation>[] = [
    {
      key: 'quotationNumber',
      header: 'Quote #',
      width: '110px',
      render: (r) => <span className="font-mono text-xs font-semibold text-primary-700">{r.quotationNumber}</span>,
    },
    {
      key: 'vendorName',
      header: 'Vendor',
      render: (r) => <p className="font-medium text-gray-900">{r.vendorName}</p>,
    },
    {
      key: 'prTitle',
      header: 'PR',
      render: (r) => (
        <div>
          <p className="text-xs font-mono text-muted-foreground">{r.prNumber}</p>
          <p className="text-sm">{r.prTitle}</p>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      width: '120px',
      render: (r) => <span className="font-semibold">{formatCurrency(r.totalAmount)}</span>,
    },
    { key: 'deliveryDays', header: 'Delivery', width: '90px', render: (r) => `${r.deliveryDays}d` },
    {
      key: 'validUntil',
      header: 'Valid Until',
      width: '105px',
      render: (r) => <span className="font-mono text-xs">{formatDate(r.validUntil)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status] ?? ''}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'id',
      header: '',
      width: '160px',
      render: (r) => (
        <div className="flex gap-2">
          <button
            onClick={() => setDetailQuote(r)}
            className="px-2 py-1 text-xs border border-border rounded hover:bg-gray-50"
          >
            Details
          </button>
          {r.status === 'Received' || r.status === 'UnderEvaluation' ? (
            <button
              onClick={() => preferMutation.mutate(r.id)}
              disabled={preferMutation.isPending}
              className="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
            >
              Prefer
            </button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quotations</h1>
          <p className="text-sm text-muted-foreground">Compare vendor quotations per purchase request and mark preferred.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add Quotation
        </button>
      </div>

      {/* PR filter */}
      <div className="bg-white rounded-xl border border-border p-4 mb-4 flex gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Purchase Request</label>
          <select
            value={selectedPRId}
            onChange={(e) => setSelectedPRId(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm min-w-[260px]"
          >
            <option value="">All PRs</option>
            {prs.map((p) => (
              <option key={p.id} value={p.id}>{p.prNumber} — {p.title}</option>
            ))}
          </select>
        </div>
        {selectedPRId && (
          <button
            onClick={() => setSelectedPRId('')}
            className="text-xs text-muted-foreground hover:text-gray-700 border border-border px-3 py-2 rounded-lg"
          >
            Clear
          </button>
        )}
      </div>

      {quotesQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Quotations API not yet available. Will appear once the Procurement backend module is deployed.
        </p>
      )}

      {/* Comparison view when filtering by PR */}
      {!quotesQuery.isLoading && !quotesQuery.isError && selectedPRId && (
        <div className="mb-6 space-y-4">
          {Object.entries(grouped).map(([prLabel, qs]) => {
            const sorted = [...qs].sort((a, b) => a.totalAmount - b.totalAmount)
            const lowest = sorted[0]?.totalAmount
            return (
              <div key={prLabel} className="bg-white rounded-xl border border-border p-5">
                <h2 className="font-semibold text-gray-900 mb-3">{prLabel}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sorted.map((q) => (
                    <div
                      key={q.id}
                      className={`border rounded-lg p-4 ${q.status === 'Preferred' ? 'border-emerald-400 bg-emerald-50' : 'border-border'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold text-gray-900">{q.vendorName}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[q.status]}`}>{q.status}</span>
                      </div>
                      <p className={`text-xl font-bold mb-1 ${q.totalAmount === lowest ? 'text-emerald-700' : 'text-gray-900'}`}>
                        {formatCurrency(q.totalAmount)}
                        {q.totalAmount === lowest && <span className="text-xs font-normal ml-1">Lowest</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">Delivery: {q.deliveryDays} days</p>
                      <p className="text-xs text-muted-foreground">Valid until: {formatDate(q.validUntil)}</p>
                      {(q.status === 'Received' || q.status === 'UnderEvaluation') && (
                        <button
                          onClick={() => preferMutation.mutate(q.id)}
                          disabled={preferMutation.isPending}
                          className="mt-3 w-full py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Mark as Preferred
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!quotesQuery.isLoading && !quotesQuery.isError && !selectedPRId && (
        <DataTable<Quotation>
          columns={columns}
          data={quotes}
          rowKey={(r) => r.id}
          searchableFields={['quotationNumber', 'vendorName', 'prNumber', 'prTitle']}
          pageSize={15}
          emptyMessage="No quotations recorded yet."
        />
      )}

      {/* Detail modal */}
      <Modal
        open={!!detailQuote}
        onClose={() => setDetailQuote(null)}
        title={`Quotation ${detailQuote?.quotationNumber ?? ''}`}
        size="lg"
      >
        {detailQuote && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Vendor:</span> <span className="font-medium">{detailQuote.vendorName}</span></div>
              <div><span className="text-muted-foreground">PR:</span> <span className="font-mono">{detailQuote.prNumber}</span></div>
              <div><span className="text-muted-foreground">Received:</span> {formatDate(detailQuote.receivedDate)}</div>
              <div><span className="text-muted-foreground">Valid Until:</span> {formatDate(detailQuote.validUntil)}</div>
              <div><span className="text-muted-foreground">Delivery:</span> {detailQuote.deliveryDays} days</div>
              <div><span className="text-muted-foreground">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[detailQuote.status]}`}>{detailQuote.status}</span></div>
            </div>
            {detailQuote.items?.length > 0 && (
              <table className="w-full text-sm border-t border-border pt-3">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-gray-700">Description</th>
                    <th className="text-right py-2 text-gray-700 w-16">Qty</th>
                    <th className="text-right py-2 text-gray-700 w-24">Unit Price</th>
                    <th className="text-right py-2 text-gray-700 w-28">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detailQuote.items.map((item, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-1.5">{item.description}</td>
                      <td className="py-1.5 text-right">{item.qty}</td>
                      <td className="py-1.5 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-1.5 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td colSpan={3} className="pt-2 text-right">Total</td>
                    <td className="pt-2 text-right text-primary-700">{formatCurrency(detailQuote.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            )}
            {detailQuote.notes && (
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{detailQuote.notes}</p>
            )}
          </div>
        )}
      </Modal>

      {/* Add quotation modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Quotation"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              form="quote-form"
              type="submit"
              disabled={addMutation.isPending}
              className="px-4 py-2 text-sm bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50"
            >
              {addMutation.isPending ? 'Saving…' : 'Save Quotation'}
            </button>
          </div>
        }
      >
        <form id="quote-form" onSubmit={(e) => { e.preventDefault(); addMutation.mutate(addForm) }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Request *</label>
            <select
              value={addForm.prId}
              onChange={(e) => setAddForm((p) => ({ ...p, prId: e.target.value }))}
              required
              className="w-full border border-input rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select PR…</option>
              {prs.map((p) => <option key={p.id} value={p.id}>{p.prNumber} — {p.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Vendor ID *</label>
            <input
              value={addForm.vendorId}
              onChange={(e) => setAddForm((p) => ({ ...p, vendorId: e.target.value }))}
              required
              placeholder="Vendor ID"
              className="w-full border border-input rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Received Date *</label>
              <input type="date" value={addForm.receivedDate} onChange={(e) => setAddForm((p) => ({ ...p, receivedDate: e.target.value }))} required className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Valid Until *</label>
              <input type="date" value={addForm.validUntil} onChange={(e) => setAddForm((p) => ({ ...p, validUntil: e.target.value }))} required className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Total Amount (PKR) *</label>
              <input type="number" value={addForm.totalAmount} onChange={(e) => setAddForm((p) => ({ ...p, totalAmount: e.target.value }))} required min={0} className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Days</label>
              <input type="number" value={addForm.deliveryDays} onChange={(e) => setAddForm((p) => ({ ...p, deliveryDays: e.target.value }))} min={0} className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={addForm.notes} onChange={(e) => setAddForm((p) => ({ ...p, notes: e.target.value }))} rows={2} className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          {addMutation.isError && <p className="text-sm text-red-600">Failed to save quotation.</p>}
        </form>
      </Modal>
    </div>
  )
}
