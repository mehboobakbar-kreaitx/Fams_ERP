import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatCurrency } from '../../lib/utils'

type BudgetLine = {
  id: string
  category: string
  subCategory?: string
  allocatedAmount: number
  spentAmount: number
  committedAmount: number
  remainingAmount: number
  utilizationPct: number
  fiscalYear: string
  quarter?: string
}

type BudgetSummary = {
  totalBudget: number
  totalSpent: number
  totalCommitted: number
  totalRemaining: number
  overallUtilization: number
  fiscalYear: string
}

const FISCAL_YEARS = ['2025-26', '2024-25', '2023-24']

function UtilizationBar({ pct }: { pct: number }) {
  const color = pct >= 100 ? 'bg-red-500' : pct >= 85 ? 'bg-amber-400' : 'bg-emerald-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[60px]">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-xs font-medium w-9 text-right ${pct >= 100 ? 'text-red-600' : pct >= 85 ? 'text-amber-700' : 'text-gray-700'}`}>
        {pct.toFixed(0)}%
      </span>
    </div>
  )
}

export default function BudgetingPage() {
  const [fiscalYear, setFiscalYear] = useState(FISCAL_YEARS[0])

  const summaryQuery = useQuery({
    queryKey: ['budget-summary', fiscalYear],
    queryFn: async () => {
      const res = await axiosClient.get<BudgetSummary>('/finance/budget/summary', { params: { fiscalYear } })
      return res.data
    },
    retry: false,
  })

  const linesQuery = useQuery({
    queryKey: ['budget-lines', fiscalYear],
    queryFn: async () => {
      const res = await axiosClient.get<BudgetLine[] | { items: BudgetLine[] }>('/finance/budget', { params: { fiscalYear } })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const s = summaryQuery.data
  const lines = linesQuery.data ?? []

  const columns: Column<BudgetLine>[] = [
    {
      key: 'category',
      header: 'Category',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.category}</p>
          {r.subCategory && <p className="text-xs text-muted-foreground">{r.subCategory}</p>}
        </div>
      ),
    },
    { key: 'allocatedAmount', header: 'Budget',     render: (r) => formatCurrency(r.allocatedAmount) },
    { key: 'spentAmount',     header: 'Spent',      render: (r) => <span className={r.spentAmount > r.allocatedAmount ? 'text-red-600 font-medium' : ''}>{formatCurrency(r.spentAmount)}</span> },
    { key: 'committedAmount', header: 'Committed',  render: (r) => formatCurrency(r.committedAmount) },
    { key: 'remainingAmount', header: 'Remaining',  render: (r) => <span className={r.remainingAmount < 0 ? 'text-red-600 font-semibold' : 'text-emerald-700 font-medium'}>{formatCurrency(r.remainingAmount)}</span> },
    {
      key: 'utilizationPct',
      header: 'Utilization',
      render: (r) => <UtilizationBar pct={r.utilizationPct} />,
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Budgeting</h1>
          <p className="text-sm text-muted-foreground">Campus budget allocation and variance tracking.</p>
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-xs font-medium text-gray-700">Fiscal Year:</label>
          <select
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm"
          >
            {FISCAL_YEARS.map((y) => <option key={y}>{y}</option>)}
          </select>
          <button className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + New Budget Line
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Total Budget"    value={s ? formatCurrency(s.totalBudget) : '—'}    icon="📊" />
        <KpiCard label="Spent"           value={s ? formatCurrency(s.totalSpent) : '—'}     icon="💸" trend="down" />
        <KpiCard label="Committed"       value={s ? formatCurrency(s.totalCommitted) : '—'} icon="📋" />
        <KpiCard label="Remaining"       value={s ? formatCurrency(s.totalRemaining) : '—'} icon="💰" trend={s && s.totalRemaining >= 0 ? 'up' : 'down'} />
        <KpiCard
          label="Overall Utilization"
          value={s ? `${s.overallUtilization.toFixed(1)}%` : '—'}
          icon="📈"
          trend={s && s.overallUtilization > 90 ? 'down' : 'neutral'}
        />
      </div>

      {/* Visual budget overview for categories */}
      {lines.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Budget vs Spent by Category</h2>
          <div className="space-y-4">
            {lines.slice(0, 8).map((line) => (
              <div key={line.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-800">{line.category}{line.subCategory ? ` · ${line.subCategory}` : ''}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatCurrency(line.spentAmount)} / {formatCurrency(line.allocatedAmount)}
                  </span>
                </div>
                <UtilizationBar pct={line.utilizationPct} />
              </div>
            ))}
          </div>
        </div>
      )}

      {linesQuery.isLoading && <p className="text-muted-foreground">Loading budget lines…</p>}
      {linesQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
          Budget API not yet available. Will appear once the Finance backend module is deployed.
        </p>
      )}
      {!linesQuery.isLoading && !linesQuery.isError && (
        <DataTable<BudgetLine>
          columns={columns}
          data={lines}
          rowKey={(r) => r.id}
          searchableFields={['category', 'subCategory', 'fiscalYear']}
          pageSize={15}
          emptyMessage="No budget lines defined yet."
        />
      )}
    </div>
  )
}
