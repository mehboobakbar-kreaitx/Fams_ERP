import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { axiosClient } from '../../api/axiosClient'

type StaffMember = {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  department: string
  designation: string
}

type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Leave'
type RowState = Record<string, AttendanceStatus>

export default function StaffAttendancePage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [department, setDepartment] = useState('')
  const [rowState, setRowState] = useState<RowState>({})
  const [saving, setSaving] = useState(false)

  const staffQuery = useQuery({
    queryKey: ['hrm-staff-for-attendance'],
    queryFn: async () => {
      const res = await axiosClient.get<StaffMember[] | { items: StaffMember[] }>('/hrm/staff', {
        params: { pageSize: 500 },
      })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const allStaff = useMemo(() => staffQuery.data ?? [], [staffQuery.data])

  const departments = useMemo(() => {
    const seen = new Set<string>()
    for (const s of allStaff) {
      if (s.department) seen.add(s.department)
    }
    return Array.from(seen).sort()
  }, [allStaff])

  const filtered = useMemo(
    () => (department ? allStaff.filter((s) => s.department === department) : allStaff),
    [allStaff, department],
  )

  const counts = filtered.reduce(
    (acc, s) => {
      const st = rowState[s.id] ?? 'Present'
      acc[st] = (acc[st] ?? 0) + 1
      return acc
    },
    {} as Record<AttendanceStatus, number>,
  )

  const setStatus = (id: string, status: AttendanceStatus) =>
    setRowState((r) => ({ ...r, [id]: status }))

  const handleSave = async () => {
    if (filtered.length === 0) {
      toast.error('No staff to mark attendance for.')
      return
    }
    setSaving(true)
    const entries = filtered.map((s) => {
      const st = rowState[s.id] ?? 'Present'
      return {
        staffId: s.id,
        isPresent: st === 'Present' || st === 'Late',
        isLate: st === 'Late',
        isLeave: st === 'Leave',
      }
    })
    try {
      await axiosClient.post('/hrm/attendance', { date: new Date(date).toISOString(), entries })
      toast.success(`Staff attendance saved (${entries.length} records).`)
    } catch {
      // interceptor handles toast
    } finally {
      setSaving(false)
    }
  }

  if (staffQuery.isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading staff…</div>
  }

  if (staffQuery.isError) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Staff Attendance</h1>
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
          Staff data not yet available from the API.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Staff Attendance</h1>
      <p className="text-sm text-muted-foreground mb-6">Mark daily staff attendance. Defaults to Present.</p>

      <div className="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setRowState({}) }}
            className="border border-input rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
          <select
            value={department}
            onChange={(e) => { setDepartment(e.target.value); setRowState({}) }}
            className="border border-input rounded-lg px-3 py-2 text-sm min-w-[200px]"
          >
            <option value="">— All Departments —</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex gap-4 text-sm">
          <span className="text-emerald-700">Present: {counts.Present ?? 0}</span>
          <span className="text-red-700">Absent: {counts.Absent ?? 0}</span>
          <span className="text-amber-700">Late: {counts.Late ?? 0}</span>
          <span className="text-blue-700">Leave: {counts.Leave ?? 0}</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-muted-foreground">
          No staff found for the selected filters.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Emp #</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Department</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const status: AttendanceStatus = rowState[s.id] ?? 'Present'
                  return (
                    <tr key={s.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3 font-mono text-xs">{s.employeeNumber}</td>
                      <td className="px-4 py-3 font-medium">
                        {s.firstName} {s.lastName}
                        <span className="text-xs text-muted-foreground ml-1">· {s.designation}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.department}</td>
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
            <span className="text-sm text-muted-foreground">{filtered.length} staff member{filtered.length !== 1 ? 's' : ''}</span>
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
