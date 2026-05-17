import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatDate } from '../../lib/utils'

type ExamSchedule = {
  id: string
  examTitle: string
  examType: string
  subjectName: string
  className: string
  sectionName?: string
  scheduledDate: string
  startTime?: string
  endTime?: string
  totalMarks: number
  passingMarks: number
  venue?: string
  status: 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled'
}

type ExamSummary = {
  totalExams: number
  scheduledCount: number
  completedCount: number
  averagePassRate: number
}

const STATUS_COLORS: Record<string, string> = {
  Scheduled: 'bg-blue-100 text-blue-700',
  Ongoing: 'bg-amber-100 text-amber-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-700',
}

const EXAM_TYPES = ['All', 'Quiz', 'Mid', 'Final', 'Assignment', 'Lab', 'Practical']

export default function ExaminationsPage() {
  const [typeFilter, setTypeFilter] = useState('All')

  const summaryQuery = useQuery({
    queryKey: ['exams-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<ExamSummary>('/academic/exams/summary')
      return res.data
    },
    retry: false,
  })

  const examsQuery = useQuery({
    queryKey: ['exams-schedule', typeFilter],
    queryFn: async () => {
      const params = typeFilter !== 'All' ? { examType: typeFilter } : {}
      const res = await axiosClient.get<ExamSchedule[] | { items: ExamSchedule[] }>('/academic/exams', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const summary = summaryQuery.data
  const exams = examsQuery.data ?? []

  const columns: Column<ExamSchedule>[] = [
    {
      key: 'examTitle',
      header: 'Exam',
      render: (r) => <span className="font-medium text-gray-900">{r.examTitle}</span>,
    },
    {
      key: 'examType',
      header: 'Type',
      width: '90px',
      render: (r) => (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
          {r.examType}
        </span>
      ),
    },
    { key: 'subjectName', header: 'Subject' },
    {
      key: 'className',
      header: 'Class / Section',
      render: (r) => (r.sectionName ? `${r.className} — ${r.sectionName}` : r.className),
    },
    {
      key: 'scheduledDate',
      header: 'Date',
      width: '110px',
      render: (r) => formatDate(r.scheduledDate),
    },
    {
      key: 'totalMarks',
      header: 'Marks',
      width: '110px',
      render: (r) => `${r.passingMarks} / ${r.totalMarks}`,
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {r.status}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Examinations</h1>
          <p className="text-sm text-muted-foreground">Schedule and track exams, quizzes and assessments.</p>
        </div>
        <button className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Schedule Exam
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Exams" value={summary?.totalExams ?? '—'} icon="📝" />
        <KpiCard label="Scheduled" value={summary?.scheduledCount ?? '—'} icon="📅" />
        <KpiCard label="Completed" value={summary?.completedCount ?? '—'} icon="✅" />
        <KpiCard
          label="Avg Pass Rate"
          value={summary ? `${summary.averagePassRate.toFixed(1)}%` : '—'}
          icon="📈"
          trend="up"
        />
      </div>

      <div className="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-2 items-center">
        <span className="text-xs font-medium text-gray-600 mr-1">Filter by type:</span>
        {EXAM_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border ${
              typeFilter === t
                ? 'bg-primary-700 text-white border-primary-700'
                : 'bg-white text-gray-700 border-border hover:bg-gray-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {examsQuery.isLoading && <p className="text-muted-foreground">Loading exam schedule…</p>}
      {examsQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
          Examination data is not yet available from the API. This module will be active once the Academic Management
          backend is deployed.
        </p>
      )}
      {!examsQuery.isLoading && !examsQuery.isError && (
        <DataTable<ExamSchedule>
          columns={columns}
          data={exams}
          rowKey={(r) => r.id}
          searchableFields={['examTitle', 'subjectName', 'className']}
          pageSize={15}
          emptyMessage="No exams scheduled yet."
        />
      )}
    </div>
  )
}
