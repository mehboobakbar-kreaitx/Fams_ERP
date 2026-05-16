import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { axiosClient } from '../api/axiosClient'
import DataTable, { type Column } from '../components/ui/DataTable'
import AddStudentDialog from './AddStudentDialog'

type Student = {
  id: string
  rollNumber: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  programName?: string
  sectionName?: string
  status: string
  enrollmentDate?: string
}

type PaginatedResponse<T> = { items: T[]; totalCount: number } | T[]

export default function StudentsPage() {
  const navigate = useNavigate()
  const [addOpen, setAddOpen] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const res = await axiosClient.get<PaginatedResponse<Student>>('/students')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
  })

  const columns: Column<Student>[] = [
    { key: 'rollNumber', header: 'Roll #', width: '110px' },
    {
      key: 'firstName',
      header: 'Name',
      render: (r) => (
        <span className="font-medium text-gray-900">
          {r.firstName} {r.lastName}
        </span>
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'programName', header: 'Program' },
    { key: 'sectionName', header: 'Section' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
            r.status === 'Active'
              ? 'bg-emerald-100 text-emerald-700'
              : r.status === 'Suspended'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {r.status}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
          <p className="text-sm text-muted-foreground">Manage student records, profiles and enrollment.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add Student
        </button>
      </div>

      <AddStudentDialog open={addOpen} onClose={() => setAddOpen(false)} />

      {isLoading && <p className="text-muted-foreground">Loading students…</p>}
      {isError && <p className="text-red-600">Failed to load students. Please try again.</p>}
      {!isLoading && !isError && (
        <DataTable<Student>
          columns={columns}
          data={data ?? []}
          rowKey={(r) => r.id}
          searchableFields={['firstName', 'lastName', 'rollNumber', 'email']}
          pageSize={15}
          onRowClick={(r) => navigate(`/students/${r.id}`)}
          emptyMessage="No students enrolled yet."
        />
      )}
    </div>
  )
}
