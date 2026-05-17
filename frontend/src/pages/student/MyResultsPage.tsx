import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import { authStore } from '../../store/authStore'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'

type ResultRow = {
  id: string
  subjectName: string
  marksObtained: number
  totalMarks: number
  percentage: number
  grade: string
  examType: string
  termName?: string
}

export default function MyResultsPage() {
  const { user } = authStore.getState()

  const results = useQuery({
    queryKey: ['my-results', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await axiosClient.get<ResultRow[] | { items: ResultRow[] }>(`/results/student/${user!.id}`, {
        headers: { 'x-skip-error-toast': '1' },
      })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: 0,
  })

  const rows = results.data ?? []
  const totalObtained = rows.reduce((sum, r) => sum + r.marksObtained, 0)
  const totalMax = rows.reduce((sum, r) => sum + r.totalMarks, 0)
  const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0
  const failed = rows.filter((r) => r.grade === 'F').length

  const columns: Column<ResultRow>[] = [
    { key: 'examType', header: 'Exam' },
    { key: 'termName', header: 'Term' },
    { key: 'subjectName', header: 'Subject', render: (r) => <span className="font-medium">{r.subjectName}</span> },
    { key: 'marksObtained', header: 'Marks', render: (r) => `${r.marksObtained} / ${r.totalMarks}` },
    {
      key: 'grade',
      header: 'Grade',
      render: (r) => {
        const cls = r.grade === 'F' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
        return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{r.grade}</span>
      },
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">My Results</h1>
      <p className="text-sm text-muted-foreground mb-6">Subject-wise grades for every published exam.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Subjects" value={rows.length} icon="📚" />
        <KpiCard label="Total Marks" value={`${totalObtained} / ${totalMax}`} icon="📊" />
        <KpiCard label="Overall %" value={totalMax ? `${percentage.toFixed(1)}%` : '—'} trend="up" icon="📈" />
        <KpiCard label="Failed Subjects" value={failed} trend={failed > 0 ? 'down' : 'neutral'} icon="⚠️" />
      </div>

      {results.isLoading && <p className="text-muted-foreground">Loading results…</p>}
      {results.isError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Results are not yet available for your account.
        </div>
      )}
      {!results.isLoading && !results.isError && (
        <DataTable<ResultRow>
          columns={columns}
          data={rows}
          rowKey={(r) => r.id}
          searchableFields={['subjectName', 'examType', 'termName']}
          pageSize={20}
          emptyMessage="No published results yet."
        />
      )}
    </div>
  )
}
