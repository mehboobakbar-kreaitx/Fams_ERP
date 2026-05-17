import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import { formatCurrency } from '../../lib/utils'
import { authStore } from '../../store/authStore'

type FinanceSummary = {
  totalRevenue: number
  totalExpenses: number
  netPosition: number
  collectionRate: number
  outstandingFees: number
  payrollCostMTD: number
  budgetUtilization: number
  cashBalance: number
}

type RecentTransaction = {
  id: string
  type: 'Income' | 'Expense' | 'Payroll'
  description: string
  amount: number
  date: string
  category: string
}

const MODULES = [
  { to: '/campus/fee',                        label: 'Fee Management',    icon: '💳', desc: 'Student invoices and collections' },
  { to: '/campus/finance/fee-structures',     label: 'Fee Structures',    icon: '🏗️', desc: 'Fee categories, rates and rules' },
  { to: '/campus/finance/payments',           label: 'Payments',          icon: '💵', desc: 'Record and track fee payments' },
  { to: '/campus/finance/budget',             label: 'Budgeting',         icon: '📊', desc: 'Budget allocation and variance' },
  { to: '/campus/finance/expenses',           label: 'Expense Tracking',  icon: '📋', desc: 'Operational expense management', roles: ['Accountant', 'Principal'] },
  { to: '/campus/finance/payroll-summary',    label: 'Payroll Finance',   icon: '🔗', desc: 'Payroll cost integration view' },
  { to: '/campus/finance/salary-expenses',    label: 'Salary Expenses',   icon: '💸', desc: 'Salary disbursement as expenses' },
  { to: '/campus/finance/payroll-ledger',     label: 'Payroll Ledger',    icon: '📒', desc: 'Double-entry payroll journal', roles: ['Accountant', 'Principal'] },
  { to: '/campus/finance/reports',            label: 'Financial Reports', icon: '📈', desc: 'P&L, cash flow, budget vs actual' },
]

export default function FinanceDashboard() {
  const { user } = authStore.getState()
  const userRoles = user?.roles ?? []

  const summaryQuery = useQuery({
    queryKey: ['finance-dashboard'],
    queryFn: async () => {
      const res = await axiosClient.get<FinanceSummary>('/finance/summary')
      return res.data
    },
    retry: false,
  })

  const recentQuery = useQuery({
    queryKey: ['finance-recent'],
    queryFn: async () => {
      const res = await axiosClient.get<RecentTransaction[]>('/finance/recent-transactions', {
        params: { limit: 8 },
      })
      return res.data
    },
    retry: false,
  })

  const s = summaryQuery.data
  const netPositive = s ? s.netPosition >= 0 : true
  const visibleModules = MODULES.filter(
    (m) => !m.roles || m.roles.some((r) => userRoles.includes(r)),
  )

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Finance & Accounting</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Revenue, expenses, payroll cost and financial health of this campus.
      </p>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard label="Total Revenue"    value={s ? formatCurrency(s.totalRevenue) : '—'}    icon="💰" trend="up" />
        <KpiCard label="Total Expenses"   value={s ? formatCurrency(s.totalExpenses) : '—'}   icon="📋" trend="down" />
        <KpiCard
          label="Net Position"
          value={s ? formatCurrency(s.netPosition) : '—'}
          icon={netPositive ? '📈' : '📉'}
          trend={netPositive ? 'up' : 'down'}
        />
        <KpiCard label="Cash Balance"     value={s ? formatCurrency(s.cashBalance) : '—'}     icon="🏦" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Collection Rate"
          value={s ? `${s.collectionRate.toFixed(1)}%` : '—'}
          icon="📊"
          trend={s && s.collectionRate >= 80 ? 'up' : 'down'}
        />
        <KpiCard label="Outstanding Fees" value={s ? formatCurrency(s.outstandingFees) : '—'} icon="⏳" trend="down" />
        <KpiCard label="Payroll Cost MTD" value={s ? formatCurrency(s.payrollCostMTD) : '—'}  icon="💵" />
        <KpiCard
          label="Budget Utilization"
          value={s ? `${s.budgetUtilization.toFixed(1)}%` : '—'}
          icon="📉"
          trend={s && s.budgetUtilization > 90 ? 'down' : 'neutral'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module grid */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Finance Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibleModules.map((m) => (
              <Link
                key={m.to}
                to={m.to}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary-300 hover:bg-primary-50 transition-colors group"
              >
                <span className="text-2xl mt-0.5">{m.icon}</span>
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-primary-700 text-sm">{m.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Transactions</h2>
          {recentQuery.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {recentQuery.isError && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
              Transaction feed not yet available.
            </p>
          )}
          {!recentQuery.isLoading && !recentQuery.isError && (
            <div className="space-y-2">
              {(recentQuery.data ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No recent transactions.</p>
              )}
              {(recentQuery.data ?? []).map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[140px]">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{t.category}</p>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      t.type === 'Income' ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {t.type === 'Income' ? '+' : '–'}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
