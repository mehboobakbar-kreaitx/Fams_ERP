import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatCurrency } from '../../lib/utils'

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

export default function SuperAdminDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-executive'],
    queryFn: async () => {
      const res = await axiosClient.get<ExecutiveDashboardDto>('/dashboard/executive')
      return res.data
    },
  })

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading institution-wide dashboard…</div>
      </div>
    )
  }
  if (isError) {
    return <div className="text-red-600">Failed to load executive dashboard.</div>
  }

  const columns: Column<CampusKpi>[] = [
    { key: 'campusName', header: 'Campus', render: (r) => <span className="font-medium">{r.campusName}</span> },
    { key: 'enrolledStudents', header: 'Students', render: (r) => (r.enrolledStudents ?? 0).toLocaleString() },
    { key: 'activeStaff', header: 'Staff', render: (r) => (r.activeStaff ?? 0).toLocaleString() },
    { key: 'monthlyRevenue', header: 'Revenue (mo)', render: (r) => formatCurrency(r.monthlyRevenue ?? 0) },
    { key: 'outstandingFees', header: 'Outstanding', render: (r) => formatCurrency(r.outstandingFees ?? 0) },
  ]

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">Institution Overview</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Live KPIs aggregated across all {data.totalCampuses} campuses.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Campuses" value={(data.totalCampuses ?? 0).toLocaleString()} icon="🏫" />
        <KpiCard
          label="Total Students"
          value={(data.totalEnrolledStudents ?? 0).toLocaleString()}
          hint={`${data.totalActiveStaff ?? 0} active staff`}
          icon="👥"
        />
        <KpiCard
          label="Monthly Revenue"
          value={formatCurrency(data.totalMonthlyRevenue ?? 0)}
          trend="up"
          icon="💰"
        />
        <KpiCard
          label="Outstanding Fees"
          value={formatCurrency(data.totalOutstandingFees ?? 0)}
          trend={data.totalOutstandingFees > 0 ? 'down' : 'up'}
          hint={`${data.totalApplicationsThisMonth ?? 0} new applications this month`}
          icon="⏳"
        />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-3">Campus Breakdown</h3>
      <DataTable<CampusKpi>
        columns={columns}
        data={data.campusBreakdown ?? []}
        rowKey={(r) => r.campusId}
        searchableFields={['campusName']}
        pageSize={15}
        emptyMessage="No campus data yet."
      />
    </div>
  )
}
