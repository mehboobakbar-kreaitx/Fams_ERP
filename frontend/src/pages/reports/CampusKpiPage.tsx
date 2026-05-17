import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'

type KpiMetric = {
  label: string
  value: string
  target: string
  achieved: boolean
  trend: 'up' | 'down' | 'neutral'
  icon: string
}

type KpiSection = {
  title: string
  icon: string
  color: string
  metrics: KpiMetric[]
}

type CampusKpiData = {
  campusName: string
  period: string
  overallScore: number
  academicScore: number
  financialScore: number
  operationalScore: number
  sections: KpiSection[]
}

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? 'text-emerald-700' : score >= 60 ? 'text-amber-600' : 'text-red-600'
  const barColor = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex flex-col items-center">
      <div className={`text-3xl font-bold ${color}`}>{score.toFixed(0)}</div>
      <div className="text-xs text-muted-foreground mb-2">{label}</div>
      <div className="w-24 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

function MetricRow({ m }: { m: KpiMetric }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-base">{m.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{m.label}</p>
        <p className="text-xs text-muted-foreground">Target: {m.target}</p>
      </div>
      <div className="text-right">
        <p className={`font-semibold text-sm ${m.achieved ? 'text-emerald-700' : 'text-red-600'}`}>{m.value}</p>
        <span className={`text-xs ${m.achieved ? 'text-emerald-600' : 'text-red-500'}`}>{m.achieved ? '✓ Met' : '✗ Missed'}</span>
      </div>
    </div>
  )
}

const FALLBACK_SECTIONS: KpiSection[] = [
  {
    title: 'Academic Performance',
    icon: '📚',
    color: 'border-blue-200',
    metrics: [
      { label: 'Overall Pass Rate',    value: '—', target: '≥ 85%',   achieved: false, trend: 'neutral', icon: '✅' },
      { label: 'Average GPA',          value: '—', target: '≥ 3.0',   achieved: false, trend: 'neutral', icon: '📊' },
      { label: 'Student Attendance',   value: '—', target: '≥ 90%',   achieved: false, trend: 'neutral', icon: '📅' },
      { label: 'Exam Completion Rate', value: '—', target: '100%',    achieved: false, trend: 'neutral', icon: '📝' },
    ],
  },
  {
    title: 'Financial Health',
    icon: '💰',
    color: 'border-amber-200',
    metrics: [
      { label: 'Fee Collection Rate',  value: '—', target: '≥ 95%',   achieved: false, trend: 'neutral', icon: '💳' },
      { label: 'Budget Utilisation',   value: '—', target: '≤ 100%',  achieved: false, trend: 'neutral', icon: '📈' },
      { label: 'Revenue Growth',       value: '—', target: '≥ 5%',    achieved: false, trend: 'neutral', icon: '💵' },
      { label: 'Outstanding Dues',     value: '—', target: '< 5%',    achieved: false, trend: 'neutral', icon: '⚠️' },
    ],
  },
  {
    title: 'HR & Operational',
    icon: '⚙️',
    color: 'border-violet-200',
    metrics: [
      { label: 'Staff Attendance',      value: '—', target: '≥ 95%', achieved: false, trend: 'neutral', icon: '👤' },
      { label: 'Open Vacancies',        value: '—', target: '< 5',   achieved: false, trend: 'neutral', icon: '🔍' },
      { label: 'Payroll Accuracy',      value: '—', target: '99%',   achieved: false, trend: 'neutral', icon: '💵' },
      { label: 'Support Ticket SLA',    value: '—', target: '≥ 90%', achieved: false, trend: 'neutral', icon: '🎫' },
    ],
  },
]

export default function CampusKpiPage() {
  const kpiQuery = useQuery({
    queryKey: ['campus-kpi'],
    queryFn: async () => {
      const res = await axiosClient.get<CampusKpiData>('/reports/campus-kpi')
      return res.data
    },
    retry: false,
  })

  const data = kpiQuery.data
  const sections = data?.sections ?? FALLBACK_SECTIONS
  const overallScore = data?.overallScore ?? 0
  const academicScore = data?.academicScore ?? 0
  const financialScore = data?.financialScore ?? 0
  const operationalScore = data?.operationalScore ?? 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Campus KPI Scorecard</h1>
        <p className="text-sm text-muted-foreground">
          {data ? `${data.campusName} · ${data.period}` : 'Composite campus scorecard across academic, financial and operational dimensions.'}
        </p>
      </div>

      {kpiQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          Campus KPI API not yet available. Targets and thresholds shown below are illustrative.
        </p>
      )}

      {/* Overall score panel */}
      <div className="bg-white border border-border rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-6">Overall Campus Score</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <ScoreGauge score={overallScore}      label="Overall" />
          <ScoreGauge score={academicScore}     label="Academic" />
          <ScoreGauge score={financialScore}    label="Financial" />
          <ScoreGauge score={operationalScore}  label="Operational" />
        </div>
      </div>

      {/* KPI sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <div key={section.title} className={`bg-white border rounded-xl p-5 ${section.color}`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">{section.icon}</span>
              <h2 className="font-semibold text-gray-900 text-sm">{section.title}</h2>
            </div>
            <div>
              {section.metrics.map((m) => <MetricRow key={m.label} m={m} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <KpiCard label="KPIs Met"     value={data ? `${sections.flatMap((s) => s.metrics).filter((m) => m.achieved).length}` : '—'} icon="✅" />
        <KpiCard label="KPIs Missed"  value={data ? `${sections.flatMap((s) => s.metrics).filter((m) => !m.achieved).length}` : '—'} icon="❌" />
        <KpiCard label="Total KPIs"   value={sections.flatMap((s) => s.metrics).length.toString()} icon="📋" />
        <KpiCard label="Score"        value={overallScore > 0 ? `${overallScore.toFixed(0)}/100` : '—'} icon="🏆" />
      </div>
    </div>
  )
}
