import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import { formatCurrency } from '../../lib/utils'

type DeptCost = { department: string; headcount: number; grossPay: number; netPay: number; avgSalary: number }
type MonthlyTrend = { period: string; grossPay: number; netPay: number; headcount: number }
type ComponentBreakdown = { component: string; total: number; percentageOfGross: number }

type ReportData = {
  totalGrossYTD: number
  totalNetYTD: number
  totalTaxYTD: number
  avgSalaryAllStaff: number
  departmentCosts: DeptCost[]
  monthlyTrend: MonthlyTrend[]
  componentBreakdown: ComponentBreakdown[]
}

export default function PayrollReportsPage() {
  const [year, setYear] = useState(() => String(new Date().getFullYear()))

  const reportQuery = useQuery({
    queryKey: ['payroll-reports', year],
    queryFn: async () => {
      const res = await axiosClient.get<ReportData>('/payroll/reports', { params: { year } })
      return res.data
    },
    retry: false,
  })

  const d = reportQuery.data

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payroll Reports</h1>
          <p className="text-sm text-muted-foreground">YTD payroll spend, department cost and salary analytics.</p>
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-xs font-medium text-gray-700">Year:</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm"
          >
            {[2026, 2025, 2024].map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
          <button className="border border-border hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium">
            Export
          </button>
        </div>
      </div>

      {reportQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          Payroll reports API not yet available. Will appear once the Payroll backend module is deployed.
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Gross Pay YTD"    value={d ? formatCurrency(d.totalGrossYTD) : '—'} icon="💰" />
        <KpiCard label="Net Pay YTD"      value={d ? formatCurrency(d.totalNetYTD) : '—'} icon="💵" trend="up" />
        <KpiCard label="Tax Withheld YTD" value={d ? formatCurrency(d.totalTaxYTD) : '—'} icon="🏛️" />
        <KpiCard label="Avg Salary"       value={d ? formatCurrency(d.avgSalaryAllStaff) : '—'} icon="📊" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department cost table */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Cost by Department</h2>
          {!d?.departmentCosts?.length ? (
            <p className="text-sm text-muted-foreground">No data available.</p>
          ) : (
            <div className="space-y-3">
              {d.departmentCosts.map((dept) => {
                const maxGross = Math.max(...d.departmentCosts.map((x) => x.grossPay))
                const barPct = maxGross > 0 ? Math.round((dept.grossPay / maxGross) * 100) : 0
                return (
                  <div key={dept.department}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-800">{dept.department}</span>
                      <span className="text-muted-foreground text-xs">{dept.headcount} staff · {formatCurrency(dept.avgSalary)} avg</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${barPct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 w-24 text-right">{formatCurrency(dept.grossPay)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Component breakdown */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Pay Component Breakdown</h2>
          {!d?.componentBreakdown?.length ? (
            <p className="text-sm text-muted-foreground">No data available.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-semibold text-gray-700">Component</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Total</th>
                  <th className="text-right py-2 font-semibold text-gray-700">% of Gross</th>
                </tr>
              </thead>
              <tbody>
                {d.componentBreakdown.map((c) => (
                  <tr key={c.component} className="border-b border-border last:border-b-0">
                    <td className="py-2">{c.component}</td>
                    <td className="py-2 text-right">{formatCurrency(c.total)}</td>
                    <td className="py-2 text-right font-medium">{c.percentageOfGross.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Monthly trend */}
        <div className="bg-white rounded-xl border border-border p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Monthly Payroll Trend</h2>
          {!d?.monthlyTrend?.length ? (
            <p className="text-sm text-muted-foreground">No data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-semibold text-gray-700">Period</th>
                    <th className="text-right py-2 font-semibold text-gray-700">Employees</th>
                    <th className="text-right py-2 font-semibold text-gray-700">Gross Pay</th>
                    <th className="text-right py-2 font-semibold text-gray-700">Net Pay</th>
                    <th className="text-right py-2 font-semibold text-gray-700">Deductions</th>
                  </tr>
                </thead>
                <tbody>
                  {d.monthlyTrend.map((m) => (
                    <tr key={m.period} className="border-b border-border last:border-b-0">
                      <td className="py-2 font-mono font-medium">{m.period}</td>
                      <td className="py-2 text-right">{m.headcount}</td>
                      <td className="py-2 text-right">{formatCurrency(m.grossPay)}</td>
                      <td className="py-2 text-right font-medium text-emerald-700">{formatCurrency(m.netPay)}</td>
                      <td className="py-2 text-right text-red-600">–{formatCurrency(m.grossPay - m.netPay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
