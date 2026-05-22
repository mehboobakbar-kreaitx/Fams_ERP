import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import { formatCurrency } from '../../lib/utils'

type ChildSummary = {
  studentId: string
  name: string
  rollNumber: string
  className: string
  sectionName: string
  attendancePercentLast30Days: number
  feeBalance: number
  publishedResultsThisTerm: number
}

type ParentDashboardDto = {
  parentId: string
  parentName: string
  childrenCount: number
  totalOutstandingFees: number
  children: ChildSummary[]
}

export default function ParentDashboard() {
  const dash = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: async () => {
      const res = await axiosClient.get<ParentDashboardDto>('/dashboard/parent', {
        headers: { 'x-skip-error-toast': '1' },
        timeout: 15_000,
      })
      return res.data
    },
    retry: false,
  })

  const d = dash.data

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">
        Welcome{d?.parentName ? `, ${d.parentName}` : ''}!
      </h2>
      <p className="text-sm text-muted-foreground mb-6">Your children's academic snapshot.</p>

      {dash.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          Could not load dashboard data. Please refresh to try again.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <KpiCard label="Children" value={d?.childrenCount ?? '—'} icon="👨‍👩‍👧" />
        <KpiCard
          label="Total Outstanding Fees"
          value={d ? formatCurrency(d.totalOutstandingFees) : '—'}
          trend={d && d.totalOutstandingFees > 0 ? 'down' : 'neutral'}
          icon="💰"
        />
        <KpiCard
          label="Published Results"
          value={d?.children.reduce((s, c) => s + c.publishedResultsThisTerm, 0) ?? '—'}
          icon="📊"
        />
      </div>

      {dash.isLoading && (
        <p className="text-sm text-muted-foreground mb-4">Loading children's data…</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(d?.children ?? []).map((c) => (
          <div key={c.studentId} className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{c.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {c.className || '—'} • {c.sectionName || '—'} • Roll {c.rollNumber}
                </p>
              </div>
              <Link
                to={`/parent/children/${c.studentId}`}
                className="text-primary-700 hover:underline text-sm"
              >
                Details →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Attendance (30d)</p>
                <p className="text-lg font-semibold">{(c.attendancePercentLast30Days ?? 0).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fee Balance</p>
                <p className="text-lg font-semibold">{formatCurrency(c.feeBalance)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Results</p>
                <p className="text-lg font-semibold">{c.publishedResultsThisTerm}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
