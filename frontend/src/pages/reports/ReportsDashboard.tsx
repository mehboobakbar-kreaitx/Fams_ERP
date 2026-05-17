import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'

type ReportSummary = {
  totalReportsGenerated: number
  reportsThisMonth: number
  scheduledReports: number
  pendingExports: number
}

type ReportModule = {
  title: string
  description: string
  icon: string
  links: { label: string; to: string }[]
  color: string
}

const CAMPUS_MODULES: ReportModule[] = [
  {
    title: 'Academic Reports',
    icon: '📚',
    description: 'Pass/fail rates, class rankings, subject performance and exam analysis.',
    color: 'border-blue-200 bg-blue-50',
    links: [
      { label: 'Academic Overview', to: 'academic' },
    ],
  },
  {
    title: 'Attendance Reports',
    icon: '📅',
    description: 'Student and staff attendance rates, trends, and absentee lists.',
    color: 'border-emerald-200 bg-emerald-50',
    links: [
      { label: 'Attendance Overview', to: 'attendance' },
    ],
  },
  {
    title: 'Finance Reports',
    icon: '💰',
    description: 'Revenue, expenses, budget variance and financial health indicators.',
    color: 'border-amber-200 bg-amber-50',
    links: [
      { label: 'Financial Reports', to: '../finance/reports' },
    ],
  },
  {
    title: 'Payroll Reports',
    icon: '💵',
    description: 'Salary costs, payslip history, deductions, taxes and payroll trends.',
    color: 'border-violet-200 bg-violet-50',
    links: [
      { label: 'Payroll Reports', to: '../payroll/reports' },
    ],
  },
  {
    title: 'HR Reports',
    icon: '👤',
    description: 'Headcount, leave utilisation, performance scores and recruitment metrics.',
    color: 'border-pink-200 bg-pink-50',
    links: [
      { label: 'HR Reports', to: '../hrm/reports' },
    ],
  },
  {
    title: 'Procurement Reports',
    icon: '🛒',
    description: 'Spend by category, vendor performance, PO aging and monthly trends.',
    color: 'border-orange-200 bg-orange-50',
    links: [
      { label: 'Procurement Reports', to: '../procurement/reports' },
    ],
  },
  {
    title: 'Campus KPIs',
    icon: '📊',
    description: 'Composite campus scorecard across academic, financial and operational dimensions.',
    color: 'border-cyan-200 bg-cyan-50',
    links: [
      { label: 'KPI Scorecard', to: 'campus-kpi' },
    ],
  },
  {
    title: 'Operational Reports',
    icon: '⚙️',
    description: 'Transport utilisation, library activity, hostel occupancy aggregation.',
    color: 'border-teal-200 bg-teal-50',
    links: [
      { label: 'Operational Overview', to: 'operational' },
    ],
  },
]

export default function ReportsDashboard() {
  const summaryQuery = useQuery({
    queryKey: ['reports-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<ReportSummary>('/reports/summary')
      return res.data
    },
    retry: false,
  })

  const s = summaryQuery.data

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground">Centralised hub for all campus reports and data exports.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Reports Generated"   value={s?.totalReportsGenerated?.toLocaleString() ?? '—'} icon="📄" />
        <KpiCard label="This Month"          value={s?.reportsThisMonth?.toLocaleString() ?? '—'}      icon="📅" />
        <KpiCard label="Scheduled Reports"   value={s?.scheduledReports?.toLocaleString() ?? '—'}      icon="⏰" />
        <KpiCard label="Pending Exports"     value={s?.pendingExports?.toLocaleString() ?? '—'}        icon="📤" />
      </div>

      {summaryQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          Reports summary API not yet available. Navigate to individual report sections below.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {CAMPUS_MODULES.map((mod) => (
          <div key={mod.title} className={`border rounded-xl p-5 ${mod.color}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{mod.icon}</span>
              <h2 className="font-semibold text-gray-900 text-sm">{mod.title}</h2>
            </div>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">{mod.description}</p>
            <div className="flex flex-wrap gap-2">
              {mod.links.map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  relative="path"
                  className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                >
                  {l.label} →
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
