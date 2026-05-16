import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../api/axiosClient'
import KpiCard from '../components/ui/KpiCard'
import DataTable, { type Column } from '../components/ui/DataTable'
import { formatDate } from '../lib/utils'

type Application = {
  id: string
  applicationNumber: string
  candidateName: string
  programName: string
  submittedOn: string
  status: 'Submitted' | 'UnderReview' | 'Shortlisted' | 'Accepted' | 'Rejected' | 'Enrolled'
  score?: number
}

type Funnel = {
  submitted: number
  underReview: number
  shortlisted: number
  accepted: number
  enrolled: number
}

const stages: { label: string; key: keyof Funnel; color: string }[] = [
  { label: 'Submitted', key: 'submitted', color: 'bg-gray-100 text-gray-700' },
  { label: 'Under Review', key: 'underReview', color: 'bg-blue-100 text-blue-700' },
  { label: 'Shortlisted', key: 'shortlisted', color: 'bg-amber-100 text-amber-700' },
  { label: 'Accepted', key: 'accepted', color: 'bg-emerald-100 text-emerald-700' },
  { label: 'Enrolled', key: 'enrolled', color: 'bg-primary-100 text-primary-700' },
]

export default function AdmissionsPage() {
  const funnelQuery = useQuery({
    queryKey: ['admissions-funnel'],
    queryFn: async () => {
      const res = await axiosClient.get<Funnel>('/admissions/funnel')
      return res.data
    },
  })

  const appsQuery = useQuery({
    queryKey: ['admissions-applications'],
    queryFn: async () => {
      const res = await axiosClient.get<Application[] | { items: Application[] }>('/admissions/applications')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
  })

  const columns: Column<Application>[] = [
    { key: 'applicationNumber', header: 'App #', width: '120px' },
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
        {stages.map((s) => (
          <KpiCard key={s.key} label={s.label} value={funnelQuery.data?.[s.key] ?? 0} />
        ))}
      </div>

      {appsQuery.isLoading && <p className="text-muted-foreground">Loading applications…</p>}
      {appsQuery.isError && <p className="text-red-600">Failed to load applications.</p>}
      {!appsQuery.isLoading && !appsQuery.isError && (
        <DataTable<Application>
          columns={columns}
          data={appsQuery.data ?? []}
          rowKey={(r) => r.id}
          searchableFields={['candidateName', 'applicationNumber', 'programName']}
          pageSize={15}
          emptyMessage="No applications submitted yet."
        />
      )}
    </div>
  )
}
