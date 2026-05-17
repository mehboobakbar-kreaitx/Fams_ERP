import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../api/axiosClient'
import KpiCard from '../components/ui/KpiCard'
import DataTable, { type Column } from '../components/ui/DataTable'
import { formatDate } from '../lib/utils'

type Application = {
  id: string
  candidateName: string
  programName: string
  submittedOn: string
  status: string
  score?: number
  rank?: number
}

type FunnelStage = { name: string; count: number; conversionRate: number }
type Funnel = { stages: FunnelStage[]; overallConversion: number }

const STAGE_NAMES = ['Inquiry', 'Applied', 'UnderReview', 'Offered', 'Enrolled']
const STAGE_LABELS: Record<string, string> = {
  Inquiry: 'Inquiry',
  Applied: 'Submitted',
  UnderReview: 'Under Review',
  Offered: 'Offered',
  Enrolled: 'Enrolled',
}

export default function AdmissionsPage() {
  const funnelQuery = useQuery({
    queryKey: ['admissions-funnel'],
    queryFn: async () => {
      const res = await axiosClient.get<Funnel>('/admissions/funnel')
      return res.data
    },
  })

  const funnelStageMap = Object.fromEntries(
    (funnelQuery.data?.stages ?? []).map((s) => [s.name, s.count])
  )

  const appsQuery = useQuery({
    queryKey: ['admissions-applications'],
    queryFn: async () => {
      const res = await axiosClient.get<Application[] | { items: Application[] }>('/admissions/applications')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
  })

  const columns: Column<Application>[] = [
    { key: 'id', header: 'App #', width: '120px', render: (r) => r.id.slice(0, 8).toUpperCase() },
    { key: 'candidateName', header: 'Candidate', render: (r) => <span className="font-medium">{r.candidateName}</span> },
    { key: 'programName', header: 'Program' },
    {
      key: 'submittedOn',
      header: 'Submitted',
      render: (r) => formatDate(r.submittedOn),
    },
    { key: 'score', header: 'Score', render: (r) => r.score?.toFixed(1) ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
          {r.status}
        </span>
      ),
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Admissions</h1>
      <p className="text-sm text-muted-foreground mb-6">Application pipeline and merit list management.</p>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {STAGE_NAMES.map((name) => (
          <KpiCard key={name} label={STAGE_LABELS[name] ?? name} value={funnelStageMap[name] ?? 0} />
        ))}
      </div>

      {appsQuery.isLoading && <p className="text-muted-foreground">Loading applications…</p>}
      {appsQuery.isError && <p className="text-red-600">Failed to load applications.</p>}
      {!appsQuery.isLoading && !appsQuery.isError && (
        <DataTable<Application>
          columns={columns}
          data={appsQuery.data ?? []}
          rowKey={(r) => r.id}
          searchableFields={['candidateName', 'programName']}
          pageSize={15}
          emptyMessage="No applications submitted yet."
        />
      )}
    </div>
  )
}
