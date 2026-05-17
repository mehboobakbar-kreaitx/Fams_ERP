import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import { formatCurrency } from '../../lib/utils'

type PayrollCostSummary = {
  currentPeriod: string
  totalGrossCost: number
  totalNetDisbursed: number
  employerContributions: number
  totalTaxWithheld: number
  employeeCount: number
  costAsPercentOfRevenue?: number
}

type DeptCost = {
  department: string
  headcount: number
  grossCost: number
  percentOfTotal: number
}

type MonthlyCost = {
  period: string
  grossCost: number
  netDisbursed: number
  headcount: number
}

type PayrollFinanceData = {
  current: PayrollCostSummary
  departmentBreakdown: DeptCost[]
  monthlyTrend: MonthlyCost[]
}

export default function PayrollFinancePage() {
  const dataQuery = useQuery({
    queryKey: ['payroll-finance-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<PayrollFinanceData>('/finance/payroll-cost')
      return res.data
    },
    retry: false,
  })

  const d = dataQuery.data
  const c = d?.current

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Payroll Finance</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Payroll cost view integrated with campus finance — total employer cost, tax and disbursement.
      </p>

      {dataQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          Payroll finance data not yet available. Will appear once the Finance + Payroll backend integration is deployed.
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Gross Payroll Cost"   value={c ? formatCurrency(c.totalGrossCost) : '—'}       icon="💰" />
        <KpiCard label="Net Disbursed"         value={c ? formatCurrency(c.totalNetDisbursed) : '—'}    icon="💵" trend="up" />
        <KpiCard label="Employer Contributions" value={c ? formatCurrency(c.employerContributions) : '—'} icon="🏛️" />
        <KpiCard label="Tax Withheld"          value={c ? formatCurrency(c.totalTaxWithheld) : '—'}    icon="📋" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Current Period"    value={c?.currentPeriod ?? '—'}                        icon="📅" />
        <KpiCard label="Employees on Roll" value={c?.employeeCount ?? '—'}                        icon="👤" />
        <KpiCard
          label="Cost % of Revenue"
          value={c?.costAsPercentOfRevenue != null ? `${c.costAsPercentOfRevenue.toFixed(1)}%` : '—'}
          icon="📊"
          trend={c?.costAsPercentOfRevenue != null && c.costAsPercentOfRevenue > 60 ? 'down' : 'neutral'}
        />
        <KpiCard label="Dept Coverage" value={d?.departmentBreakdown?.length ?? '—'} icon="🏢" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department cost breakdown */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Cost by Department</h2>
          {!d?.departmentBreakdown?.length ? (
            <p className="text-sm text-muted-foreground">No department data available.</p>
          ) : (
            <div className="space-y-3">
              {d.departmentBreakdown.map((dept) => (
                <div key={dept.department}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-800">{dept.department}</span>
                    <span className="text-muted-foreground text-xs">{dept.headcount} staff · {formatCurrency(dept.grossCost)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${Math.min(dept.percentOfTotal, 100)}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-10 text-right">{dept.percentOfTotal.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly trend */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Monthly Payroll Cost Trend</h2>
          {!d?.monthlyTrend?.length ? (
            <p className="text-sm text-muted-foreground">No trend data available.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-semibold text-gray-700">Period</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Gross</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Net</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Staff</th>
                </tr>
              </thead>
              <tbody>
                {d.monthlyTrend.map((m) => (
                  <tr key={m.period} className="border-b border-border last:border-b-0">
                    <td className="py-2 font-mono font-medium">{m.period}</td>
                    <td className="py-2 text-right">{formatCurrency(m.grossCost)}</td>
                    <td className="py-2 text-right text-emerald-700">{formatCurrency(m.netDisbursed)}</td>
                    <td className="py-2 text-right">{m.headcount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
