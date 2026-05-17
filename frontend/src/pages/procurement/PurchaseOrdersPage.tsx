import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { formatCurrency, formatDate } from '../../lib/utils'

type POStatus = 'Draft' | 'Issued' | 'PartiallyReceived' | 'FullyReceived' | 'Closed' | 'Cancelled'

type PurchaseOrder = {
  id: string
  poNumber: string
  quotationId?: string
  vendorId: string
  vendorName: string
  prNumber?: string
  issueDate: string
  expectedDelivery: string
  totalAmount: number
  taxAmount: number
  netAmount: number
  status: POStatus
  paymentTerms: string
  deliveryAddress: string
  issuedBy?: string
  receivedAmount?: number
  items: Array<{ description: string; qty: number; unitPrice: number; total: number }>
}

type POSummary = {
  total: number
  draft: number
  issued: number
  partiallyReceived: number
  fullyReceived: number
  totalValue: number
}

const STATUS_COLORS: Record<string, string> = {
  Draft:              'bg-gray-100 text-gray-600',
  Issued:             'bg-blue-100 text-blue-700',
  PartiallyReceived:  'bg-amber-100 text-amber-700',
  FullyReceived:      'bg-emerald-100 text-emerald-700',
  Closed:             'bg-primary-100 text-primary-700',
  Cancelled:          'bg-red-100 text-red-600',
}

const NEXT_ACTION: Partial<Record<POStatus, { label: string; endpoint: string; color: string }>> = {
  Draft:   { label: 'Issue PO',  endpoint: 'issue',  color: 'bg-blue-600 hover:bg-blue-700 text-white' },
  Issued:  { label: 'Close PO', endpoint: 'close',  color: 'bg-primary-700 hover:bg-primary-800 text-white' },
}

const BLANK_FORM = {
  vendorId: '', quotationId: '', issueDate: '', expectedDelivery: '',
  totalAmount: '', taxAmount: '', paymentTerms: 'Net 30', deliveryAddress: '',
}

