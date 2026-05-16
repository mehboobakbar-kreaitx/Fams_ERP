import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import DataTable, { type Column } from '../../components/ui/DataTable'
import AddCampusDialog from './AddCampusDialog'

type Campus = {
  id: string
  name: string
  code: string
  city: string
  principalName: string
  maxCapacity: number
  isActive: boolean
  isMainCampus: boolean
  enrolledStudents: number
  activeStaff: number
}

export default function CampusesPage() {
  const [addOpen, setAddOpen] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['campuses'],
    queryFn: async () => {
      const res = await axiosClient.get<Campus[]>('/campuses')
      return res.data
    },
  })

  const columns: Column<Campus>[] = [
    { key: 'code', header: 'Code', width: '90px', render: (r) => <span className="font-mono">{r.code}</span> },
    {
      key: 'name',
      header: 'Name',
      render: (r) => (
        <span className="font-medium text-gray-900">
          {r.name}
          {r.isMainCampus && <span className="ml-2 text-[10px] uppercase font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">HQ</span>}
        </span>
      ),
    },
    { key: 'city', header: 'City' },
    { key: 'principalName', header: 'Principal' },
    {
      key: 'enrolledStudents',
      header: 'Students',
      render: (r) => (r.enrolledStudents ?? 0).toLocaleString(),
    },
    {
      key: 'activeStaff',
      header: 'Staff',
      render: (r) => (r.activeStaff ?? 0).toLocaleString(),
    },
    {
      key: 'maxCapacity',
      header: 'Capacity',
      render: (r) => (r.maxCapacity ?? 0).toLocaleString(),
    },
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Campuses</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading…' : `${data?.length ?? 0} campuses in the network.`}
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add Campus
        </button>
      </div>

      <AddCampusDialog open={addOpen} onClose={() => setAddOpen(false)} />

      {isError && <p className="text-red-600">Failed to load campus list.</p>}
      {!isError && (
        <DataTable<Campus>
          columns={columns}
          data={data ?? []}
          rowKey={(r) => r.id}
          searchableFields={['name', 'code', 'city', 'principalName']}
          pageSize={20}
          emptyMessage="No campuses configured."
        />
      )}
    </div>
  )
}
