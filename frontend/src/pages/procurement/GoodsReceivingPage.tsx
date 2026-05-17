import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { formatCurrency, formatDate } from '../../lib/utils'

type GRNStatus = 'Draft' | 'Confirmed' | 'PartialReturn' | 'Rejected'

type GRNItem = {
  description: string
  orderedQty: number
  receivedQty: number
  rejectedQty: number
  unitPrice: number
  condition: 'Good' | 'Damaged' | 'Partial'
}

type GRN = {
  id: string
  grnNumber: string
  poId: string
  poNumber: string
  vendorName: string
  receivedDate: string
  receivedBy: string
  status: GRNStatus
  totalItemsOrdered: number
  totalItemsReceived: number
  totalValue: number
  remarks?: string
  items: GRNItem[]
}

type GRNSummary = {
  total: number
  draft: number
  confirmed: number
  pendingPOs: number
  totalValueReceived: number
}

type OpenPO = { id: string; poNumber: string; vendorName: string; netAmount: number }

const STATUS_COLORS: Record<GRNStatus, string> = {
  Draft:          'bg-gray-100 text-gray-600',
  Confirmed:      'bg-emerald-100 text-emerald-700',
  PartialReturn:  'bg-amber-100 text-amber-700',
  Rejected:       'bg-red-100 text-red-700',
}

const CONDITION_COLORS: Record<string, string> = {
  Good:    'text-emerald-700',
  Damaged: 'text-red-600',
  Partial: 'text-amber-600',
}

const BLANK_FORM = { poId: '', receivedDate: '', remarks: '' }

