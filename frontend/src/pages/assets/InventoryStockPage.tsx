import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { formatCurrency } from '../../lib/utils'

type StockItem = {
  id: string
  itemCode: string
  name: string
  category: string
  unit: string
  quantityInHand: number
  reorderLevel: number
  reorderQuantity: number
  location: string
  unitCost: number
  totalValue: number
  lastRestockedDate?: string
  supplierName?: string
  isConsumable: boolean
}

type InventorySummary = {
  totalItems: number
  lowStockItems: number
  outOfStockItems: number
  totalInventoryValue: number
  recentlyRestocked: number
}

const CATEGORIES = ['All', 'Stationery', 'Lab Supplies', 'Cleaning', 'Sports', 'Canteen', 'IT Accessories', 'Medical', 'Other']

const BLANK = {
  name: '', category: 'Stationery', unit: 'Pcs', quantityInHand: '', reorderLevel: '',
  reorderQuantity: '', location: '', unitCost: '', supplierName: '', isConsumable: true,
}

export default function InventoryStockPage() {
  const qc = useQueryClient()
  const [category, setCategory] = useState('All')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [restockItem, setRestockItem] = useState<StockItem | null>(null)
  const [restockQty, setRestockQty] = useState('')
  const [form, setForm] = useState(BLANK)

  const summaryQuery = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<InventorySummary>('/assets/inventory/summary')
      return res.data
    },
    retry: false,
  })

  const stockQuery = useQuery({
    queryKey: ['inventory-stock', category, lowStockOnly],
    queryFn: async () => {
      const params: Record<string, string | boolean> = {}
      if (category !== 'All') params.category = category
      if (lowStockOnly) params.lowStock = true
      const res = await axiosClient.get<StockItem[] | { items: StockItem[] }>('/assets/inventory', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof BLANK) => axiosClient.post('/assets/inventory', {
      ...data,
      quantityInHand: parseInt(data.quantityInHand as string) || 0,
      reorderLevel: parseInt(data.reorderLevel as string) || 0,
      reorderQuantity: parseInt(data.reorderQuantity as string) || 0,
      unitCost: parseFloat(data.unitCost as string) || 0,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-stock'] })
      qc.invalidateQueries({ queryKey: ['inventory-summary'] })
      qc.invalidateQueries({ queryKey: ['asset-summary'] })
      setShowCreate(false)
      setForm(BLANK)
    },
  })

  const restockMutation = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) =>
      axiosClient.patch(`/assets/inventory/${id}/restock`, { quantity: qty }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-stock'] })
      qc.invalidateQueries({ queryKey: ['inventory-summary'] })
      setRestockItem(null)
      setRestockQty('')
    },
  })

  const s = summaryQuery.data
  const items = stockQuery.data ?? []

  const columns: Column<StockItem>[] = [
    {
      key: 'itemCode',
      header: 'Code',
      width: '100px',
      render: (r) => <span className="font-mono text-xs font-semibold text-primary-700">{r.itemCode}</span>,
    },
    {
      key: 'name',
      header: 'Item',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.name}</p>
          <p className="text-xs text-muted-foreground">{r.category} · {r.unit}{r.isConsumable ? ' · Consumable' : ''}</p>
        </div>
      ),
    },
    { key: 'location', header: 'Location', width: '110px' },
    {
      key: 'quantityInHand',
      header: 'Qty On Hand',
      width: '110px',
      render: (r) => {
        const isLow = r.quantityInHand <= r.reorderLevel
        const isOut = r.quantityInHand === 0
        return (
          <div>
            <p className={`font-bold text-lg ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>
              {r.quantityInHand}
            </p>
            <p className="text-xs text-muted-foreground">Reorder at {r.reorderLevel}</p>
          </div>
        )
      },
    },
    {
      key: 'unitCost',
      header: 'Unit Cost',
      width: '110px',
      render: (r) => formatCurrency(r.unitCost),
    },
    {
      key: 'totalValue',
      header: 'Total Value',
      width: '120px',
      render: (r) => <span className="font-semibold">{formatCurrency(r.totalValue)}</span>,
    },
    { key: 'supplierName', header: 'Supplier', width: '130px', render: (r) => r.supplierName ?? '—' },
    {
      key: 'id',
      header: '',
      width: '90px',
      render: (r) => (
        <button
          onClick={() => setRestockItem(r)}
          className="px-3 py-1 text-xs bg-primary-700 text-white rounded hover:bg-primary-800"
        >
          Restock
        </button>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventory Stock</h1>
          <p className="text-sm text-muted-foreground">Track consumable and non-consumable stock with reorder alerts.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add Item
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Items"       value={s?.totalItems ?? '—'}                             icon="📦" />
        <KpiCard label="Low Stock"         value={s?.lowStockItems ?? '—'}                          icon="⚠️" trend={s && s.lowStockItems > 0 ? 'down' : 'up'} />
        <KpiCard label="Out of Stock"      value={s?.outOfStockItems ?? '—'}                        icon="🚨" trend={s && s.outOfStockItems > 0 ? 'down' : 'up'} />
        <KpiCard label="Inventory Value"   value={s ? formatCurrency(s.totalInventoryValue) : '—'} icon="💰" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center mb-4">
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${category === c ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-border hover:bg-gray-50'}`}>
              {c}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)}
            className="rounded border-gray-300" />
          Low stock only
        </label>
      </div>

      {stockQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Inventory API not yet available. Will appear once the Asset backend module is deployed.
        </p>
      )}

      {!stockQuery.isLoading && !stockQuery.isError && (
        <DataTable<StockItem>
          columns={columns}
          data={items}
          rowKey={(r) => r.id}
          searchableFields={['itemCode', 'name', 'category', 'location', 'supplierName']}
          pageSize={15}
          emptyMessage="No inventory items found."
        />
      )}

      {/* Restock modal */}
      <Modal
        open={!!restockItem}
        onClose={() => { setRestockItem(null); setRestockQty('') }}
        title={`Restock — ${restockItem?.name}`}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => { setRestockItem(null); setRestockQty('') }}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              onClick={() => restockItem && restockMutation.mutate({ id: restockItem.id, qty: parseInt(restockQty) || 0 })}
              disabled={restockMutation.isPending || !restockQty}
              className="px-4 py-2 text-sm bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50">
              {restockMutation.isPending ? 'Saving…' : 'Confirm Restock'}
            </button>
          </div>
        }
      >
        {restockItem && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p><span className="text-muted-foreground">Current Qty:</span> <span className="font-bold">{restockItem.quantityInHand} {restockItem.unit}</span></p>
              <p><span className="text-muted-foreground">Reorder Qty:</span> {restockItem.reorderQuantity} {restockItem.unit}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Quantity to Add *</label>
              <input
                type="number"
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                min={1}
                autoFocus
                className="w-full border border-input rounded-lg px-3 py-2 text-sm"
                placeholder={`Suggested: ${restockItem.reorderQuantity}`}
              />
            </div>
            {restockMutation.isError && <p className="text-sm text-red-600">Failed to restock item.</p>}
          </div>
        )}
      </Modal>

      {/* Create item modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add Inventory Item"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50">Cancel</button>
            <button form="inv-form" type="submit" disabled={createMutation.isPending}
              className="px-4 py-2 text-sm bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50">
              {createMutation.isPending ? 'Saving…' : 'Add Item'}
            </button>
          </div>
        }
      >
        <form id="inv-form" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Item Name *</label>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required
              className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
            <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} required
              className="w-full border border-input rounded-lg px-3 py-2 text-sm">
              {CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
            <select value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm">
              {['Pcs', 'Box', 'Kg', 'Litre', 'Ream', 'Set', 'Pack', 'Roll'].map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
          {(['quantityInHand', 'reorderLevel', 'reorderQuantity'] as const).map((key) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {key === 'quantityInHand' ? 'Qty In Hand *' : key === 'reorderLevel' ? 'Reorder Level' : 'Reorder Qty'}
              </label>
              <input type="number" value={form[key] as string} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                required={key === 'quantityInHand'} min={0}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Unit Cost (PKR)</label>
            <input type="number" value={form.unitCost} onChange={(e) => setForm((p) => ({ ...p, unitCost: e.target.value }))}
              min={0} className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Location *</label>
            <input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} required
              className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Supplier</label>
            <input value={form.supplierName} onChange={(e) => setForm((p) => ({ ...p, supplierName: e.target.value }))}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" id="consumable" checked={form.isConsumable}
              onChange={(e) => setForm((p) => ({ ...p, isConsumable: e.target.checked }))} className="rounded border-gray-300" />
            <label htmlFor="consumable" className="text-xs font-medium text-gray-700">Consumable item</label>
          </div>
          {createMutation.isError && <p className="col-span-2 text-sm text-red-600">Failed to add inventory item.</p>}
        </form>
      </Modal>
    </div>
  )
}
