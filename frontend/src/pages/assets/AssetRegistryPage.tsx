import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { formatCurrency, formatDate } from '../../lib/utils'

type AssetStatus = 'Active' | 'UnderMaintenance' | 'InStorage' | 'Disposed' | 'Lost'
type DepreciationMethod = 'StraightLine' | 'DecliningBalance' | 'None'

type Asset = {
  id: string
  assetCode: string
  name: string
  category: string
  subCategory?: string
  serialNumber?: string
  brand?: string
  model?: string
  purchaseDate: string
  purchaseCost: number
  currentBookValue: number
  location: string
  department?: string
  assignedTo?: string
  status: AssetStatus
  depreciationMethod: DepreciationMethod
  usefulLifeYears?: number
  warrantyExpiry?: string
  notes?: string
}

type RegistrySummary = {
  total: number
  active: number
  underMaintenance: number
  disposed: number
  totalPurchaseCost: number
  totalBookValue: number
}

const STATUS_COLORS: Record<AssetStatus, string> = {
  Active:           'bg-emerald-100 text-emerald-700',
  UnderMaintenance: 'bg-amber-100 text-amber-700',
  InStorage:        'bg-blue-100 text-blue-700',
  Disposed:         'bg-gray-100 text-gray-500',
  Lost:             'bg-red-100 text-red-700',
}

const CATEGORIES = ['All', 'IT Equipment', 'Furniture', 'Vehicles', 'Lab Equipment', 'Sports Equipment', 'Office Equipment', 'AV Equipment', 'Other']

const BLANK: Partial<Asset> = {
  name: '', category: 'IT Equipment', serialNumber: '', brand: '', model: '',
  purchaseDate: '', purchaseCost: 0, location: '', department: '',
  depreciationMethod: 'StraightLine', usefulLifeYears: 5, notes: '',
}

