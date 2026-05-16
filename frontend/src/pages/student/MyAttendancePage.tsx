import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import { authStore } from '../../store/authStore'
import KpiCard from '../../components/ui/KpiCard'
import { formatDate } from '../../lib/utils'

type AttendanceRecord = {
  id: string
  date: string
  status: 'Present' | 'Absent' | 'Late' | 'Leave'
  subjectName?: string
  remarks?: string
}

type AttendanceSummary = {
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  attendancePercentage: number
}

export default function MyAttendancePage() {
  const { user } = authStore.getState()

  const summary = useQuery({
    queryKey: ['my-attendance-summary', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await axiosClient.get<AttendanceSummary>(`/academic/attendance/student/${user!.id}/summary`, {
        headers: { 'x-skip-error-toast': '1' },
      })
      return res.data
    },
    retry: 0,
  })

  const records = useQuery({
    queryKey: ['my-attendance-records', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await axiosClient.get<AttendanceRecord[] | { items: AttendanceRecord[] }>(
        `/academic/attendance/student/${user!.id}`,
        { headers: { 'x-skip-error-toast': '1' } },
      )
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: 0,
  })

  const recordList = records.data ?? []

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">My Attendance</h1>
      <p className="text-sm text-muted-foreground mb-6">Daily attendance history and term-wide totals.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Attendance %"
          value={summary.data ? `${(summary.data.attendancePercentage ?? 0).toFixed(1)}%` : '—'}
          trend="up"
          icon="📅"
        />
        <KpiCard label="Present" value={summary.data?.presentDays ?? '—'} icon="✅" />
        <KpiCard label="Absent" value={summary.data?.absentDays ?? '—'} trend="down" icon="❌" />
        <KpiCard label="Late" value={summary.data?.lateDays ?? '—'} icon="⏰" />
      </div>

      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Recent Days</h2>
        {records.isLoading && <p className="text-sm text-muted-foreground">Loading attendance…</p>}
        {records.isError && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            Attendance endpoint not yet available for this user.
          </div>
        )}
        {!records.isLoading && !records.isError && recordList.length === 0 && (
          <p className="text-sm text-muted-foreground">No attendance entries yet.</p>
        )}
        {!records.isLoading && !records.isError && recordList.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Date</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Subject</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Status</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {recordList.map((r) => (
                <tr key={r.id} className="border-b border-border">
                  <td className="px-3 py-2">{formatDate(r.date)}</td>
                  <td className="px-3 py-2">{r.subjectName ?? '—'}</td>
                  <td className="px-3 py-2"><StatusPill status={r.status} /></td>
                  <td className="px-3 py-2 text-muted-foreground">{r.remarks ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: AttendanceRecord['status'] }) {
  const cls =
    status === 'Present' ? 'bg-emerald-100 text-emerald-700'
    : status === 'Late' ? 'bg-amber-100 text-amber-700'
    : status === 'Leave' ? 'bg-blue-100 text-blue-700'
    : 'bg-red-100 text-red-700'
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>
}
