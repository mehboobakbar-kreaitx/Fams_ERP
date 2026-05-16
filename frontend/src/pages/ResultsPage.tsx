import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../api/axiosClient'
import KpiCard from '../components/ui/KpiCard'
import DataTable, { type Column } from '../components/ui/DataTable'

type ResultRow = {
  id: string
  subjectName: string
  obtainedMarks: number
  totalMarks: number
  grade: string
  examName: string
  termName?: string
}

type Analytics = {
  averageMarks: number
  passCount: number
  failCount: number
  passRate: number
  highestMarks: number
  lowestMarks: number
}

type AnalyticsFilters = {
  subjectId: string
  examType: string
  termName: string
}

export default function ResultsPage() {
  const [studentId, setStudentId] = useState<string>('')
  const [filters, setFilters] = useState<AnalyticsFilters>({ subjectId: '', examType: '', termName: '' })

  const studentResults = useQuery({
    queryKey: ['results-student', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const res = await axiosClient.get<ResultRow[] | { items: ResultRow[] }>(`/results/student/${studentId}`)
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
  })

  const analytics = useQuery({
    queryKey: ['results-analytics', filters],
    enabled: !!(filters.subjectId && filters.examType && filters.termName),
    queryFn: async () => {
      const params = new URLSearchParams(filters)
      const res = await axiosClient.get<Analytics>(`/results/analytics?${params}`)
      return res.data
    },
  })

  const columns: Column<ResultRow>[] = [
    { key: 'examName', header: 'Exam' },
    { key: 'subjectName', header: 'Subject' },
    {
      key: 'obtainedMarks',
      header: 'Marks',
      render: (r) => `${r.obtainedMarks} / ${r.totalMarks}`,
    },
    {
      key: 'grade',
      header: 'Grade',
      render: (r) => {
        const cls = r.grade === 'F' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
        return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{r.grade}</span>
      },
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Results</h1>
      <p className="text-sm text-muted-foreground mb-6">View student results and subject analytics.</p>

      <div className="bg-white rounded-xl border border-border p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Subject Analytics</h2>
        <p className="text-xs text-muted-foreground mb-3">Provide subject, exam type and term to view aggregate analytics.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            placeholder="Subject ID (GUID)"
            value={filters.subjectId}
            onChange={(e) => setFilters((f) => ({ ...f, subjectId: e.target.value }))}
            className="border border-input rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder="Exam type (e.g. Mid, Final)"
            value={filters.examType}
            onChange={(e) => setFilters((f) => ({ ...f, examType: e.target.value }))}
            className="border border-input rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder="Term name (e.g. Spring2026)"
            value={filters.termName}
            onChange={(e) => setFilters((f) => ({ ...f, termName: e.target.value }))}
            className="border border-input rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Average" value={analytics.data?.averageMarks?.toFixed(1) ?? '—'} icon="📈" />
        <KpiCard
          label="Pass Rate"
          value={analytics.data ? `${(analytics.data.passRate ?? 0).toFixed(1)}%` : '—'}
          trend="up"
          icon="✅"
        />
        <KpiCard label="Highest" value={analytics.data?.highestMarks ?? '—'} icon="🏆" />
        <KpiCard label="Lowest" value={analytics.data?.lowestMarks ?? '—'} trend="down" icon="⚠️" />
      </div>

      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Student Results</h2>
        <input
          placeholder="Student ID (GUID) — paste from Students page"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="border border-input rounded-lg px-3 py-2 text-sm w-full max-w-md mb-4"
        />
        {!studentId && <p className="text-sm text-muted-foreground">Enter a student ID to view their results.</p>}
        {studentId && studentResults.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {studentId && studentResults.isError && <p className="text-sm text-red-600">Failed to load results.</p>}
        {studentId && !studentResults.isLoading && !studentResults.isError && (
          <DataTable<ResultRow>
            columns={columns}
            data={studentResults.data ?? []}
            rowKey={(r) => r.id}
            pageSize={10}
            emptyMessage="No published results for this student yet."
          />
        )}
      </div>
    </div>
  )
}
