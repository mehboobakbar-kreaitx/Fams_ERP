import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'

type CompareMetric = 'academic' | 'attendance' | 'finance' | 'operational'

type CampusComparison = {
  id: string
  campusName: string
  schoolName: string
  city: string
  totalStudents: number
  passRate: number
  studentAttendanceRate: number
  staffAttendanceRate: number
  feeCollectionRate: number
  overallKpiScore: number
  rank: number
}

type NetworkSummary = {
  totalCampuses: number
  totalStudents: number
  networkPassRate: number
  networkAttendanceRate: number
}

const METRIC_LABELS: Record<CompareMetric, string> = {
  academic:    'Pass Rate',
  attendance:  'Student Attendance',
  finance:     'Fee Collection Rate',
  operational: 'KPI Score',
}

function metricValue(r: CampusComparison, metric: CompareMetric): number {
  if (metric === 'academic')    return r.passRate
  if (metric === 'attendance')  return r.studentAttendanceRate
  if (metric === 'finance')     return r.feeCollectionRate
  return r.overallKpiScore
}

export default function CrossCampusPage() {
  const [metric, setMetric] = useState<CompareMetric>('academic')
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString())

  const summaryQuery = useQuery({
    queryKey: ['network-summary', academicYear],
    queryFn: async () => {
      const res = await axiosClient.get<NetworkSummary>('/reports/cross-campus/summary', { params: { year: academicYear } })
      return res.data
    },
    retry: false,
  })

  const comparisonQuery = useQuery({
    queryKey: ['cross-campus-comparison', academicYear],
    queryFn: async () => {
      const res = await axiosClient.get<CampusComparison[]>('/reports/cross-campus/comparison', { params: { year: academicYear } })
      return Array.isArray(res.data) ? res.data : []
    },
    retry: false,
  })

  const s = summaryQuery.data
  const campuses = comparisonQuery.data ?? []
  const sorted = [...campuses].sort((a, b) => metricValue(b, metric) - metricValue(a, metric))
  const maxVal = sorted.length > 0 ? metricValue(sorted[0], metric) : 100

  const columns: Column<CampusComparison>[] = [
    {
      key: 'rank', header: '#', width: '50px',
      render: (r) => <span className={`font-bold ${r.rank <= 3 ? 'text-amber-600' : 'text-gray-500'}`}>{r.rank}</span>,
    },
    {
      key: 'campusName', header: 'Campus',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.campusName}</p>
          <p className="text-xs text-muted-foreground">{r.schoolName} · {r.city}</p>
        </div>
      ),
    },
    { key: 'totalStudents', header: 'Students', width: '90px', render: (r) => <span className="font-semibold">{r.totalStudents.toLocaleString()}</span> },
    {
      key: 'passRate', header: 'Pass Rate', width: '100px',
      render: (r) => <span className={`font-semibold ${r.passRate >= 80 ? 'text-emerald-700' : r.passRate >= 65 ? 'text-amber-600' : 'text-red-600'}`}>{r.passRate.toFixed(0)}%</span>,
    },
    {
      key: 'studentAttendanceRate', header: 'Attendance', width: '100px',
      render: (r) => <span className={`font-semibold ${r.studentAttendanceRate >= 90 ? 'text-emerald-700' : r.studentAttendanceRate >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{r.studentAttendanceRate.toFixed(0)}%</span>,
    },
    {
      key: 'feeCollectionRate', header: 'Fee Coll.', width: '100px',
      render: (r) => <span className={`font-semibold ${r.feeCollectionRate >= 90 ? 'text-emerald-700' : 'text-amber-600'}`}>{r.feeCollectionRate.toFixed(0)}%</span>,
    },
    {
      key: 'overallKpiScore', header: 'KPI Score', width: '110px',
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-100 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-primary-600" style={{ width: `${r.overallKpiScore}%` }} />
          </div>
          <span className="text-xs font-semibold">{r.overallKpiScore.toFixed(0)}</span>
        </div>
      ),
    },
  ]

  const METRICS: { key: CompareMetric; label: string }[] = [
    { key: 'academic', label: 'Academic' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'finance', label: 'Finance' },
    { key: 'operational', label: 'KPI Score' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cross-Campus Analytics</h1>
          <p className="text-sm text-muted-foreground">Compare performance metrics across all campuses in the network.</p>
        </div>
        <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}
          className="border border-input rounded-lg px-3 py-2 text-sm">
          {[2026, 2025, 2024, 2023].map((y) => <option key={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Campuses"      value={s?.totalCampuses?.toLocaleString() ?? '—'}        icon="🏫" />
        <KpiCard label="Network Students"    value={s?.totalStudents?.toLocaleString() ?? '—'}         icon="👥" />
        <KpiCard label="Network Pass Rate"   value={s ? `${s.networkPassRate.toFixed(0)}%` : '—'}      icon="✅" trend={s && s.networkPassRate >= 80 ? 'up' : 'neutral'} />
        <KpiCard label="Network Attendance"  value={s ? `${s.networkAttendanceRate.toFixed(0)}%` : '—'} icon="📅" />
      </div>

      {comparisonQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Cross-campus analytics API not yet available. Will appear once the reporting backend is deployed.
        </p>
      )}

      {/* Bar chart comparison */}
      {sorted.length > 0 && (
        <div className="bg-white border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-sm">Campus Ranking by {METRIC_LABELS[metric]}</h2>
            <div className="flex gap-1">
              {METRICS.map((m) => (
                <button key={m.key} onClick={() => setMetric(m.key)}
                  className={`px-3 py-1 rounded text-xs font-medium ${metric === m.key ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {sorted.slice(0, 10).map((campus, i) => {
              const val = metricValue(campus, metric)
              const barWidth = maxVal > 0 ? (val / maxVal) * 100 : 0
              const barColor = i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-blue-500' : i === 2 ? 'bg-violet-500' : 'bg-gray-400'
              return (
                <div key={campus.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500 w-4">{i + 1}</span>
                  <span className="text-sm text-gray-700 w-40 truncate">{campus.campusName}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4">
                    <div className={`h-4 rounded-full ${barColor} transition-all`} style={{ width: `${barWidth}%` }} />
                  </div>
                  <span className="text-sm font-semibold w-14 text-right">{val.toFixed(0)}{metric !== 'operational' ? '%' : ''}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!comparisonQuery.isLoading && !comparisonQuery.isError && (
        <DataTable<CampusComparison>
          columns={columns}
          data={campuses}
          rowKey={(r) => r.id}
          searchableFields={['campusName', 'schoolName', 'city']}
          pageSize={20}
          emptyMessage="No campus comparison data available."
        />
      )}
    </div>
  )
}
