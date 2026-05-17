import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatCurrency, formatDate } from '../../lib/utils'

type SalaryExpense = {
  id: string
  period: string
  disbursedDate?: string
  employeeCount: number
  totalBasicSalary: number
  totalAllowances: number
  totalDeductions: number
  totalNetPay: number
  totalEmployerCost: number
  payrollRunStatus: 'Draft' | 'Approved' | 'Disbursed'
  expenseCategory: string
}

type Summary = {
  totalSalaryExpenseYTD: number
  totalAllowancesYTD: number
  totalDeductionsYTD: number
  totalEmployerCostYTD: number
  avgMonthlyExpense: number
}

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600',
  Approved: 'bg-blue-100 text-blue-700',
  Disbursed: 'bg-emerald-100 text-emerald-700',
}

export default function SalaryExpensesPage() {
  const [year, setYear] = useState(() => String(new Date().getFullYear()))

  const summaryQuery = useQuery({
    queryKey: ['salary-expenses-summary', year],
    queryFn: async () => {
      const res = await axiosClient.get<Summary>('/finance/salary-expenses/summary', { params: { year } })
      return res.data
    },
    retry: false,
  })

  const expensesQuery = useQuery({
    queryKey: ['salary-expenses', year],
    queryFn: async () => {
      const res = await axiosClient.get<SalaryExpense[] | { items: SalaryExpense[] }>('/finance/salary-expenses', {
        params: { year },
      })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const s = summaryQuery.data
  const expenses = expensesQuery.data ?? []

  const columns: Column<SalaryExpense>[] = [
    {
      key: 'period',
      header: 'Period',
      width: '110px',
      render: (r) => <span className="font-mono font-medium">{r.period}</span>,
    },
    { key: 'employeeCount', header: 'Employees', width: '100px' },
    { key: 'totalBasicSalary', header: 'Basic Salary',   render: (r) => formatCurrency(r.totalBasicSalary) },
    { key: 'totalAllowances',  header: 'Allowances',     render: (r) => formatCurrency(r.totalAllowances) },
    { key: 'totalDeductions',  header: 'Deductions',     render: (r) => <span className="text-red-600">–{formatCurrency(r.totalDeductions)}</span> },
    { key: 'totalNetPay',      header: 'Net Pay',        render: (r) => <span className="font-semibold">{formatCurrency(r.totalNetPay)}</span> },
    { key: 'totalEmployerCost',header: 'Employer Cost',  render: (r) => <span className="text-amber-700">{formatCurrency(r.totalEmployerCost)}</span> },
    {
      key: 'disbursedDate',
      header: 'Disbursed',
      width: '110px',
      render: (r) => (r.disbursedDate ? formatDate(r.disbursedDate) : '—'),
    },
    {
      key: 'payrollRunStatus',
      header: 'Status',
      width: '100px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.payrollRunStatus] ?? ''}`}>
          {r.payrollRunStatus}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Salary Expenses</h1>
          <p className="text-sm text-muted-foreground">Monthly salary disbursements as campus expenses — payroll-to-finance integration.</p>
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-xs font-medium text-gray-700">Year:</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm"
          >
            {[2026, 2025, 2024].map((y) => <option key={y}>{String(y)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Salary Expense YTD"  value={s ? formatCurrency(s.totalSalaryExpenseYTD) : '—'} icon="💸" />
        <KpiCard label="Allowances YTD"       value={s ? formatCurrency(s.totalAllowancesYTD) : '—'}   icon="🎁" />
        <KpiCard label="Deductions YTD"       value={s ? formatCurrency(s.totalDeductionsYTD) : '—'}   icon="➖" />
        <KpiCard label="Employer Cost YTD"    value={s ? formatCurrency(s.totalEmployerCostYTD) : '—'} icon="🏛️" />
        <KpiCard label="Avg Monthly Expense"  value={s ? formatCurrency(s.avgMonthlyExpense) : '—'}    icon="📊" />
      </div>

      {expensesQuery.isLoading && <p className="text-muted-foreground">Loading salary expenses…</p>}
      {expensesQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
          Salary expenses API not yet available. Will appear once the Finance + Payroll backend integration is deployed.
        </p>
      )}
      {!expensesQuery.isLoading && !expensesQuery.isError && (
        <DataTable<SalaryExpense>
          columns={columns}
          data={expenses}
          rowKey={(r) => r.id}
          searchableFields={['period']}
          pageSize={15}
          emptyMessage="No salary expense records yet."
        />
      )}
    </div>
  )
}
