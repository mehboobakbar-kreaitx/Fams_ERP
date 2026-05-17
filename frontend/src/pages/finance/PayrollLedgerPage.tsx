import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatCurrency, formatDate } from '../../lib/utils'

type LedgerEntry = {
  id: string
  entryDate: string
  period: string
  entryType: 'Debit' | 'Credit'
  accountCode: string
  accountName: string
  description: string
  debitAmount: number
  creditAmount: number
  runningBalance: number
  referenceId?: string
  postedBy?: string
}

type LedgerSummary = {
  totalDebits: number
  totalCredits: number
  netBalance: number
  lastPosted?: string
  totalEntries: number
}

const ENTRY_COLORS: Record<string, string> = {
  Debit: 'bg-red-100 text-red-700',
  Credit: 'bg-emerald-100 text-emerald-700',
}

export default function PayrollLedgerPage() {
  const [period, setPeriod] = useState('')

  const summaryQuery = useQuery({
    queryKey: ['payroll-ledger-summary', period],
    queryFn: async () => {
      const params = period ? { period } : {}
      const res = await axiosClient.get<LedgerSummary>('/finance/payroll-ledger/summary', { params })
      return res.data
    },
    retry: false,
  })

  const ledgerQuery = useQuery({
    queryKey: ['payroll-ledger', period],
    queryFn: async () => {
      const params = period ? { period } : {}
      const res = await axiosClient.get<LedgerEntry[] | { items: LedgerEntry[] }>('/finance/payroll-ledger', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const s = summaryQuery.data
  const entries = ledgerQuery.data ?? []

  const columns: Column<LedgerEntry>[] = [
    {
      key: 'entryDate',
      header: 'Date',
      width: '105px',
      render: (r) => <span className="font-mono text-xs">{formatDate(r.entryDate)}</span>,
    },
    { key: 'period', header: 'Period', width: '90px' },
    {
      key: 'entryType',
      header: 'Dr/Cr',
      width: '80px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${ENTRY_COLORS[r.entryType]}`}>
          {r.entryType}
        </span>
      ),
    },
    {
      key: 'accountCode',
      header: 'Account',
      render: (r) => (
        <div>
          <p className="font-mono text-xs text-muted-foreground">{r.accountCode}</p>
          <p className="font-medium text-gray-900 text-sm">{r.accountName}</p>
        </div>
      ),
    },
    { key: 'description', header: 'Description', render: (r) => <span className="text-sm text-gray-700">{r.description}</span> },
    {
      key: 'debitAmount',
      header: 'Debit',
      width: '120px',
      render: (r) => r.debitAmount > 0
        ? <span className="text-red-600 font-medium">{formatCurrency(r.debitAmount)}</span>
        : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'creditAmount',
      header: 'Credit',
      width: '120px',
      render: (r) => r.creditAmount > 0
        ? <span className="text-emerald-700 font-medium">{formatCurrency(r.creditAmount)}</span>
        : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'runningBalance',
      header: 'Balance',
      width: '130px',
      render: (r) => (
        <span className={`font-semibold ${r.runningBalance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
          {formatCurrency(Math.abs(r.runningBalance))}
          {r.runningBalance < 0 ? ' Cr' : ' Dr'}
        </span>
      ),
    },
    { key: 'postedBy', header: 'Posted By', render: (r) => r.postedBy ?? '—' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Payroll Ledger</h1>
        <p className="text-sm text-muted-foreground">
          Double-entry journal entries generated from payroll disbursements. Read-only — entries are system-generated.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Total Debits"    value={s ? formatCurrency(s.totalDebits) : '—'}  icon="📤" />
        <KpiCard label="Total Credits"   value={s ? formatCurrency(s.totalCredits) : '—'} icon="📥" />
        <KpiCard
          label="Net Balance"
          value={s ? formatCurrency(Math.abs(s.netBalance)) : '—'}
          icon="⚖️"
          trend={s && s.netBalance === 0 ? 'neutral' : 'down'}
        />
        <KpiCard label="Total Entries"   value={s?.totalEntries ?? entries.length}         icon="📋" />
        <KpiCard label="Last Posted"     value={s?.lastPosted ? formatDate(s.lastPosted) : '—'} icon="📅" />
      </div>

      <div className="bg-white rounded-xl border border-border p-4 mb-4 flex gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Period (YYYY-MM)</label>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="All periods"
            className="border border-input rounded-lg px-3 py-2 text-sm"
          />
        </div>
        {period && (
          <button
            onClick={() => setPeriod('')}
            className="text-xs text-muted-foreground hover:text-gray-700 border border-border px-3 py-2 rounded-lg"
          >
            Clear
          </button>
        )}
      </div>

      {ledgerQuery.isLoading && <p className="text-muted-foreground">Loading ledger entries…</p>}
      {ledgerQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
          Payroll ledger API not yet available. Will appear once the Finance + Payroll backend integration is deployed.
        </p>
      )}
      {!ledgerQuery.isLoading && !ledgerQuery.isError && (
        <DataTable<LedgerEntry>
          columns={columns}
          data={entries}
          rowKey={(r) => r.id}
          searchableFields={['accountCode', 'accountName', 'description', 'period']}
          pageSize={20}
          emptyMessage="No ledger entries yet."
        />
      )}
    </div>
  )
}
