import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatCurrency, formatDate } from '../../lib/utils'

type Expense = {
  id: string
  title: string
  category: string
  subCategory?: string
  amount: number
  expenseDate: string
  paidTo?: string
  approvedBy?: string
  budgetLine?: string
  attachmentUrl?: string
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Paid'
  remarks?: string
}

type ExpenseSummary = {
  totalMTD: number
  totalYTD: number
  pendingApproval: number
  topCategory: string
  totalCategories: number
}

const CATEGORIES = ['All', 'Utilities', 'Maintenance', 'Stationery', 'Transport', 'Events', 'IT & Equipment', 'Miscellaneous']

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600',
  Submitted: 'bg-amber-100 text-amber-700',
  Approved: 'bg-blue-100 text-blue-700',
  Rejected: 'bg-red-100 text-red-700',
  Paid: 'bg-emerald-100 text-emerald-700',
}

export default function ExpenseTrackingPage() {
  const qc = useQueryClient()
  const [catFilter, setCatFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    category: 'Utilities',
    amount: '',
    expenseDate: new Date().toISOString().slice(0, 10),
    paidTo: '',
    remarks: '',
  })

  const summaryQuery = useQuery({
    queryKey: ['expense-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<ExpenseSummary>('/finance/expenses/summary')
      return res.data
    },
    retry: false,
  })

  const expensesQuery = useQuery({
    queryKey: ['finance-expenses', catFilter],
    queryFn: async () => {
      const params = catFilter !== 'All' ? { category: catFilter } : {}
      const res = await axiosClient.get<Expense[] | { items: Expense[] }>('/finance/expenses', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const createExpense = useMutation({
    mutationFn: async () => {
      if (!form.title.trim() || !form.amount || !form.expenseDate) {
        throw new Error('Title, amount and date are required.')
      }
      await axiosClient.post('/finance/expenses', {
        title: form.title.trim(),
        category: form.category,
        amount: parseFloat(form.amount),
        expenseDate: form.expenseDate,
        paidTo: form.paidTo || undefined,
        remarks: form.remarks || undefined,
      })
    },
    onSuccess: () => {
      toast.success('Expense recorded.')
      setShowForm(false)
      setForm({ title: '', category: 'Utilities', amount: '', expenseDate: new Date().toISOString().slice(0, 10), paidTo: '', remarks: '' })
      qc.invalidateQueries({ queryKey: ['finance-expenses'] })
      qc.invalidateQueries({ queryKey: ['expense-summary'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error(e.response?.data?.error ?? e.message ?? 'Could not save expense.')
    },
  })

  const s = summaryQuery.data
  const expenses = expensesQuery.data ?? []

  const columns: Column<Expense>[] = [
    {
      key: 'title',
      header: 'Expense',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.title}</p>
          {r.subCategory && <p className="text-xs text-muted-foreground">{r.subCategory}</p>}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (r) => (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
          {r.category}
        </span>
      ),
    },
    { key: 'amount',      header: 'Amount',      render: (r) => <span className="font-medium">{formatCurrency(r.amount)}</span> },
    { key: 'expenseDate', header: 'Date',         width: '105px', render: (r) => formatDate(r.expenseDate) },
    { key: 'paidTo',      header: 'Paid To',      render: (r) => r.paidTo ?? '—' },
    { key: 'budgetLine',  header: 'Budget Line',  render: (r) => r.budgetLine ?? '—' },
    { key: 'approvedBy',  header: 'Approved By',  render: (r) => r.approvedBy ?? '—' },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] ?? ''}`}>
          {r.status}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Expense Tracking</h1>
          <p className="text-sm text-muted-foreground">Record, categorize and approve operational expenses.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {showForm ? '✕ Cancel' : '+ Add Expense'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">New Expense</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
              <input
                placeholder="Expense description"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm"
              >
                {CATEGORIES.slice(1).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount (PKR) *</label>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={form.expenseDate}
                onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Paid To</label>
              <input
                placeholder="Vendor / recipient name"
                value={form.paidTo}
                onChange={(e) => setForm({ ...form, paidTo: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
              <input
                placeholder="Optional notes"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => createExpense.mutate()}
              disabled={createExpense.isPending || !form.title.trim() || !form.amount}
              className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {createExpense.isPending ? 'Saving…' : 'Save Expense'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Spent MTD"          value={s ? formatCurrency(s.totalMTD) : '—'}           icon="📋" />
        <KpiCard label="Spent YTD"          value={s ? formatCurrency(s.totalYTD) : '—'}           icon="💸" />
        <KpiCard label="Pending Approval"   value={s?.pendingApproval ?? '—'}                       icon="⏳" trend="down" />
        <KpiCard label="Top Category"       value={s?.topCategory ?? '—'}                           icon="🏆" />
        <KpiCard label="Categories"         value={s?.totalCategories ?? CATEGORIES.length - 1}     icon="📂" />
      </div>

      <div className="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-2 items-center">
        <span className="text-xs font-medium text-gray-600 mr-1">Category:</span>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border ${
              catFilter === c
                ? 'bg-primary-700 text-white border-primary-700'
                : 'bg-white text-gray-700 border-border hover:bg-gray-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {expensesQuery.isLoading && <p className="text-muted-foreground">Loading expenses…</p>}
      {expensesQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
          Expense API not yet available. Will appear once the Finance backend module is deployed.
        </p>
      )}
      {!expensesQuery.isLoading && !expensesQuery.isError && (
        <DataTable<Expense>
          columns={columns}
          data={expenses}
          rowKey={(r) => r.id}
          searchableFields={['title', 'category', 'paidTo']}
          pageSize={15}
          emptyMessage="No expenses recorded yet."
        />
      )}
    </div>
  )
}
