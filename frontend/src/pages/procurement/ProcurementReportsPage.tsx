import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import { formatCurrency } from '../../lib/utils'

type SpendByCategory = { category: string; amount: number; percentage: number; poCount: number }
type VendorPerformance = { vendorName: string; totalOrders: number; onTimeDelivery: number; qualityScore: number; totalSpend: number }
type POAging = { bucket: string; count: number; amount: number }
type MonthlySpend = { period: string; amount: number; poCount: number }

type ProcurementReport = {
  fiscalYear: string
  totalSpend: number
  totalPOs: number
  avgPOValue: number
  savingsVsBudget: number
  spendByCategory: SpendByCategory[]
  vendorPerformance: VendorPerformance[]
  poAging: POAging[]
  monthlySpend: MonthlySpend[]
}

const FISCAL_YEARS = ['2025-26', '2024-25', '2023-24']

export default function ProcurementReportsPage() {
  const [fiscalYear, setFiscalYear] = useState(FISCAL_YEARS[0])
  const [activeTab, setActiveTab] = useState<'spend' | 'vendors' | 'aging' | 'trend'>('spend')

  const reportQuery = useQuery({
    queryKey: ['procurement-reports', fiscalYear],
    queryFn: async () => {
      const res = await axiosClient.get<ProcurementReport>('/procurement/reports', { params: { fiscalYear } })
      return res.data
    },
    retry: false,
  })

  const r = reportQuery.data

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Procurement Reports</h1>
          <p className="text-sm text-muted-foreground">Spend analytics, vendor performance and PO aging analysis.</p>
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
          Procurement reports API not yet available. Will appear once the Procurement backend module is deployed.
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Spend"       value={r ? formatCurrency(r.totalSpend) : '—'}    icon="💰" />
        <KpiCard label="Total POs"         value={r?.totalPOs ?? '—'}                         icon="🛒" />
        <KpiCard label="Avg PO Value"      value={r ? formatCurrency(r.avgPOValue) : '—'}    icon="📊" />
        <KpiCard
          label="Savings vs Budget"
          value={r ? formatCurrency(r.savingsVsBudget) : '—'}
          icon={r && r.savingsVsBudget >= 0 ? '✅' : '⚠️'}
          trend={r && r.savingsVsBudget >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {([
          { key: 'spend',   label: 'Spend by Category' },
          { key: 'vendors', label: 'Vendor Performance' },
          { key: 'aging',   label: 'PO Aging' },
          { key: 'trend',   label: 'Monthly Trend' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === tab.key ? 'bg-primary-700 text-white' : 'bg-white border border-border text-gray-700 hover:bg-gray-50'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Spend by Category */}
      {activeTab === 'spend' && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Spend by Category — {fiscalYear}</h2>
          {!r?.spendByCategory?.length ? (
            <p className="text-sm text-muted-foreground">No spend data available for this period.</p>
          ) : (
            <div className="space-y-4">
              {r.spendByCategory.map((cat) => (
                <div key={cat.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-800">{cat.category}</span>
                    <span className="text-muted-foreground text-xs">{cat.poCount} POs · {formatCurrency(cat.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                      <div
                        className="bg-primary-600 h-2.5 rounded-full"
                        style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-10 text-right">{cat.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vendor Performance */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Vendor Performance — {fiscalYear}</h2>
          {!r?.vendorPerformance?.length ? (
            <p className="text-sm text-muted-foreground">No vendor performance data available.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-semibold text-gray-700">Vendor</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Orders</th>
                  <th className="text-right py-2 font-semibold text-gray-700">On-Time %</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Quality Score</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Total Spend</th>
                </tr>
              </thead>
              <tbody>
                {r.vendorPerformance.map((v) => (
                  <tr key={v.vendorName} className="border-b border-border last:border-0">
                    <td className="py-2 font-medium text-gray-900">{v.vendorName}</td>
                    <td className="py-2 text-right">{v.totalOrders}</td>
                    <td className={`py-2 text-right font-medium ${v.onTimeDelivery >= 90 ? 'text-emerald-700' : v.onTimeDelivery >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                      {v.onTimeDelivery.toFixed(0)}%
                    </td>
                    <td className={`py-2 text-right font-medium ${v.qualityScore >= 4 ? 'text-emerald-700' : v.qualityScore >= 3 ? 'text-amber-600' : 'text-red-600'}`}>
                      {v.qualityScore.toFixed(1)} / 5
                    </td>
                    <td className="py-2 text-right">{formatCurrency(v.totalSpend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* PO Aging */}
      {activeTab === 'aging' && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">PO Aging Analysis</h2>
          {!r?.poAging?.length ? (
            <p className="text-sm text-muted-foreground">No PO aging data available.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-semibold text-gray-700">Age Bucket</th>
                  <th className="text-right py-2 font-semibold text-gray-700">PO Count</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {r.poAging.map((bucket) => (
                  <tr key={bucket.bucket} className="border-b border-border last:border-0">
                    <td className="py-2 font-medium">{bucket.bucket}</td>
                    <td className="py-2 text-right">{bucket.count}</td>
                    <td className="py-2 text-right">{formatCurrency(bucket.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Monthly Trend */}
      {activeTab === 'trend' && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Monthly Spend Trend — {fiscalYear}</h2>
          {!r?.monthlySpend?.length ? (
            <p className="text-sm text-muted-foreground">No monthly trend data available.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-semibold text-gray-700">Period</th>
                  <th className="text-right py-2 font-semibold text-gray-700">POs</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Spend</th>
                </tr>
              </thead>
              <tbody>
                {r.monthlySpend.map((m) => (
                  <tr key={m.period} className="border-b border-border last:border-0">
                    <td className="py-2 font-mono font-medium">{m.period}</td>
                    <td className="py-2 text-right">{m.poCount}</td>
                    <td className="py-2 text-right font-semibold">{formatCurrency(m.amount)}</td>
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
