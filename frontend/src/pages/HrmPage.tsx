import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../api/axiosClient'
import KpiCard from '../components/ui/KpiCard'
import DataTable, { type Column } from '../components/ui/DataTable'

type Staff = {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  designation: string
  department: string
  email: string
  joinDate?: string
  isActive: boolean
}

type Analytics = {
  totalStaff: number
  activeStaff: number
  onLeaveToday: number
  attritionRate: number
}

export default function HrmPage() {
  const analyticsQuery = useQuery({
    queryKey: ['hrm-analytics'],
    queryFn: async () => {
      const res = await axiosClient.get<Analytics>('/hrm/analytics')
      return res.data
    },
  })

  const staffQuery = useQuery({
    queryKey: ['hrm-staff'],
    queryFn: async () => {
      const res = await axiosClient.get<Staff[] | { items: Staff[] }>('/hrm/staff')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
  })

  const columns: Column<Staff>[] = [
    { key: 'employeeNumber', header: 'Emp #', width: '110px' },
    {
      key: 'firstName',
      header: 'Name',
      render: (r) => (
        <span className="font-medium">
          {r.firstName} {r.lastName}
        </span>
      ),
    },
    { key: 'designation', header: 'Designation' },
    { key: 'department', header: 'Department' },
    { key: 'email', header: 'Email' },
    {
      key: 'isActive',
      header: 'Status',
      render: (r) => (
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
            r.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {r.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Human Resources</h1>
      <p className="text-sm text-muted-foreground mb-6">Staff management, leave and payroll oversight.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Staff" value={analyticsQuery.data?.totalStaff ?? 0} icon="👤" />
        <KpiCard label="Active" value={analyticsQuery.data?.activeStaff ?? 0} trend="up" icon="✅" />
        <KpiCard label="On Leave Today" value={analyticsQuery.data?.onLeaveToday ?? 0} icon="🌴" />
        <KpiCard
          label="Attrition"
          value={analyticsQuery.data ? `${(analyticsQuery.data.attritionRate ?? 0).toFixed(1)}%` : '—'}
          trend="down"
          icon="📉"
        />
      </div>

      {staffQuery.isLoading && <p className="text-muted-foreground">Loading staff…</p>}
      {staffQuery.isError && <p className="text-red-600">Failed to load staff.</p>}
      {!staffQuery.isLoading && !staffQuery.isError && (
        <DataTable<Staff>
          columns={columns}
          data={staffQuery.data ?? []}
          rowKey={(r) => r.id}
          searchableFields={['firstName', 'lastName', 'employeeNumber', 'department', 'designation']}
          pageSize={15}
          emptyMessage="No staff records yet."
        />
      )}
    </div>
  )
}