export default function PurchaseOrdersPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<POStatus | 'All'>('All')
  const [detailPO, setDetailPO] = useState<PurchaseOrder | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)

  const summaryQuery = useQuery({
    queryKey: ['po-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<POSummary>('/procurement/purchase-orders/summary')
      return res.data
    },
    retry: false,
  })

  const poQuery = useQuery({
    queryKey: ['purchase-orders', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'All' ? { status: statusFilter } : {}
      const res = await axiosClient.get<PurchaseOrder[] | { items: PurchaseOrder[] }>('/procurement/purchase-orders', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof BLANK_FORM) => axiosClient.post('/procurement/purchase-orders', {
      ...data,
      totalAmount: parseFloat(data.totalAmount) || 0,
      taxAmount: parseFloat(data.taxAmount) || 0,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      qc.invalidateQueries({ queryKey: ['po-summary'] })
      setShowCreate(false)
      setForm(BLANK_FORM)
    },
  })

  const transitionMutation = useMutation({
    mutationFn: ({ id, endpoint }: { id: string; endpoint: string }) =>
      axiosClient.patch(`/procurement/purchase-orders/${id}/${endpoint}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      qc.invalidateQueries({ queryKey: ['po-summary'] })
    },
  })

  const s = summaryQuery.data
  const pos = poQuery.data ?? []
  const STATUS_FILTERS: Array<POStatus | 'All'> = ['All', 'Draft', 'Issued', 'PartiallyReceived', 'FullyReceived', 'Closed', 'Cancelled']

  const columns: Column<PurchaseOrder>[] = [
    {
      key: 'poNumber',
      header: 'PO #',
      width: '115px',
      render: (r) => (
        <button onClick={() => setDetailPO(r)} className="font-mono text-xs font-semibold text-primary-700 hover:underline">
          {r.poNumber}
        </button>
      ),
    },
    {
      key: 'vendorName',
      header: 'Vendor',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.vendorName}</p>
          {r.prNumber && <p className="text-xs text-muted-foreground font-mono">PR: {r.prNumber}</p>}
        </div>
      ),
    },
    {
      key: 'issueDate',
      header: 'Issue Date',
      width: '105px',
      render: (r) => <span className="font-mono text-xs">{formatDate(r.issueDate)}</span>,
    },
    {
      key: 'expectedDelivery',
      header: 'Expected',
      width: '105px',
      render: (r) => <span className="font-mono text-xs">{formatDate(r.expectedDelivery)}</span>,
    },
    {
      key: 'netAmount',
      header: 'Net Amount',
      width: '130px',
      render: (r) => <span className="font-semibold">{formatCurrency(r.netAmount)}</span>,
    },
    { key: 'paymentTerms', header: 'Payment', width: '90px' },
    {
      key: 'status',
      header: 'Status',
      width: '145px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status] ?? ''}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'id',
      header: '',
      width: '120px',
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
          <h1 className="text-2xl font-semibold text-gray-900">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">Manage issued purchase orders and track delivery status.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Create PO
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total POs"          value={s?.total ?? '—'}                                 icon="🛒" />
        <KpiCard label="Issued"             value={s?.issued ?? '—'}                               icon="📤" />
        <KpiCard label="Partially Received" value={s?.partiallyReceived ?? '—'}                    icon="📦" />
        <KpiCard label="Total Value"        value={s ? formatCurrency(s.totalValue) : '—'}         icon="💰" />
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

      {poQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Purchase orders API not yet available. Will appear once the Procurement backend module is deployed.
        </p>
      )}

      {!poQuery.isLoading && !poQuery.isError && (
        <DataTable<PurchaseOrder>
          columns={columns}
          data={pos}
          rowKey={(r) => r.id}
          searchableFields={['poNumber', 'vendorName', 'prNumber', 'paymentTerms']}
          pageSize={15}
          emptyMessage="No purchase orders yet."
        />
      )}

      {/* PO detail modal */}
      <Modal open={!!detailPO} onClose={() => setDetailPO(null)} title={`PO ${detailPO?.poNumber ?? ''}`} size="lg">
        {detailPO && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-muted-foreground">Vendor:</span> <span className="font-medium">{detailPO.vendorName}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[detailPO.status]}`}>{detailPO.status}</span></div>
              <div><span className="text-muted-foreground">Issue Date:</span> {formatDate(detailPO.issueDate)}</div>
              <div><span className="text-muted-foreground">Expected:</span> {formatDate(detailPO.expectedDelivery)}</div>
              <div><span className="text-muted-foreground">Payment:</span> {detailPO.paymentTerms}</div>
              <div><span className="text-muted-foreground">Delivery To:</span> {detailPO.deliveryAddress}</div>
            </div>
            {detailPO.items?.length > 0 && (
              <table className="w-full text-sm border-t border-border">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-gray-700">Item</th>
                    <th className="text-right py-2 text-gray-700 w-16">Qty</th>
                    <th className="text-right py-2 text-gray-700 w-24">Unit</th>
                    <th className="text-right py-2 text-gray-700 w-28">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detailPO.items.map((item, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-1.5">{item.description}</td>
                      <td className="py-1.5 text-right">{item.qty}</td>
                      <td className="py-1.5 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-1.5 text-right">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border">
                    <td colSpan={3} className="pt-2 text-right font-medium">Subtotal</td>
                    <td className="pt-2 text-right">{formatCurrency(detailPO.totalAmount)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-1 text-right text-muted-foreground">Tax</td>
                    <td className="py-1 text-right text-muted-foreground">{formatCurrency(detailPO.taxAmount)}</td>
                  </tr>
                  <tr className="font-bold text-base">
                    <td colSpan={3} className="pt-1 text-right text-primary-900">Net Amount</td>
                    <td className="pt-1 text-right text-primary-700">{formatCurrency(detailPO.netAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        )}
      </Modal>

      {/* Create PO modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Purchase Order"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50">Cancel</button>
            <button form="po-form" type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50">
              {createMutation.isPending ? 'Saving…' : 'Create PO'}
            </button>
          </div>
        }
      >
        <form id="po-form" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Vendor ID *</label>
            <input value={form.vendorId} onChange={(e) => setForm((p) => ({ ...p, vendorId: e.target.value }))} required placeholder="Vendor ID" className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Quotation ID (optional)</label>
            <input value={form.quotationId} onChange={(e) => setForm((p) => ({ ...p, quotationId: e.target.value }))} placeholder="Link to quotation" className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Issue Date *</label>
              <input type="date" value={form.issueDate} onChange={(e) => setForm((p) => ({ ...p, issueDate: e.target.value }))} required className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Expected Delivery *</label>
              <input type="date" value={form.expectedDelivery} onChange={(e) => setForm((p) => ({ ...p, expectedDelivery: e.target.value }))} required className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Total Amount (PKR) *</label>
              <input type="number" value={form.totalAmount} onChange={(e) => setForm((p) => ({ ...p, totalAmount: e.target.value }))} required min={0} className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tax Amount (PKR)</label>
              <input type="number" value={form.taxAmount} onChange={(e) => setForm((p) => ({ ...p, taxAmount: e.target.value }))} min={0} className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Payment Terms</label>
            <select value={form.paymentTerms} onChange={(e) => setForm((p) => ({ ...p, paymentTerms: e.target.value }))} className="w-full border border-input rounded-lg px-3 py-2 text-sm">
              {['Net 7', 'Net 15', 'Net 30', 'Net 60', 'Advance', 'On Delivery'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Address</label>
            <textarea value={form.deliveryAddress} onChange={(e) => setForm((p) => ({ ...p, deliveryAddress: e.target.value }))} rows={2} className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          {createMutation.isError && <p className="text-sm text-red-600">Failed to create purchase order.</p>}
        </form>
      </Modal>
    </div>
  )
}
