import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatCurrency } from '../../lib/utils'

type SchoolRow = {
  id: string
  name: string
  code: string
  city: string
  isActive: boolean
  campusCount: number
  studentCount: number
  staffCount: number
}

type PaginatedSchools = { items: SchoolRow[]; totalCount: number }

type ExecutiveDashboardDto = {
  totalCampuses: number
  totalEnrolledStudents: number
  totalActiveStaff: number
  totalApplicationsThisMonth: number
  totalMonthlyRevenue: number
  totalOutstandingFees: number
}

type SubsDto = { pendingCount?: number }

export default function NetworkDashboard() {
  const execQuery = useQuery({
    queryKey: ['dashboard-executive'],
    queryFn: async () => {
      const res = await axiosClient.get<ExecutiveDashboardDto>('/dashboard/executive', {
        timeout: 15_000,
      })
      return res.data
    },
    retry: false,
  })

  const schoolsQuery = useQuery({
    queryKey: ['schools-stats'],
    queryFn: async () => {
      const res = await axiosClient.get<PaginatedSchools>('/schools', {
        params: { pageSize: 500 },
      })
      return res.data
    },
    staleTime: 30_000,
    retry: false,
  })

  // Pending subscriptions — graceful: endpoint may not yet be deployed.
  const subsQuery = useQuery({
    queryKey: ['subscriptions-pending'],
    queryFn: async () => {
      const res = await axiosClient.get<SubsDto>('/subscriptions/pending')
      return res.data
    },
    retry: false,
  })

  const exec = execQuery.data
  const schools = schoolsQuery.data?.items ?? []
  const totalSchools = schoolsQuery.data?.totalCount ?? schools.length
  const activeSchools = schools.filter((s) => s.isActive).length
  const networkHealth = totalSchools > 0 ? Math.round((activeSchools / totalSchools) * 100) : null
  const pendingSubs = subsQuery.data?.pendingCount

  const columns: Column<SchoolRow>[] = [
    {
      key: 'name',
      header: 'School',
      render: (r) => <span className="font-medium text-gray-900">{r.name}</span>,
    },
    { key: 'city', header: 'City', render: (r) => r.city },
    {
      key: 'campusCount',
      header: 'Campuses',
      render: (r) => (r.campusCount ?? 0).toLocaleString(),
    },
    {
      key: 'studentCount',
      header: 'Students',
      render: (r) => (r.studentCount ?? 0).toLocaleString(),
    },
    {
      key: 'staffCount',
      header: 'Staff',
      render: (r) => (r.staffCount ?? 0).toLocaleString(),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (r) => (
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
            r.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {r.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Network Governance</h2>
        <p className="text-sm text-muted-foreground">
          Platform-wide KPIs across all schools and campuses.
        </p>
      </div>

      {(execQuery.isError || schoolsQuery.isError) && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          Some KPIs are unavailable. Data will appear once the backend module is deployed.
        </p>
      )}

      {/* Row 1 — institution structure */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard
          label="Total Schools"
          value={schoolsQuery.isLoading ? '…' : totalSchools.toLocaleString()}
          icon="🏛️"
        />
        <KpiCard
          label="Total Campuses"
          value={execQuery.isLoading ? '…' : (exec?.totalCampuses ?? '—').toLocaleString()}
          icon="🏫"
        />
        <KpiCard
          label="Total Students"
          value={
            execQuery.isLoading
              ? '…'
              : (exec?.totalEnrolledStudents ?? '—').toLocaleString()
          }
          icon="👥"
          trendValue={
            exec?.totalApplicationsThisMonth
              ? `+${exec.totalApplicationsThisMonth} applications this month`
              : undefined
          }
          trend="up"
        />
        <KpiCard
          label="Total Staff"
          value={execQuery.isLoading ? '…' : (exec?.totalActiveStaff ?? '—').toLocaleString()}
          icon="🧑‍💼"
        />
      </div>

      {/* Row 2 — health & finance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Monthly Revenue"
          value={
            execQuery.isLoading
              ? '…'
              : exec
              ? formatCurrency(exec.totalMonthlyRevenue)
              : '—'
          }
          icon="💰"
          trend="up"
        />
        <KpiCard
          label="Active Schools"
          value={schoolsQuery.isLoading ? '…' : activeSchools.toLocaleString()}
          hint={
            totalSchools > 0
              ? `${Math.round((activeSchools / totalSchools) * 100)}% of network`
              : undefined
          }
          icon="✅"
        />
        <KpiCard
          label="Pending Subscriptions"
          value={subsQuery.isLoading ? '…' : (pendingSubs ?? '—').toString()}
          icon="⏳"
          trendValue={pendingSubs && pendingSubs > 0 ? `${pendingSubs} awaiting action` : undefined}
          trend="down"
        />
        <KpiCard
          label="Network Health"
          value={networkHealth !== null ? `${networkHealth}%` : '—'}
          hint={
            totalSchools > 0
              ? `${activeSchools} of ${totalSchools} schools active`
              : undefined
          }
          icon="💚"
          trendValue={
            networkHealth !== null
              ? networkHealth >= 80
                ? 'Healthy'
                : networkHealth >= 60
                ? 'Degraded'
                : 'Critical'
              : undefined
          }
          trend={
            networkHealth !== null
              ? networkHealth >= 80
                ? 'up'
                : 'down'
              : 'neutral'
          }
        />
      </div>

      {/* School network breakdown */}
      {schoolsQuery.isLoading && (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          Loading school network…
        </div>
      )}

      {!schoolsQuery.isLoading && schools.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">School Network</h3>
          <DataTable<SchoolRow>
            columns={columns}
            data={schools}
            rowKey={(r) => r.id}
            searchableFields={['name', 'city']}
            pageSize={10}
            emptyMessage="No schools in the network yet."
          />
        </>
      )}
    </div>
  )
}
