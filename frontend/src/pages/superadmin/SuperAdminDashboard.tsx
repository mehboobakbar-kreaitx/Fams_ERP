import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatCurrency } from '../../lib/utils'
import { useNavScope } from '../../store/navScopeStore'

type CampusKpi = {
  campusId: string
  campusName: string
  enrolledStudents: number
  activeStaff: number
  monthlyRevenue: number
  outstandingFees: number
}

type ExecutiveDashboardDto = {
  totalCampuses: number
  totalEnrolledStudents: number
  totalActiveStaff: number
  totalApplicationsThisMonth: number
  totalMonthlyRevenue: number
  totalOutstandingFees: number
  campusBreakdown: CampusKpi[]
}

type CampusListItem = { id: string; schoolId: string; name: string }

// ── Scope breadcrumb rendered at the top of the page ────────────────────────

function ScopeHeader() {
  const { scopeType, selectedSchoolName, selectedCampusName } = useNavScope()

  if (scopeType === 'network') {
    return (
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Institution Overview</h2>
        <p className="text-sm text-muted-foreground">Live KPIs aggregated across all campuses.</p>
      </div>
    )
  }
  if (scopeType === 'school') {
    return (
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-1">Network › {selectedSchoolName}</p>
        <h2 className="text-2xl font-semibold text-gray-900">{selectedSchoolName}</h2>
        <p className="text-sm text-muted-foreground">KPIs for all campuses in this school.</p>
      </div>
    )
  }
  return (
    <div className="mb-6">
      <p className="text-xs text-muted-foreground mb-1">
        Network › {selectedSchoolName} › {selectedCampusName}
      </p>
      <h2 className="text-2xl font-semibold text-gray-900">{selectedCampusName}</h2>
      <p className="text-sm text-muted-foreground">KPIs for this campus.</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const { scopeType, selectedSchoolId, selectedCampusId } = useNavScope()

  const dashQuery = useQuery({
    queryKey: ['dashboard-executive'],
    queryFn: async () => {
      const res = await axiosClient.get<ExecutiveDashboardDto>('/dashboard/executive', {
        headers: { 'x-skip-error-toast': '1' },
        timeout: 15_000,
      })
      return res.data
    },
    retry: false,
  })

  // Needed to cross-reference campusId → schoolId for school-scope filtering.
  const campusListQuery = useQuery({
    queryKey: ['tree-campuses'],
    queryFn: async () => {
      const res = await axiosClient.get<CampusListItem[]>('/campuses', {
        headers: { 'x-skip-error-toast': '1' },
        timeout: 15_000,
      })
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 2 * 60_000,
    retry: false,
    enabled: scopeType === 'school',
  })

  if (dashQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard…</div>
      </div>
    )
  }

  if (dashQuery.isError || !dashQuery.data) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 font-medium">Failed to load dashboard.</p>
        <p className="text-sm text-muted-foreground mt-1">
          {dashQuery.isError
            ? 'The executive dashboard API is not yet available or returned an error.'
            : 'Dashboard returned no data.'}
        </p>
      </div>
    )
  }

  const all = dashQuery.data
  let rows: CampusKpi[] = all.campusBreakdown ?? []

  // Filter breakdown by scope ────────────────────────────────────────────────
  if (scopeType === 'campus' && selectedCampusId) {
    rows = rows.filter((r) => r.campusId === selectedCampusId)
  } else if (scopeType === 'school' && selectedSchoolId) {
    const campusList = campusListQuery.data ?? []
    const campusIdsInSchool = new Set(
      campusList.filter((c) => c.schoolId === selectedSchoolId).map((c) => c.id),
    )
    rows = rows.filter((r) => campusIdsInSchool.has(r.campusId))
  }

  // Aggregate filtered rows for KPI cards ───────────────────────────────────
  const totalCampuses = rows.length
  const totalStudents = rows.reduce((s, r) => s + (r.enrolledStudents ?? 0), 0)
  const totalStaff = rows.reduce((s, r) => s + (r.activeStaff ?? 0), 0)
  const totalRevenue = rows.reduce((s, r) => s + (r.monthlyRevenue ?? 0), 0)
  const totalOutstanding = rows.reduce((s, r) => s + (r.outstandingFees ?? 0), 0)

  const columns: Column<CampusKpi>[] = [
    { key: 'campusName', header: 'Campus', render: (r) => <span className="font-medium">{r.campusName}</span> },
    { key: 'enrolledStudents', header: 'Students', render: (r) => (r.enrolledStudents ?? 0).toLocaleString() },
    { key: 'activeStaff', header: 'Staff', render: (r) => (r.activeStaff ?? 0).toLocaleString() },
    { key: 'monthlyRevenue', header: 'Revenue (mo)', render: (r) => formatCurrency(r.monthlyRevenue ?? 0) },
    { key: 'outstandingFees', header: 'Outstanding', render: (r) => formatCurrency(r.outstandingFees ?? 0) },
  ]

  return (
    <div>
      <ScopeHeader />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Campuses" value={totalCampuses.toLocaleString()} icon="🏫" />
        <KpiCard
          label="Total Students"
          value={totalStudents.toLocaleString()}
          hint={`${totalStaff} active staff`}
          icon="👥"
        />
        <KpiCard
          label="Monthly Revenue"
          value={formatCurrency(totalRevenue)}
          trend="up"
          icon="💰"
        />
        <KpiCard
          label="Outstanding Fees"
          value={formatCurrency(totalOutstanding)}
          trend={totalOutstanding > 0 ? 'down' : 'up'}
          hint={
            scopeType === 'network'
              ? `${all.totalApplicationsThisMonth ?? 0} new applications this month`
              : undefined
          }
          icon="⏳"
        />
      </div>

      {rows.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Campus Breakdown</h3>
          <DataTable<CampusKpi>
            columns={columns}
            data={rows}
            rowKey={(r) => r.campusId}
            searchableFields={['campusName']}
            pageSize={15}
            emptyMessage="No campus data yet."
          />
        </>
      )}
    </div>
  )
}
