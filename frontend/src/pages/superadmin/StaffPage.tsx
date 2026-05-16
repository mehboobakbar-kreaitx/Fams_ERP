import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'

type Staff = {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  designation: string
  department: string
  email: string
  campusName?: string
  isActive: boolean
}

export default function StaffPage() {
  const staffQuery = useQuery({
    queryKey: ['superadmin-staff'],
    queryFn: async () => {
      const res = await axiosClient.get<Staff[] | { items: Staff[] }>('/hrm/staff', {
        params: { pageSize: 500 },
      })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
  })

  const all = staffQuery.data ?? []
  const active = all.filter((s) => s.isActive).length
  const byCampus = new Set(all.map((s) => s.campusName ?? '—')).size

  const columns: Column<Staff>[] = [
    { key: 'employeeNumber', header: 'Emp #', width: '110px' },
    {
      key: 'firstName',
      header: 'Name',
      render: (r) => <span className="font-medium">{r.firstName} {r.lastName}</span>,
    },
    { key: 'designation', header: 'Designation' },
    { key: 'department', header: 'Department' },
    { key: 'campusName', header: 'Campus' },
    { key: 'email', header: 'Email' },
    {
      key: 'isActive',
      header: 'Status',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
          r.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
        }`}>{r.isActive ? 'Active' : 'Inactive'}</span>
      ),
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Cross-Campus Staff</h1>
      <p className="text-sm text-muted-foreground mb-6">Aggregated staff registry across every campus.</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Total Staff" value={all.length} icon="👥" />
        <KpiCard label="Active" value={active} trend="up" icon="✅" />
        <KpiCard label="Campuses Covered" value={byCampus} icon="🏫" />
      </div>

      {staffQuery.isLoading && <p className="text-muted-foreground">Loading staff…</p>}
      {staffQuery.isError && <p className="text-red-600">Failed to load staff.</p>}
      {!staffQuery.isLoading && !staffQuery.isError && (
        <DataTable<Staff>
          columns={columns}
          data={all}
          rowKey={(r) => r.id}
          searchableFields={['firstName', 'lastName', 'employeeNumber', 'department', 'designation', 'campusName']}
          pageSize={20}
          emptyMessage="No staff records yet."
        />
      )}
    </div>
  )
}
