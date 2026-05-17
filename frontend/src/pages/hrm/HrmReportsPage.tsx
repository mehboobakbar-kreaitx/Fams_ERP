import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'

type HeadcountByDept = { department: string; total: number; active: number; onLeave: number }
type MonthlyAttrition = { month: string; resigned: number; joined: number }
type LeaveBalance = { leaveType: string; totalDays: number; usedDays: number; remainingDays: number }

type ReportData = {
  headcountByDepartment: HeadcountByDept[]
  monthlyAttrition: MonthlyAttrition[]
  leaveBalanceSummary: LeaveBalance[]
  totalHeadcount: number
  activeCount: number
  attritionRateYtd: number
  newJoinsThisMonth: number
}

export default function HrmReportsPage() {
  const reportQuery = useQuery({
    queryKey: ['hrm-reports'],
    queryFn: async () => {
      const res = await axiosClient.get<ReportData>('/hrm/reports')
      return res.data
    },
    retry: false,
  })

  const data = reportQuery.data

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">HR Reports & Analytics</h1>
      <p className="text-sm text-muted-foreground mb-6">Headcount, attrition, leave utilization and workforce analytics.</p>

      {reportQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          HR Reports API not yet available. Analytics will appear once the HRM backend module is deployed.
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Headcount" value={data?.totalHeadcount ?? '—'} icon="👥" />
        <KpiCard label="Active Staff" value={data?.activeCount ?? '—'} icon="✅" trend="up" />
        <KpiCard
          label="Attrition Rate YTD"
          value={data ? `${data.attritionRateYtd.toFixed(1)}%` : '—'}
          icon="📉"
          trend="down"
        />
        <KpiCard label="New Joins This Month" value={data?.newJoinsThisMonth ?? '—'} icon="🆕" trend="up" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Headcount by Department */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Headcount by Department</h2>
          {!data?.headcountByDepartment?.length ? (
            <p className="text-sm text-muted-foreground">No data available.</p>
          ) : (
            <div className="space-y-3">
              {data.headcountByDepartment.map((d) => {
                const pct = d.total > 0 ? Math.round((d.active / d.total) * 100) : 0
                return (
                  <div key={d.department}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-800">{d.department}</span>
                      <span className="text-muted-foreground">{d.active}/{d.total}</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Leave Balance Summary */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Leave Balance Summary</h2>
          {!data?.leaveBalanceSummary?.length ? (
            <p className="text-sm text-muted-foreground">No data available.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-semibold text-gray-700">Leave Type</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Total</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Used</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {data.leaveBalanceSummary.map((l) => (
                  <tr key={l.leaveType} className="border-b border-border last:border-b-0">
                    <td className="py-2">{l.leaveType}</td>
                    <td className="py-2 text-right">{l.totalDays}</td>
                    <td className="py-2 text-right text-amber-700">{l.usedDays}</td>
                    <td className="py-2 text-right text-emerald-700 font-medium">{l.remainingDays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Monthly Attrition */}
        <div className="bg-white rounded-xl border border-border p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Monthly Attrition vs Joins</h2>
          {!data?.monthlyAttrition?.length ? (
            <p className="text-sm text-muted-foreground">No data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-semibold text-gray-700">Month</th>
                    <th className="text-right py-2 font-semibold text-gray-700">Resigned</th>
                    <th className="text-right py-2 font-semibold text-gray-700">Joined</th>
                    <th className="text-right py-2 font-semibold text-gray-700">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthlyAttrition.map((m) => {
                    const net = m.joined - m.resigned
                    return (
                      <tr key={m.month} className="border-b border-border last:border-b-0">
                        <td className="py-2 font-medium">{m.month}</td>
                        <td className="py-2 text-right text-red-600">{m.resigned}</td>
                        <td className="py-2 text-right text-emerald-600">{m.joined}</td>
                        <td className={`py-2 text-right font-semibold ${net >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          {net >= 0 ? '+' : ''}{net}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
