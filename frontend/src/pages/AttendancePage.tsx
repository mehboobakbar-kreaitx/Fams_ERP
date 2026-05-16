import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { axiosClient } from '../api/axiosClient'

type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Leave'

type Student = {
  id: string
  rollNumber: string
  firstName: string
  lastName: string
  classId: string
  className?: string | null
  sectionId: string
  sectionName?: string | null
  status: string
}

type SectionOption = {
  sectionId: string
  label: string
}

type RowState = Record<string, AttendanceStatus>

const isNetworkError = (err: unknown): boolean => {
  if (typeof err !== 'object' || err === null) return false
  const e = err as { code?: string; response?: { status?: number }; message?: string }
  if (e.response && typeof e.response.status === 'number') return false
  return (
    e.code === 'ERR_NETWORK' ||
    e.code === 'ECONNABORTED' ||
    e.code === 'ETIMEDOUT' ||
    !!e.message?.toLowerCase().includes('network')
  )
}

export default function AttendancePage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [sectionId, setSectionId] = useState<string>('')
  const [rowState, setRowState] = useState<RowState>({})
  const [saving, setSaving] = useState(false)

  const studentsQuery = useQuery({
    queryKey: ['students-for-attendance'],
    queryFn: async () => {
      const res = await axiosClient.get<{ items: Student[] } | Student[]>('/students', { params: { pageSize: 200 } })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
  })

  const allStudents = studentsQuery.data ?? []

  const sections: SectionOption[] = useMemo(() => {
    const seen = new Map<string, SectionOption>()
    for (const s of allStudents) {
      if (!s.sectionId || seen.has(s.sectionId)) continue
      const label = s.className && s.sectionName ? `${s.className} — ${s.sectionName}` : s.sectionName ?? s.sectionId
      seen.set(s.sectionId, { sectionId: s.sectionId, label })
    }
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label))
  }, [allStudents])

  const studentsInSection = useMemo(
    () => (sectionId ? allStudents.filter((s) => s.sectionId === sectionId) : []),
    [allStudents, sectionId],
  )

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setRowState((r) => ({ ...r, [studentId]: status }))
  }

  const counts = studentsInSection.reduce(
    (acc, s) => {
      const st = rowState[s.id] ?? 'Present'
      acc[st] = (acc[st] ?? 0) + 1
      return acc
    },
    {} as Record<AttendanceStatus, number>,
  )

  const handleSave = async () => {
    if (!sectionId) {
      toast.error('Please select a section first.')
      return
    }
    if (studentsInSection.length === 0) {
      toast.error('No students in this section.')
      return
    }

    setSaving(true)
    const entries = studentsInSection.map((s) => {
      const st = rowState[s.id] ?? 'Present'
      return {
        studentId: s.id,
        isPresent: st === 'Present' || st === 'Late',
        isLate: st === 'Late',
        remarks: st === 'Leave' ? 'On approved leave' : null,
      }
    })

    const payload = {
      sectionId,
      date: new Date(date).toISOString(),
      entries,
      isOfflineEntry: false,
    }

    try {
      const res = await axiosClient.post<{ recorded: number }>('/academic/attendance', payload)
      toast.success(`Attendance saved (${res.data.recorded} records).`)
    } catch (err) {
      if (isNetworkError(err)) {
        try {
          const queue = JSON.parse(localStorage.getItem('attendance_offline_queue') ?? '[]')
          queue.push({ ...payload, isOfflineEntry: true, queuedAt: new Date().toISOString() })
          localStorage.setItem('attendance_offline_queue', JSON.stringify(queue))
          toast('Network unavailable — queued for sync when online.', { icon: '📶' })
        } catch {
          toast.error('Failed to queue attendance offline.')
        }
      } else {
        const e = err as { response?: { status?: number; data?: { error?: string; title?: string } } }
        const detail = e.response?.data?.error ?? e.response?.data?.title ?? `HTTP ${e.response?.status}`
        toast.error(`Save failed: ${detail}`)
      }
    } finally {
      setSaving(false)
    }
  }

  if (studentsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">Loading students…</div>
    )
  }
  if (studentsQuery.isError) {
    return <div className="text-red-600">Failed to load students.</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Attendance</h1>
      <p className="text-sm text-muted-foreground mb-6">Mark daily attendance. Defaults to Present.</p>

      <div className="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Section</label>
          <select
            value={sectionId}
            onChange={(e) => {
              setSectionId(e.target.value)
              setRowState({})
            }}
            className="border border-input rounded-lg px-3 py-2 text-sm min-w-[220px]"
          >
            <option value="">— Select a section —</option>
            {sections.map((s) => (
              <option key={s.sectionId} value={s.sectionId}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        {sectionId && (
          <div className="ml-auto flex gap-4 text-sm">
            <span className="text-emerald-700">Present: {counts.Present ?? 0}</span>
            <span className="text-red-700">Absent: {counts.Absent ?? 0}</span>
            <span className="text-amber-700">Late: {counts.Late ?? 0}</span>
            <span className="text-blue-700">Leave: {counts.Leave ?? 0}</span>
          </div>
        )}
      </div>

      {!sectionId && (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-muted-foreground">
          Select a section above to mark attendance.
        </div>
      )}

      {sectionId && studentsInSection.length === 0 && (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-muted-foreground">
          No students enrolled in this section.
        </div>
      )}

      {sectionId && studentsInSection.length > 0 && (
        <>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Roll #</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {studentsInSection.map((s) => {
                  const status: AttendanceStatus = rowState[s.id] ?? 'Present'
                  return (
                    <tr key={s.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3">{s.rollNumber}</td>
                      <td className="px-4 py-3 font-medium">
                        {s.firstName} {s.lastName}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {(['Present', 'Absent', 'Late', 'Leave'] as AttendanceStatus[]).map((opt) => (
                            <button
                              key={opt}
                              onClick={() => setStatus(s.id, opt)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                                status === opt
                                  ? opt === 'Present'
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : opt === 'Absent'
                                    ? 'bg-red-600 text-white border-red-600'
                                    : opt === 'Late'
                                    ? 'bg-amber-500 text-white border-amber-500'
                                    : 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-700 border-border hover:bg-gray-50'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary-700 hover:bg-primary-800 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Attendance'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
