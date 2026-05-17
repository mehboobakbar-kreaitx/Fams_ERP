import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'

type Tab = 'overview' | 'rankings' | 'subjects' | 'exams'

type ClassOverview = {
  id: string
  className: string
  section: string
  totalStudents: number
  passCount: number
  failCount: number
  passRate: number
  averageGpa: number
  topScore: number
}

type ClassRanking = {
  id: string
  rank: number
  studentName: string
  className: string
  gpa: number
  totalMarks: number
  percentage: number
}

type SubjectPerformance = {
  id: string
  subjectName: string
  className: string
  averageScore: number
  passRate: number
  highestScore: number
  lowestScore: number
  totalStudents: number
}

type ExamResult = {
  id: string
  examName: string
  examDate: string
  className: string
  averageScore: number
  passRate: number
  totalCandidates: number
  gradeDistribution: { grade: string; count: number }[]
}

type AcademicSummary = {
  overallPassRate: number
  averageGpa: number
  totalStudentsAssessed: number
  examsThisTerm: number
}

const GRADE_COLORS: Record<string, string> = {
  'A+': 'bg-emerald-100 text-emerald-800',
  A:   'bg-emerald-100 text-emerald-700',
  B:   'bg-blue-100 text-blue-700',
  C:   'bg-amber-100 text-amber-700',
  D:   'bg-orange-100 text-orange-700',
  F:   'bg-red-100 text-red-700',
}

