import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import { formatCurrency } from '../../lib/utils'

type PLRow = { category: string; amount: number; type: 'Revenue' | 'Expense' }
type BudgetVariance = { category: string; budgeted: number; actual: number; variance: number; variancePct: number }
type CashFlowRow = { period: string; inflow: number; outflow: number; netFlow: number; closingBalance: number }

type FinancialReport = {
  fiscalYear: string
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  plStatement: PLRow[]
  budgetVariance: BudgetVariance[]
  cashFlow: CashFlowRow[]
}

const FISCAL_YEARS = ['2025-26', '2024-25', '2023-24']

export default function FinancialReportsPage() {
  const [fiscalYear, setFiscalYear] = useState(FISCAL_YEARS[0])
  const [activeTab, setActiveTab] = useState<'pl' | 'budget' | 'cashflow'>('pl')

  const reportQuery = useQuery({
    queryKey: ['financial-reports', fiscalYear],
    queryFn: async () => {
      const res = await axiosClient.get<FinancialReport>('/finance/reports', { params: { fiscalYear } })
      return res.data
    },
    retry: false,
  })

  const r = reportQuery.data

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Financial Reports</h1>
          <p className="text-sm text-muted-foreground">P&L statement, budget variance and cash flow analysis.</p>
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
          <button className="border border-border hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium">
            Export PDF
          </button>
        </div>
      </div>

      {reportQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          Financial reports API not yet available. Will appear once the Finance backend module is deployed.
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Revenue"  value={r ? formatCurrency(r.totalRevenue) : '—'}  icon="💰" trend="up" />
        <KpiCard label="Total Expenses" value={r ? formatCurrency(r.totalExpenses) : '—'} icon="💸" trend="down" />
        <KpiCard
          label="Net Income"
          value={r ? formatCurrency(r.netIncome) : '—'}
          icon={r && r.netIncome >= 0 ? '📈' : '📉'}
          trend={r && r.netIncome >= 0 ? 'up' : 'down'}
        />
        <KpiCard label="Fiscal Year" value={r?.fiscalYear ?? fiscalYear} icon="📅" />
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-4">
        {([
          { key: 'pl', label: 'P&L Statement' },
          { key: 'budget', label: 'Budget vs Actual' },
          { key: 'cashflow', label: 'Cash Flow' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === tab.key
                ? 'bg-primary-700 text-white'
                : 'bg-white border border-border text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* P&L Statement */}
      {activeTab === 'pl' && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Profit & Loss Statement — {fiscalYear}</h2>
          {!r?.plStatement?.length ? (
            <p className="text-sm text-muted-foreground">No P&L data available for this period.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-semibold text-gray-700">Category</th>
                  <th className="text-left py-2 font-semibold text-gray-700">Type</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* Revenue rows */}
                {r.plStatement.filter((row) => row.type === 'Revenue').map((row) => (
                  <tr key={row.category} className="border-b border-border">
                    <td className="py-2">{row.category}</td>
                    <td className="py-2"><span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">Revenue</span></td>
                    <td className="py-2 text-right text-emerald-700 font-medium">{formatCurrency(row.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-emerald-50 font-semibold">
                  <td className="py-2 px-1">Total Revenue</td>
                  <td />
                  <td className="py-2 text-right text-emerald-700">{formatCurrency(r.totalRevenue)}</td>
                </tr>
                {/* Expense rows */}
                {r.plStatement.filter((row) => row.type === 'Expense').map((row) => (
                  <tr key={row.category} className="border-b border-border">
                    <td className="py-2">{row.category}</td>
                    <td className="py-2"><span className="inline-block px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">Expense</span></td>
                    <td className="py-2 text-right text-red-600">({formatCurrency(row.amount)})</td>
                  </tr>
                ))}
                <tr className="bg-red-50 font-semibold">
                  <td className="py-2 px-1">Total Expenses</td>
                  <td />
                  <td className="py-2 text-right text-red-700">({formatCurrency(r.totalExpenses)})</td>
                </tr>
                <tr className="bg-primary-50 font-bold border-t-2 border-primary-200">
                  <td className="py-3 px-1 text-primary-900">Net Income</td>
                  <td />
                  <td className={`py-3 text-right text-lg ${r.netIncome >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {formatCurrency(r.netIncome)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Budget vs Actual */}
      {activeTab === 'budget' && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Budget vs Actual — {fiscalYear}</h2>
          {!r?.budgetVariance?.length ? (
            <p className="text-sm text-muted-foreground">No budget variance data available.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-semibold text-gray-700">Category</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Budgeted</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Actual</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Variance</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Var %</th>
                </tr>
              </thead>
              <tbody>
                {r.budgetVariance.map((b) => {
                  const over = b.variance < 0
                  return (
                    <tr key={b.category} className="border-b border-border last:border-b-0">
                      <td className="py-2 font-medium">{b.category}</td>
                      <td className="py-2 text-right">{formatCurrency(b.budgeted)}</td>
                      <td className="py-2 text-right">{formatCurrency(b.actual)}</td>
                      <td className={`py-2 text-right font-medium ${over ? 'text-red-600' : 'text-emerald-700'}`}>
                        {over ? '–' : '+'}{formatCurrency(Math.abs(b.variance))}
                      </td>
                      <td className={`py-2 text-right font-medium ${over ? 'text-red-600' : 'text-emerald-700'}`}>
                        {over ? '' : '+'}{b.variancePct.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Cash Flow */}
      {activeTab === 'cashflow' && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Cash Flow Statement — {fiscalYear}</h2>
          {!r?.cashFlow?.length ? (
            <p className="text-sm text-muted-foreground">No cash flow data available.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-semibold text-gray-700">Period</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Inflow</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Outflow</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Net Flow</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Closing Balance</th>
                </tr>
              </thead>
              <tbody>
                {r.cashFlow.map((cf) => (
                  <tr key={cf.period} className="border-b border-border last:border-b-0">
                    <td className="py-2 font-mono font-medium">{cf.period}</td>
                    <td className="py-2 text-right text-emerald-700">{formatCurrency(cf.inflow)}</td>
                    <td className="py-2 text-right text-red-600">({formatCurrency(cf.outflow)})</td>
                    <td className={`py-2 text-right font-medium ${cf.netFlow >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {cf.netFlow >= 0 ? '+' : ''}{formatCurrency(cf.netFlow)}
                    </td>
                    <td className="py-2 text-right font-semibold">{formatCurrency(cf.closingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
