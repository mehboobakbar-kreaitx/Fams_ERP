import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'

type ChildSummary = {
  studentId: string
  name: string
  publishedResultsThisTerm: number
}

type ResultRow = {
  id: string
  subjectName: string
  obtainedMarks: number
  totalMarks: number
  grade: string
  examName: string
}

type ParentDashboardDto = { children: ChildSummary[] }

export default function ParentResultsPage() {
  const dash = useQuery({
    queryKey: ['parent-results-children'],
    queryFn: async () => {
      const res = await axiosClient.get<ParentDashboardDto>('/dashboard/parent')
      return res.data
    },
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Results</h1>
      <p className="text-sm text-muted-foreground mb-6">Published results for your children.</p>

      <div className="space-y-6">
        {(dash.data?.children ?? []).map((c) => (
          <ChildResultsBlock key={c.studentId} studentId={c.studentId} name={c.name} />
        ))}
      </div>
    </div>
  )
}

function ChildResultsBlock({ studentId, name }: { studentId: string; name: string }) {
  const results = useQuery({
    queryKey: ['parent-child-results', studentId],
    queryFn: async () => {
      const res = await axiosClient.get<ResultRow[] | { items: ResultRow[] }>(`/results/student/${studentId}`, {
        headers: { 'x-skip-error-toast': '1' },
      })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: 0,
  })

  return (
    <div className="bg-white border border-border rounded-xl p-5">
      <h2 className="font-semibold text-gray-900 mb-3">{name}</h2>
      {results.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {results.isError && <p className="text-sm text-amber-700">Results not available.</p>}
      {!results.isLoading && !results.isError && (results.data ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">No published results yet.</p>
      )}
      {(results.data ?? []).length > 0 && (
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-gray-700">Exam</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-700">Subject</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-700">Marks</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-700">Grade</th>
            </tr>
          </thead>
          <tbody>
            {(results.data ?? []).map((r) => (
              <tr key={r.id} className="border-b border-border">
                <td className="px-3 py-2">{r.examName}</td>
                <td className="px-3 py-2">{r.subjectName}</td>
                <td className="px-3 py-2">{r.obtainedMarks} / {r.totalMarks}</td>
                <td className="px-3 py-2 font-medium">{r.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