export default function AcademicReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString())

  const summaryQuery = useQuery({
    queryKey: ['academic-reports-summary', academicYear],
    queryFn: async () => {
      const res = await axiosClient.get<AcademicSummary>('/reports/academic/summary', { params: { year: academicYear } })
      return res.data
    },
    retry: false,
  })

  const overviewQuery = useQuery({
    queryKey: ['academic-class-overview', academicYear],
    queryFn: async () => {
      const res = await axiosClient.get<ClassOverview[]>('/reports/academic/class-overview', { params: { year: academicYear } })
      return Array.isArray(res.data) ? res.data : []
    },
    enabled: activeTab === 'overview',
    retry: false,
  })

  const rankingsQuery = useQuery({
    queryKey: ['academic-rankings', academicYear],
    queryFn: async () => {
      const res = await axiosClient.get<ClassRanking[]>('/reports/academic/rankings', { params: { year: academicYear } })
      return Array.isArray(res.data) ? res.data : []
    },
    enabled: activeTab === 'rankings',
    retry: false,
  })

  const subjectsQuery = useQuery({
    queryKey: ['academic-subjects', academicYear],
    queryFn: async () => {
      const res = await axiosClient.get<SubjectPerformance[]>('/reports/academic/subjects', { params: { year: academicYear } })
      return Array.isArray(res.data) ? res.data : []
    },
    enabled: activeTab === 'subjects',
    retry: false,
  })

  const examsQuery = useQuery({
    queryKey: ['academic-exams', academicYear],
    queryFn: async () => {
      const res = await axiosClient.get<ExamResult[]>('/reports/academic/exams', { params: { year: academicYear } })
      return Array.isArray(res.data) ? res.data : []
    },
    enabled: activeTab === 'exams',
    retry: false,
  })

  const s = summaryQuery.data

  const overviewCols: Column<ClassOverview>[] = [
    { key: 'className', header: 'Class / Section', render: (r) => <span className="font-medium">{r.className} {r.section}</span> },
    { key: 'totalStudents', header: 'Students', width: '90px', render: (r) => <span className="font-semibold">{r.totalStudents}</span> },
    {
      key: 'passRate', header: 'Pass Rate', width: '120px',
      render: (r) => (
        <div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full ${r.passRate >= 80 ? 'bg-emerald-500' : r.passRate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${r.passRate}%` }} />
            </div>
            <span className={`text-xs font-semibold ${r.passRate >= 80 ? 'text-emerald-700' : r.passRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{r.passRate.toFixed(0)}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{r.passCount} pass / {r.failCount} fail</p>
        </div>
      ),
    },
    { key: 'averageGpa', header: 'Avg GPA', width: '80px', render: (r) => <span className="font-mono font-semibold">{r.averageGpa.toFixed(2)}</span> },
    { key: 'topScore', header: 'Top Score', width: '90px', render: (r) => <span className="font-semibold text-emerald-700">{r.topScore}%</span> },
  ]

  const rankingCols: Column<ClassRanking>[] = [
    { key: 'rank', header: '#', width: '50px', render: (r) => <span className={`font-bold ${r.rank <= 3 ? 'text-amber-600' : 'text-gray-600'}`}>{r.rank}</span> },
    { key: 'studentName', header: 'Student', render: (r) => <span className="font-medium">{r.studentName}</span> },
    { key: 'className', header: 'Class', width: '100px' },
    { key: 'gpa', header: 'GPA', width: '70px', render: (r) => <span className="font-mono font-semibold">{r.gpa.toFixed(2)}</span> },
    { key: 'percentage', header: 'Score', width: '80px', render: (r) => <span className={`font-semibold ${r.percentage >= 90 ? 'text-emerald-700' : r.percentage >= 75 ? 'text-blue-600' : 'text-gray-700'}`}>{r.percentage.toFixed(1)}%</span> },
  ]

  const subjectCols: Column<SubjectPerformance>[] = [
    { key: 'subjectName', header: 'Subject', render: (r) => <span className="font-medium">{r.subjectName}</span> },
    { key: 'className', header: 'Class', width: '100px' },
    { key: 'totalStudents', header: 'Students', width: '80px' },
    {
      key: 'averageScore', header: 'Avg Score', width: '100px',
      render: (r) => <span className={`font-semibold ${r.averageScore >= 70 ? 'text-emerald-700' : r.averageScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{r.averageScore.toFixed(1)}%</span>,
    },
    { key: 'passRate', header: 'Pass Rate', width: '90px', render: (r) => <span className="font-semibold">{r.passRate.toFixed(0)}%</span> },
    { key: 'highestScore', header: 'High', width: '70px', render: (r) => <span className="text-emerald-700 font-medium">{r.highestScore}%</span> },
    { key: 'lowestScore', header: 'Low', width: '70px', render: (r) => <span className="text-red-600 font-medium">{r.lowestScore}%</span> },
  ]

  const examCols: Column<ExamResult>[] = [
    { key: 'examName', header: 'Exam', render: (r) => <span className="font-medium">{r.examName}</span> },
    { key: 'className', header: 'Class', width: '100px' },
    { key: 'examDate', header: 'Date', width: '110px', render: (r) => <span className="font-mono text-xs">{r.examDate}</span> },
    { key: 'totalCandidates', header: 'Candidates', width: '100px', render: (r) => <span className="font-semibold">{r.totalCandidates}</span> },
    { key: 'averageScore', header: 'Avg Score', width: '100px', render: (r) => <span className="font-semibold">{r.averageScore.toFixed(1)}%</span> },
    { key: 'passRate', header: 'Pass Rate', width: '90px', render: (r) => <span className={`font-semibold ${r.passRate >= 80 ? 'text-emerald-700' : r.passRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{r.passRate.toFixed(0)}%</span> },
    {
      key: 'gradeDistribution', header: 'Grades', width: '160px',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.gradeDistribution?.map((g) => (
            <span key={g.grade} className={`text-xs px-1.5 py-0.5 rounded font-semibold ${GRADE_COLORS[g.grade] ?? 'bg-gray-100 text-gray-600'}`}>
              {g.grade}: {g.count}
            </span>
          ))}
        </div>
      ),
    },
  ]

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Class Overview' },
    { key: 'rankings', label: 'Student Rankings' },
    { key: 'subjects', label: 'Subject Performance' },
    { key: 'exams', label: 'Exam Analysis' },
  ]

  const isApiError = summaryQuery.isError

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Academic Reports</h1>
          <p className="text-sm text-muted-foreground">Pass/fail rates, class rankings, subject performance and exam analysis.</p>
        </div>
        <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}
          className="border border-input rounded-lg px-3 py-2 text-sm">
          {[2026, 2025, 2024, 2023].map((y) => <option key={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Overall Pass Rate"   value={s ? `${s.overallPassRate.toFixed(0)}%` : '—'} icon="✅" trend={s && s.overallPassRate >= 80 ? 'up' : 'neutral'} />
        <KpiCard label="Average GPA"         value={s ? s.averageGpa.toFixed(2) : '—'}             icon="📊" />
        <KpiCard label="Students Assessed"   value={s?.totalStudentsAssessed?.toLocaleString() ?? '—'} icon="👥" />
        <KpiCard label="Exams This Term"     value={s?.examsThisTerm?.toLocaleString() ?? '—'}     icon="📝" />
      </div>

      {isApiError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Academic reports API not yet available. Will appear once the Academic backend module is deployed.
        </p>
      )}

      <div className="flex gap-1 mb-4 flex-wrap">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === t.key ? 'bg-primary-700 text-white' : 'bg-white border border-border text-gray-700 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && !overviewQuery.isLoading && !overviewQuery.isError && (
        <DataTable<ClassOverview> columns={overviewCols} data={overviewQuery.data ?? []} rowKey={(r) => r.id}
          searchableFields={['className', 'section']} pageSize={20} emptyMessage="No class data available." />
      )}
      {activeTab === 'rankings' && !rankingsQuery.isLoading && !rankingsQuery.isError && (
        <DataTable<ClassRanking> columns={rankingCols} data={rankingsQuery.data ?? []} rowKey={(r) => r.id}
          searchableFields={['studentName', 'className']} pageSize={20} emptyMessage="No ranking data available." />
      )}
      {activeTab === 'subjects' && !subjectsQuery.isLoading && !subjectsQuery.isError && (
        <DataTable<SubjectPerformance> columns={subjectCols} data={subjectsQuery.data ?? []} rowKey={(r) => r.id}
          searchableFields={['subjectName', 'className']} pageSize={20} emptyMessage="No subject data available." />
      )}
      {activeTab === 'exams' && !examsQuery.isLoading && !examsQuery.isError && (
        <DataTable<ExamResult> columns={examCols} data={examsQuery.data ?? []} rowKey={(r) => r.id}
          searchableFields={['examName', 'className']} pageSize={20} emptyMessage="No exam data available." />
      )}
    </div>
  )
}