export default function GoodsReceivingPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [detailGRN, setDetailGRN] = useState<GRN | null>(null)
  const [form, setForm] = useState(BLANK_FORM)

  const summaryQuery = useQuery({
    queryKey: ['grn-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<GRNSummary>('/procurement/grn/summary')
      return res.data
    },
    retry: false,
  })

  const grnQuery = useQuery({
    queryKey: ['grn-list'],
    queryFn: async () => {
      const res = await axiosClient.get<GRN[] | { items: GRN[] }>('/procurement/grn')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const openPOsQuery = useQuery({
    queryKey: ['open-pos-for-grn'],
    queryFn: async () => {
      const res = await axiosClient.get<OpenPO[] | { items: OpenPO[] }>('/procurement/purchase-orders', { params: { status: 'Issued' } })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof BLANK_FORM) => axiosClient.post('/procurement/grn', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grn-list'] })
      qc.invalidateQueries({ queryKey: ['grn-summary'] })
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      qc.invalidateQueries({ queryKey: ['po-summary'] })
      setShowCreate(false)
      setForm(BLANK_FORM)
    },
  })

  const confirmMutation = useMutation({
    mutationFn: (id: string) => axiosClient.patch(`/procurement/grn/${id}/confirm`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grn-list'] })
      qc.invalidateQueries({ queryKey: ['grn-summary'] })
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      qc.invalidateQueries({ queryKey: ['po-summary'] })
    },
  })

  const s = summaryQuery.data
  const grns = grnQuery.data ?? []
  const openPOs = openPOsQuery.data ?? []

  const columns: Column<GRN>[] = [
    {
      key: 'grnNumber',
      header: 'GRN #',
      width: '115px',
      render: (r) => (
        <button onClick={() => setDetailGRN(r)} className="font-mono text-xs font-semibold text-primary-700 hover:underline">
          {r.grnNumber}
        </button>
      ),
    },
    {
      key: 'poNumber',
      header: 'PO / Vendor',
      render: (r) => (
        <div>
          <p className="font-mono text-xs text-muted-foreground">{r.poNumber}</p>
          <p className="font-medium text-gray-900">{r.vendorName}</p>
        </div>
      ),
    },
    {
      key: 'receivedDate',
      header: 'Received',
      width: '105px',
      render: (r) => <span className="font-mono text-xs">{formatDate(r.receivedDate)}</span>,
    },
    { key: 'receivedBy', header: 'Received By', width: '130px' },
    {
      key: 'totalItemsReceived',
      header: 'Items',
      width: '90px',
      render: (r) => (
        <span className={r.totalItemsReceived < r.totalItemsOrdered ? 'text-amber-600 font-medium' : 'text-emerald-700 font-medium'}>
          {r.totalItemsReceived}/{r.totalItemsOrdered}
        </span>
      ),
    },
    {
      key: 'totalValue',
      header: 'Value',
      width: '120px',
      render: (r) => formatCurrency(r.totalValue),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status]}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'id',
      header: '',
      width: '100px',
      render: (r) =>
        r.status === 'Draft' ? (
          <button
            onClick={() => confirmMutation.mutate(r.id)}
            disabled={confirmMutation.isPending}
            className="px-3 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
          >
            Confirm
          </button>
        ) : null,
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Goods Receiving Notes</h1>
          <p className="text-sm text-muted-foreground">Record and confirm deliveries against issued purchase orders.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Create GRN
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total GRNs"        value={s?.total ?? '—'}                               icon="📦" />
        <KpiCard label="Draft"             value={s?.draft ?? '—'}                               icon="✏️" />
        <KpiCard label="Confirmed"         value={s?.confirmed ?? '—'}                           icon="✅" trend="up" />
        <KpiCard label="Value Received"    value={s ? formatCurrency(s.totalValueReceived) : '—'} icon="💰" />
      </div>

      {grnQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          GRN API not yet available. Will appear once the Procurement backend module is deployed.
        </p>
      )}

      {!grnQuery.isLoading && !grnQuery.isError && (
        <DataTable<GRN>
          columns={columns}
          data={grns}
          rowKey={(r) => r.id}
          searchableFields={['grnNumber', 'poNumber', 'vendorName', 'receivedBy']}
          pageSize={15}
          emptyMessage="No GRNs recorded yet."
        />
      )}

      {/* GRN detail modal */}
      <Modal open={!!detailGRN} onClose={() => setDetailGRN(null)} title={`GRN ${detailGRN?.grnNumber ?? ''}`} size="lg">
        {detailGRN && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-muted-foreground">PO:</span> <span className="font-mono">{detailGRN.poNumber}</span></div>
              <div><span className="text-muted-foreground">Vendor:</span> {detailGRN.vendorName}</div>
              <div><span className="text-muted-foreground">Received:</span> {formatDate(detailGRN.receivedDate)}</div>
              <div><span className="text-muted-foreground">By:</span> {detailGRN.receivedBy}</div>
              <div><span className="text-muted-foreground">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[detailGRN.status]}`}>{detailGRN.status}</span></div>
            </div>
            {detailGRN.items?.length > 0 && (
              <table className="w-full text-sm border-t border-border">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-gray-700">Item</th>
                    <th className="text-right py-2 text-gray-700 w-20">Ordered</th>
                    <th className="text-right py-2 text-gray-700 w-20">Received</th>
                    <th className="text-right py-2 text-gray-700 w-20">Rejected</th>
                    <th className="text-right py-2 text-gray-700 w-28">Condition</th>
                  </tr>
                </thead>
                <tbody>
                  {detailGRN.items.map((item, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-1.5">{item.description}</td>
                      <td className="py-1.5 text-right">{item.orderedQty}</td>
                      <td className="py-1.5 text-right font-medium text-emerald-700">{item.receivedQty}</td>
                      <td className="py-1.5 text-right text-red-600">{item.rejectedQty > 0 ? item.rejectedQty : '—'}</td>
                      <td className={`py-1.5 text-right font-medium ${CONDITION_COLORS[item.condition]}`}>{item.condition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {detailGRN.remarks && <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{detailGRN.remarks}</p>}
          </div>
        )}
      </Modal>

      {/* Create GRN modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Goods Receiving Note"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50">Cancel</button>
            <button form="grn-form" type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50">
              {createMutation.isPending ? 'Saving…' : 'Create GRN'}
            </button>
          </div>
        }
      >
        <form id="grn-form" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Order *</label>
            <select
              value={form.poId}
              onChange={(e) => setForm((p) => ({ ...p, poId: e.target.value }))}
              required
              className="w-full border border-input rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select issued PO…</option>
              {openPOs.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.poNumber} — {po.vendorName} ({formatCurrency(po.netAmount)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Received Date *</label>
            <input
              type="date"
              value={form.receivedDate}
              onChange={(e) => setForm((p) => ({ ...p, receivedDate: e.target.value }))}
              required
              className="w-full border border-input rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
            <textarea
              value={form.remarks}
              onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
              rows={3}
              placeholder="Delivery condition notes, partial deliveries, damaged items…"
              className="w-full border border-input rounded-lg px-3 py-2 text-sm"
            />
          </div>
          {createMutation.isError && <p className="text-sm text-red-600">Failed to create GRN. Please try again.</p>}
        </form>
      </Modal>
    </div>
  )
}
