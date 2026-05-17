import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'

type Vendor = {
  id: string
  name: string
  code: string
  category: string
  contactPerson: string
  email: string
  phone: string
  address: string
  taxNumber?: string
  bankAccount?: string
  status: 'Active' | 'Inactive' | 'Blacklisted' | 'PendingApproval'
  rating?: number
  totalOrders: number
  totalSpend: number
  registeredAt: string
}

type VendorSummary = {
  total: number
  active: number
  pendingApproval: number
  blacklisted: number
}

const STATUS_COLORS: Record<string, string> = {
  Active:           'bg-emerald-100 text-emerald-700',
  Inactive:         'bg-gray-100 text-gray-600',
  Blacklisted:      'bg-red-100 text-red-700',
  PendingApproval:  'bg-amber-100 text-amber-700',
}

const CATEGORIES = ['All', 'Stationery', 'IT Equipment', 'Furniture', 'Maintenance', 'Catering', 'Transport', 'Utilities', 'Other']

const BLANK_FORM = { name: '', code: '', category: 'Stationery', contactPerson: '', email: '', phone: '', address: '', taxNumber: '', bankAccount: '' }

export default function VendorsPage() {
  const qc = useQueryClient()
  const [category, setCategory] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)

  const summaryQuery = useQuery({
    queryKey: ['vendors-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<VendorSummary>('/procurement/vendors/summary')
      return res.data
    },
    retry: false,
  })

  const vendorsQuery = useQuery({
    queryKey: ['vendors', category],
    queryFn: async () => {
      const params = category !== 'All' ? { category } : {}
      const res = await axiosClient.get<Vendor[] | { items: Vendor[] }>('/procurement/vendors', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof BLANK_FORM) => axiosClient.post('/procurement/vendors', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendors'] })
      qc.invalidateQueries({ queryKey: ['vendors-summary'] })
      setShowModal(false)
      setForm(BLANK_FORM)
    },
  })

  const s = summaryQuery.data
  const vendors = vendorsQuery.data ?? []

  const columns: Column<Vendor>[] = [
    {
      key: 'name',
      header: 'Vendor',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{r.code}</p>
        </div>
      ),
    },
    { key: 'category',      header: 'Category',  width: '130px' },
    {
      key: 'contactPerson',
      header: 'Contact',
      render: (r) => (
        <div>
          <p className="text-sm">{r.contactPerson}</p>
          <p className="text-xs text-muted-foreground">{r.email}</p>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', width: '120px' },
    {
      key: 'rating',
      header: 'Rating',
      width: '80px',
      render: (r) => r.rating != null
        ? <span className={`font-semibold ${r.rating >= 4 ? 'text-emerald-700' : r.rating >= 3 ? 'text-amber-600' : 'text-red-600'}`}>{r.rating.toFixed(1)} ★</span>
        : <span className="text-muted-foreground">—</span>,
    },
    { key: 'totalOrders', header: 'Orders', width: '80px' },
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
  ]

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate(form)
  }

  function field(key: keyof typeof BLANK_FORM, label: string, type = 'text', required = false) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
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
          <h1 className="text-2xl font-semibold text-gray-900">Vendors</h1>
          <p className="text-sm text-muted-foreground">Approved vendor registry for campus procurement.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Register Vendor
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Vendors"       value={s?.total ?? '—'}           icon="🏢" />
        <KpiCard label="Active"              value={s?.active ?? '—'}          icon="✅" trend="up" />
        <KpiCard label="Pending Approval"    value={s?.pendingApproval ?? '—'} icon="⏳" />
        <KpiCard label="Blacklisted"         value={s?.blacklisted ?? '—'}     icon="🚫" trend={s && s.blacklisted > 0 ? 'down' : 'neutral'} />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${category === c ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-border hover:bg-gray-50'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {vendorsQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Vendor API not yet available. Will appear once the Procurement backend module is deployed.
        </p>
      )}

      {!vendorsQuery.isLoading && !vendorsQuery.isError && (
        <DataTable<Vendor>
          columns={columns}
          data={vendors}
          rowKey={(r) => r.id}
          searchableFields={['name', 'code', 'category', 'contactPerson', 'email']}
          pageSize={15}
          emptyMessage="No vendors registered yet."
        />
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Register New Vendor"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              form="vendor-form"
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Saving…' : 'Register Vendor'}
            </button>
          </div>
        }
      >
        <form id="vendor-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          {field('name',          'Vendor Name', 'text', true)}
          {field('code',          'Vendor Code', 'text', true)}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              required
              className="w-full border border-input rounded-lg px-3 py-2 text-sm"
            >
              {CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          {field('contactPerson', 'Contact Person', 'text', true)}
          {field('email',         'Email', 'email', true)}
          {field('phone',         'Phone')}
          {field('taxNumber',     'Tax / NTN Number')}
          {field('bankAccount',   'Bank Account')}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              rows={2}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm"
            />
          </div>
          {createMutation.isError && (
            <p className="col-span-2 text-sm text-red-600">Failed to register vendor. Please try again.</p>
          )}
        </form>
      </Modal>
    </div>
  )
}
