import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import { authStore } from '../../store/authStore'

type Slot = {
  id: string
  day: string
  startTime: string
  endTime: string
  subjectName: string
  className: string
  sectionName: string
  room?: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const PERIODS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00']

export default function SchedulePage() {
  const { user } = authStore.getState()

  const slots = useQuery({
    queryKey: ['teacher-schedule', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await axiosClient.get<Slot[] | { items: Slot[] }>(`/academic/timetable`, {
        params: { teacherId: user!.id },
        headers: { 'x-skip-error-toast': '1' },
      })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: 0,
  })

  const grid: Record<string, Record<string, Slot | undefined>> = {}
  for (const d of DAYS) grid[d] = {}
  for (const s of slots.data ?? []) {
    grid[s.day] = grid[s.day] ?? {}
    grid[s.day][s.startTime.slice(0, 5)] = s
  }

  const periodCount = (slots.data ?? []).length

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">My Schedule</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Weekly teaching schedule. {periodCount > 0 ? `${periodCount} periods this week.` : ''}
      </p>

      {slots.isLoading && <p className="text-muted-foreground">Loading schedule…</p>}
      {slots.isError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Schedule endpoint (<code>/timetable/teacher/&lt;id&gt;</code>) is not yet available. The view will populate once
          the backend exposes weekly periods.
        </div>
      )}
      {!slots.isLoading && !slots.isError && (
        <div className="bg-white rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-gray-700 w-24">Time</th>
                {DAYS.map((d) => (
                  <th key={d} className="text-left px-3 py-2 font-semibold text-gray-700">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => (
                <tr key={p} className="border-b border-border">
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{p}</td>
                  {DAYS.map((d) => {
                    const slot = grid[d]?.[p]
                    return (
                      <td key={d} className="px-3 py-3 align-top">
                        {slot ? (
                          <div className="bg-primary-50 border border-primary-200 rounded-lg p-2">
                            <div className="font-semibold text-primary-900 text-sm">{slot.subjectName}</div>
                            <div className="text-xs text-muted-foreground">{slot.className} — {slot.sectionName}</div>
                            {slot.room && <div className="text-xs text-muted-foreground">Room {slot.room}</div>}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
