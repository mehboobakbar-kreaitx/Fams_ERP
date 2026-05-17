import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatCurrency, formatDate } from '../../lib/utils'

type Payment = {
  id: string
  receiptNumber: string
  studentName: string
  rollNumber: string
  invoiceNumber?: string
  amount: number
  paymentMode: 'Cash' | 'BankTransfer' | 'Cheque' | 'OnlinePortal' | 'JazzCash' | 'EasyPaisa'
  paymentDate: string
  receivedBy?: string
  remarks?: string
  status: 'Confirmed' | 'Pending' | 'Reversed'
}

type Summary = {
  totalCollectedMTD: number
  totalCollectedYTD: number
  cashPayments: number
  digitalPayments: number
  pendingVerification: number
}

const MODE_COLORS: Record<string, string> = {
  Cash: 'bg-emerald-100 text-emerald-700',
  BankTransfer: 'bg-blue-100 text-blue-700',
  Cheque: 'bg-amber-100 text-amber-700',
  OnlinePortal: 'bg-purple-100 text-purple-700',
  JazzCash: 'bg-red-100 text-red-700',
  EasyPaisa: 'bg-green-100 text-green-700',
}

const PAYMENT_MODES = ['Cash', 'BankTransfer', 'Cheque', 'OnlinePortal', 'JazzCash', 'EasyPaisa']

export default function PaymentsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    studentId: '',
    invoiceId: '',
    amount: '',
    paymentMode: 'Cash',
    paymentDate: new Date().toISOString().slice(0, 10),
    remarks: '',
  })

  const summaryQuery = useQuery({
    queryKey: ['payments-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<Summary>('/finance/payments/summary')
      return res.data
    },
    retry: false,
  })

  const paymentsQuery = useQuery({
    queryKey: ['finance-payments'],
    queryFn: async () => {
      const res = await axiosClient.get<Payment[] | { items: Payment[] }>('/finance/payments')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const recordPayment = useMutation({
    mutationFn: async () => {
      if (!form.amount || !form.paymentDate) throw new Error('Amount and date are required.')
      await axiosClient.post('/finance/payments', {
        studentId: form.studentId || undefined,
        invoiceId: form.invoiceId || undefined,
        amount: parseFloat(form.amount),
        paymentMode: form.paymentMode,
        paymentDate: form.paymentDate,
        remarks: form.remarks || undefined,
      })
    },
    onSuccess: () => {
      toast.success('Payment recorded.')
      setShowForm(false)
      setForm({ studentId: '', invoiceId: '', amount: '', paymentMode: 'Cash', paymentDate: new Date().toISOString().slice(0, 10), remarks: '' })
      qc.invalidateQueries({ queryKey: ['finance-payments'] })
      qc.invalidateQueries({ queryKey: ['payments-summary'] })
      qc.invalidateQueries({ queryKey: ['fee-summary'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error(e.response?.data?.error ?? e.message ?? 'Could not record payment.')
    },
  })

  const s = summaryQuery.data
  const payments = paymentsQuery.data ?? []

  const columns: Column<Payment>[] = [
    {
      key: 'receiptNumber',
      header: 'Receipt #',
      width: '120px',
      render: (r) => <span className="font-mono text-sm">{r.receiptNumber}</span>,
    },
    {
      key: 'studentName',
      header: 'Student',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.studentName}</p>
          <p className="text-xs text-muted-foreground">{r.rollNumber}</p>
        </div>
      ),
    },
    { key: 'invoiceNumber', header: 'Invoice', width: '120px', render: (r) => r.invoiceNumber ?? '—' },
    { key: 'amount', header: 'Amount', render: (r) => <span className="font-semibold text-emerald-700">{formatCurrency(r.amount)}</span> },
    {
      key: 'paymentMode',
      header: 'Mode',
      width: '120px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${MODE_COLORS[r.paymentMode] ?? 'bg-gray-100 text-gray-700'}`}>
          {r.paymentMode}
        </span>
      ),
    },
    { key: 'paymentDate', header: 'Date', width: '105px', render: (r) => formatDate(r.paymentDate) },
    { key: 'receivedBy', header: 'Received By', render: (r) => r.receivedBy ?? '—' },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
          r.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700'
          : r.status === 'Reversed' ? 'bg-red-100 text-red-700'
          : 'bg-amber-100 text-amber-700'
        }`}>
          {r.status}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
          <p className="text-sm text-muted-foreground">Record fee payments and view payment history.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {showForm ? '✕ Cancel' : '+ Record Payment'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Record New Payment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Student ID (optional)</label>
              <input
                placeholder="Student GUID"
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Invoice ID (optional)</label>
              <input
                placeholder="Invoice GUID"
                value={form.invoiceId}
                onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount (PKR) *</label>
              <input
                type="number"
                min="1"
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Mode</label>
              <select
                value={form.paymentMode}
                onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm"
              >
                {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Date *</label>
              <input
                type="date"
                value={form.paymentDate}
                onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
              <input
                placeholder="Optional note"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => recordPayment.mutate()}
              disabled={recordPayment.isPending || !form.amount || !form.paymentDate}
              className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {recordPayment.isPending ? 'Saving…' : 'Save Payment'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Collected MTD" value={s ? formatCurrency(s.totalCollectedMTD) : '—'} icon="💵" trend="up" />
        <KpiCard label="Collected YTD" value={s ? formatCurrency(s.totalCollectedYTD) : '—'} icon="💰" />
        <KpiCard label="Cash Payments" value={s ? formatCurrency(s.cashPayments) : '—'} icon="💴" />
        <KpiCard label="Digital Payments" value={s ? formatCurrency(s.digitalPayments) : '—'} icon="📱" trend="up" />
        <KpiCard label="Pending Verification" value={s?.pendingVerification ?? '—'} icon="⏳" trend="down" />
      </div>

      {paymentsQuery.isLoading && <p className="text-muted-foreground">Loading payments…</p>}
      {paymentsQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
          Payments API not yet available. Will appear once the Finance backend module is deployed.
        </p>
      )}
      {!paymentsQuery.isLoading && !paymentsQuery.isError && (
        <DataTable<Payment>
          columns={columns}
          data={payments}
          rowKey={(r) => r.id}
          searchableFields={['receiptNumber', 'studentName', 'rollNumber', 'invoiceNumber']}
          pageSize={15}
          emptyMessage="No payments recorded yet."
        />
      )}
    </div>
  )
}
