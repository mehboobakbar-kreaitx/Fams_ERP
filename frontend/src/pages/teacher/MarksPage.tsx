import { useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { axiosClient } from '../../api/axiosClient'

type Student = {
  id: string
  rollNumber: string
  firstName: string
  lastName: string
  sectionId: string
  sectionName?: string
  className?: string
}

type SectionOption = { sectionId: string; label: string }

export default function MarksPage() {
  const qc = useQueryClient()
  const [sectionId, setSectionId] = useState('')
  const [examName, setExamName] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [totalMarks, setTotalMarks] = useState('100')
  const [rows, setRows] = useState<Record<string, string>>({})

  const studentsQuery = useQuery({
    queryKey: ['marks-students'],
    queryFn: async () => {
      const res = await axiosClient.get<{ items: Student[] } | Student[]>('/students', { params: { pageSize: 500 } })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
  })

  const sectionOptions: SectionOption[] = useMemo(() => {
    const seen = new Map<string, SectionOption>()
    for (const s of studentsQuery.data ?? []) {
      if (!s.sectionId || seen.has(s.sectionId)) continue
      const label = s.className && s.sectionName ? `${s.className} — ${s.sectionName}` : s.sectionName ?? s.sectionId
      seen.set(s.sectionId, { sectionId: s.sectionId, label })
    }
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label))
  }, [studentsQuery.data])

  const filteredStudents = useMemo(
    () => (studentsQuery.data ?? []).filter((s) => s.sectionId === sectionId),
    [studentsQuery.data, sectionId],
  )

  const save = useMutation({
    mutationFn: async () => {
      const total = Number(totalMarks)
      if (!examName.trim() || !subjectName.trim() || !sectionId || !total) {
        throw new Error('Pick a section, exam, subject and total marks before saving.')
      }
      const payload = {
        sectionId,
        examName: examName.trim(),
        subjectName: subjectName.trim(),
        totalMarks: total,
        entries: filteredStudents
          .map((s) => ({ studentId: s.id, obtainedMarks: Number(rows[s.id]) }))
          .filter((e) => !Number.isNaN(e.obtainedMarks)),
      }
      if (!payload.entries.length) throw new Error('Enter marks for at least one student.')
      const { data } = await axiosClient.post<{ saved: number }>('/results/marks', payload, {
        headers: { 'x-skip-error-toast': '1' },
      })
      return data
    },
    onSuccess: (data) => {
      toast.success(`Saved marks for ${data.saved} student(s).`)
      setRows({})
      qc.invalidateQueries({ queryKey: ['results-student'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string; title?: string } }; message?: string }
      toast.error(e.response?.data?.error ?? e.response?.data?.title ?? e.message ?? 'Failed to save marks.')
    },
  })

  const setMark = (studentId: string, value: string) => setRows((r) => ({ ...r, [studentId]: value }))

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Enter Marks</h1>
      <p className="text-sm text-muted-foreground mb-6">Subject-wise marks entry for an exam.</p>

      <div className="bg-white rounded-xl border border-border p-5 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Section</label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm"
          >
            <option value="">— Select section —</option>
            {sectionOptions.map((s) => (
              <option key={s.sectionId} value={s.sectionId}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Exam</label>
          <input
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            placeholder="e.g. Mid-Term"
            className="w-full border border-input rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
          <input
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            placeholder="e.g. Mathematics"
            className="w-full border border-input rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Total Marks</label>
          <input
            type="number"
            value={totalMarks}
            onChange={(e) => setTotalMarks(e.target.value)}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      {!sectionId && <p className="text-sm text-muted-foreground">Select a section to load its students.</p>}

      {sectionId && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-gray-700 w-28">Roll #</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Student</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700 w-40">Marks</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 && (
                <tr><td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">No students in this section.</td></tr>
              )}
              {filteredStudents.map((s) => (
                <tr key={s.id} className="border-b border-border">
                  <td className="px-3 py-2 font-mono text-xs">{s.rollNumber}</td>
                  <td className="px-3 py-2 font-medium">{s.firstName} {s.lastName}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={rows[s.id] ?? ''}
                      onChange={(e) => setMark(s.id, e.target.value)}
                      max={Number(totalMarks) || undefined}
                      min={0}
                      placeholder={`/ ${totalMarks}`}
                      className="w-28 border border-input rounded-lg px-2 py-1 text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 bg-gray-50 border-t border-border flex justify-end">
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="bg-primary-700 hover:bg-primary-800 text-white text-sm rounded-lg px-4 py-2 disabled:opacity-50"
            >
              {save.isPending ? 'Saving…' : 'Save Marks'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
