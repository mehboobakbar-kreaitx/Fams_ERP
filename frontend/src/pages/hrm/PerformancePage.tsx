import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatDate } from '../../lib/utils'

type Review = {
  id: string
  employeeName: string
  employeeNumber: string
  department: string
  reviewPeriod: string
  reviewDate: string
  overallRating: number
  reviewerName?: string
  status: 'Pending' | 'InProgress' | 'Completed'
}

type Summary = {
  pendingReviews: number
  completedThisCycle: number
  averageRating: number
  topPerformers: number
}

const RATING_COLORS = (r: number) =>
  r >= 4 ? 'text-emerald-700 font-semibold' : r >= 3 ? 'text-amber-700 font-semibold' : 'text-red-700 font-semibold'

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  InProgress: 'bg-blue-100 text-blue-700',
  Completed: 'bg-emerald-100 text-emerald-700',
}

const CYCLES = ['All', 'Annual', 'Mid-Year', 'Probation', 'Quarterly']

export default function PerformancePage() {
  const [cycle, setCycle] = useState('All')

  const summaryQuery = useQuery({
    queryKey: ['perf-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<Summary>('/hrm/performance/summary')
      return res.data
    },
    retry: false,
  })

  const reviewsQuery = useQuery({
    queryKey: ['perf-reviews', cycle],
    queryFn: async () => {
      const params = cycle !== 'All' ? { cycle } : {}
      const res = await axiosClient.get<Review[] | { items: Review[] }>('/hrm/performance/reviews', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const summary = summaryQuery.data
  const reviews = reviewsQuery.data ?? []

  const columns: Column<Review>[] = [
    {
      key: 'employeeName',
      header: 'Employee',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.employeeName}</p>
          <p className="text-xs text-muted-foreground">{r.employeeNumber} · {r.department}</p>
        </div>
      ),
    },
    { key: 'reviewPeriod', header: 'Cycle', width: '110px' },
    { key: 'reviewDate', header: 'Review Date', width: '110px', render: (r) => formatDate(r.reviewDate) },
    {
      key: 'overallRating',
      header: 'Rating',
      width: '90px',
      render: (r) => (
        <span className={RATING_COLORS(r.overallRating)}>
          {r.overallRating.toFixed(1)} / 5
        </span>
      ),
    },
    { key: 'reviewerName', header: 'Reviewer', render: (r) => r.reviewerName ?? '—' },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] ?? ''}`}>
          {r.status === 'InProgress' ? 'In Progress' : r.status}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Performance Reviews</h1>
          <p className="text-sm text-muted-foreground">Annual and periodic staff performance evaluations.</p>
        </div>
        <button className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Start Review Cycle
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Pending Reviews" value={summary?.pendingReviews ?? '—'} icon="⏳" trend="down" />
        <KpiCard label="Completed This Cycle" value={summary?.completedThisCycle ?? '—'} icon="✅" trend="up" />
        <KpiCard
          label="Avg Rating"
          value={summary ? `${summary.averageRating.toFixed(1)} / 5` : '—'}
          icon="⭐"
        />
        <KpiCard label="Top Performers" value={summary?.topPerformers ?? '—'} icon="🏆" trend="up" />
      </div>

      <div className="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-2 items-center">
        <span className="text-xs font-medium text-gray-600 mr-1">Review Cycle:</span>
        {CYCLES.map((c) => (
          <button
            key={c}
            onClick={() => setCycle(c)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border ${
              cycle === c
                ? 'bg-primary-700 text-white border-primary-700'
                : 'bg-white text-gray-700 border-border hover:bg-gray-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {reviewsQuery.isLoading && <p className="text-muted-foreground">Loading reviews…</p>}
      {reviewsQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
          Performance API not yet available. Data will appear once the HRM backend module is deployed.
        </p>
      )}
      {!reviewsQuery.isLoading && !reviewsQuery.isError && (
        <DataTable<Review>
          columns={columns}
          data={reviews}
          rowKey={(r) => r.id}
          searchableFields={['employeeName', 'employeeNumber', 'department', 'reviewPeriod']}
          pageSize={15}
          emptyMessage="No performance reviews yet."
        />
      )}
    </div>
  )
}
