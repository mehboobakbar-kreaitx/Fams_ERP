import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { axiosClient } from '../api/axiosClient'
import { formatDate } from '../lib/utils'

type StudentDetail = {
  id: string
  rollNumber: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  programName?: string
  sectionName?: string
  campusName?: string
  status: string
  enrollmentDate?: string
  parentName?: string
  parentPhone?: string
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const res = await axiosClient.get<StudentDetail>(`/students/${id}`)
      return res.data
    },
    enabled: !!id,
  })

  if (isLoading) return <p className="text-muted-foreground">Loading student…</p>
  if (isError || !data)
    return (
      <div>
        <p className="text-red-600 mb-4">Student not found or failed to load.</p>
        <Link to="/students" className="text-primary-700 underline">
          Back to students
        </Link>
      </div>
    )

  const initials = `${data.firstName?.[0] ?? ''}${data.lastName?.[0] ?? ''}`

  return (
    <div>
      <Link to="/students" className="text-sm text-primary-700 hover:underline">
        ← Back to students
      </Link>

      <div className="bg-white rounded-xl border border-border p-6 mt-3 flex items-center gap-5">
        <div className="w-20 h-20 bg-primary-700 text-white rounded-full flex items-center justify-center text-2xl font-bold">
          {initials}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900">
            {data.firstName} {data.lastName}
          </h1>
          <p className="text-muted-foreground">
            Roll # {data.rollNumber} • {data.programName ?? '—'} • {data.sectionName ?? '—'}
          </p>
        </div>
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            data.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {data.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Personal Information</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Email" value={data.email} />
            <Row label="Phone" value={data.phone ?? '—'} />
            <Row label="Date of Birth" value={data.dateOfBirth ? formatDate(data.dateOfBirth) : '—'} />
            <Row label="Gender" value={data.gender ?? '—'} />
            <Row label="Campus" value={data.campusName ?? '—'} />
            <Row
              label="Enrolled"
              value={data.enrollmentDate ? formatDate(data.enrollmentDate) : '—'}
            />
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Guardian Contact</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Parent / Guardian" value={data.parentName ?? '—'} />
            <Row label="Parent Phone" value={data.parentPhone ?? '—'} />
          </dl>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-gray-900 font-medium text-right">{value}</dd>
    </div>
  )
}
