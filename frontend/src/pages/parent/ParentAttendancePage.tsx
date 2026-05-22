import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'

type ChildSummary = {
  studentId: string
  name: string
  rollNumber: string
  className: string
  attendancePercentLast30Days: number
}

type ParentDashboardDto = { children: ChildSummary[] }

export default function ParentAttendancePage() {
  const dash = useQuery({
    queryKey: ['parent-attendance'],
    queryFn: async () => {
      const res = await axiosClient.get<ParentDashboardDto>('/dashboard/parent')
      return res.data
    },
    retry: false,
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Attendance</h1>
      <p className="text-sm text-muted-foreground mb-6">Last 30 days attendance per child.</p>

      {dash.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          Could not load attendance data. Please refresh to try again.
        </p>
      )}

      {dash.isLoading && (
        <p className="text-sm text-muted-foreground mb-4">Loading attendance…</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!dash.isLoading && !dash.isError && (dash.data?.children ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground col-span-2">No children linked to this account.</p>
        )}
        {(dash.data?.children ?? []).map((c) => {
          const pct = c.attendancePercentLast30Days
          const cls = pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-500' : 'bg-red-500'
          return (
            <div key={c.studentId} className="bg-white border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c.className} • Roll {c.rollNumber}</p>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className={`${cls} h-3 rounded-full`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
              </div>
              <p className="text-right text-sm mt-1 font-medium">{(pct ?? 0).toFixed(1)}%</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