export default function AssetRegistryPage() {
  const qc = useQueryClient()
  const [category, setCategory] = useState('All')
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'All'>('All')
  const [showCreate, setShowCreate] = useState(false)
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null)
  const [form, setForm] = useState(BLANK)

  const summaryQuery = useQuery({
    queryKey: ['asset-registry-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<RegistrySummary>('/assets/registry/summary')
      return res.data
    },
    retry: false,
  })

  const assetsQuery = useQuery({
    queryKey: ['asset-registry', category, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (category !== 'All') params.category = category
      if (statusFilter !== 'All') params.status = statusFilter
      const res = await axiosClient.get<Asset[] | { items: Asset[] }>('/assets/registry', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Asset>) => axiosClient.post('/assets/registry', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-registry'] })
      qc.invalidateQueries({ queryKey: ['asset-registry-summary'] })
      qc.invalidateQueries({ queryKey: ['asset-summary'] })
      setShowCreate(false)
      setForm(BLANK)
    },
  })

  const disposeMutation = useMutation({
    mutationFn: (id: string) => axiosClient.patch(`/assets/registry/${id}/dispose`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-registry'] })
      qc.invalidateQueries({ queryKey: ['asset-registry-summary'] })
      setDetailAsset(null)
    },
  })

  const s = summaryQuery.data
  const assets = assetsQuery.data ?? []

  const STATUS_FILTERS: Array<AssetStatus | 'All'> = ['All', 'Active', 'UnderMaintenance', 'InStorage', 'Disposed', 'Lost']

  const columns: Column<Asset>[] = [
    {
      key: 'assetCode',
      header: 'Code',
      width: '110px',
      render: (r) => (
        <button onClick={() => setDetailAsset(r)} className="font-mono text-xs font-semibold text-primary-700 hover:underline">
          {r.assetCode}
        </button>
      ),
    },
    {
      key: 'name',
      header: 'Asset',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.name}</p>
          <p className="text-xs text-muted-foreground">{r.brand} {r.model}</p>
        </div>
      ),
    },
    { key: 'category',    header: 'Category',  width: '130px' },
    { key: 'location',    header: 'Location',  width: '120px' },
    {
      key: 'purchaseDate',
      header: 'Purchased',
      width: '105px',
      render: (r) => <span className="font-mono text-xs">{formatDate(r.purchaseDate)}</span>,
    },
    {
      key: 'purchaseCost',
      header: 'Cost',
      width: '120px',
      render: (r) => formatCurrency(r.purchaseCost),
    },
    {
      key: 'currentBookValue',
      header: 'Book Value',
      width: '120px',
      render: (r) => (
        <span className={r.currentBookValue < r.purchaseCost * 0.2 ? 'text-amber-600 font-medium' : ''}>
          {formatCurrency(r.currentBookValue)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status]}`}>
          {r.status}
        </span>
      ),
    },
  ]

  function inp(key: keyof typeof BLANK, label: string, type = 'text', required = false) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">{label}{required ? ' *' : ''}</label>
        <input
          type={type}
          value={(form[key] as string | number) ?? ''}
          onChange={(e) => setForm((p) => ({ ...p, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
          required={required}
          className="w-full border border-input rounded-lg px-3 py-2 text-sm"
        />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Asset Registry</h1>
          <p className="text-sm text-muted-foreground">Complete register of all campus assets with lifecycle tracking.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add Asset
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Assets"      value={s?.total ?? '—'}                           icon="🗂️" />
        <KpiCard label="Active"            value={s?.active ?? '—'}                          icon="✅" trend="up" />
        <KpiCard label="Total Cost"        value={s ? formatCurrency(s.totalPurchaseCost) : '—'} icon="💰" />
        <KpiCard label="Total Book Value"  value={s ? formatCurrency(s.totalBookValue) : '—'}    icon="📉" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap mb-4">
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${category === c ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-border hover:bg-gray-50'}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((sf) => (
            <button key={sf} onClick={() => setStatusFilter(sf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${statusFilter === sf ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-border hover:bg-gray-50'}`}>
              {sf}
            </button>
          ))}
        </div>
      </div>

      {assetsQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Asset registry API not yet available. Will appear once the Asset backend module is deployed.
        </p>
      )}

      {!assetsQuery.isLoading && !assetsQuery.isError && (
        <DataTable<Asset>
          columns={columns}
          data={assets}
          rowKey={(r) => r.id}
          searchableFields={['assetCode', 'name', 'category', 'brand', 'model', 'serialNumber', 'location']}
          pageSize={15}
          emptyMessage="No assets in registry."
        />
      )}

      {/* Asset detail modal */}
      <Modal open={!!detailAsset} onClose={() => setDetailAsset(null)} title={`Asset — ${detailAsset?.assetCode}`} size="lg">
        {detailAsset && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{detailAsset.name}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[detailAsset.status]}`}>{detailAsset.status}</span></div>
              <div><span className="text-muted-foreground">Category:</span> {detailAsset.category}</div>
              <div><span className="text-muted-foreground">Serial #:</span> <span className="font-mono">{detailAsset.serialNumber ?? '—'}</span></div>
              <div><span className="text-muted-foreground">Brand / Model:</span> {detailAsset.brand} {detailAsset.model}</div>
              <div><span className="text-muted-foreground">Location:</span> {detailAsset.location}</div>
              <div><span className="text-muted-foreground">Department:</span> {detailAsset.department ?? '—'}</div>
              <div><span className="text-muted-foreground">Assigned To:</span> {detailAsset.assignedTo ?? 'Unassigned'}</div>
              <div><span className="text-muted-foreground">Purchase Date:</span> {formatDate(detailAsset.purchaseDate)}</div>
              <div><span className="text-muted-foreground">Purchase Cost:</span> {formatCurrency(detailAsset.purchaseCost)}</div>
              <div><span className="text-muted-foreground">Book Value:</span> <span className="font-semibold">{formatCurrency(detailAsset.currentBookValue)}</span></div>
              <div><span className="text-muted-foreground">Depreciation:</span> {detailAsset.depreciationMethod}</div>
              {detailAsset.warrantyExpiry && <div><span className="text-muted-foreground">Warranty:</span> {formatDate(detailAsset.warrantyExpiry)}</div>}
              {detailAsset.usefulLifeYears && <div><span className="text-muted-foreground">Useful Life:</span> {detailAsset.usefulLifeYears} years</div>}
            </div>
            {detailAsset.notes && <p className="text-sm bg-gray-50 rounded-lg p-3">{detailAsset.notes}</p>}
            {detailAsset.status !== 'Disposed' && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => disposeMutation.mutate(detailAsset.id)}
                  disabled={disposeMutation.isPending}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {disposeMutation.isPending ? 'Processing…' : 'Mark as Disposed'}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create asset modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Register New Asset"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50">Cancel</button>
            <button form="asset-form" type="submit" disabled={createMutation.isPending}
              className="px-4 py-2 text-sm bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50">
              {createMutation.isPending ? 'Saving…' : 'Register Asset'}
            </button>
          </div>
        }
      >
        <form id="asset-form" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="grid grid-cols-2 gap-4">
          {inp('name',         'Asset Name',     'text', true)}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
            <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} required
              className="w-full border border-input rounded-lg px-3 py-2 text-sm">
              {CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          {inp('brand',        'Brand')}
          {inp('model',        'Model')}
          {inp('serialNumber', 'Serial Number')}
          {inp('location',     'Location',   'text', true)}
          {inp('department',   'Department')}
          {inp('purchaseDate', 'Purchase Date', 'date', true)}
          {inp('purchaseCost', 'Purchase Cost (PKR)', 'number', true)}
          {inp('usefulLifeYears', 'Useful Life (Years)', 'number')}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Depreciation Method</label>
            <select value={form.depreciationMethod} onChange={(e) => setForm((p) => ({ ...p, depreciationMethod: e.target.value as DepreciationMethod }))}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm">
              <option value="StraightLine">Straight Line</option>
              <option value="DecliningBalance">Declining Balance</option>
              <option value="None">None</option>
            </select>
          </div>
          {inp('warrantyExpiry', 'Warranty Expiry', 'date')}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes ?? ''} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={2} className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          {createMutation.isError && <p className="col-span-2 text-sm text-red-600">Failed to register asset. Please try again.</p>}
        </form>
      </Modal>
    </div>
  )
}
