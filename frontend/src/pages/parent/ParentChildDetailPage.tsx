import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'

type StudentDetail = {
  id: string
  firstName: string
  lastName: string
  rollNumber: string
  email?: string | null
  phone?: string | null
  programName?: string | null
  className?: string | null
  sectionName?: string | null
  status: string
}

export default function ParentChildDetailPage() {
  const { id } = useParams<{ id: string }>()

  const child = useQuery({
    queryKey: ['parent-child', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await axiosClient.get<StudentDetail>(`/students/${id}`)
      return res.data
    },
  })

  if (child.isLoading) return <p>Loading…</p>
  if (child.isError || !child.data) return <p className="text-red-600">Could not load child record.</p>

  const c = child.data
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">{c.firstName} {c.lastName}</h1>
      <p className="text-sm text-muted-foreground mb-6">{c.programName ?? '—'} • {c.className ?? '—'} — {c.sectionName ?? '—'}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Roll Number" value={c.rollNumber} />
        <Card title="Status" value={c.status} />
        <Card title="Email" value={c.email ?? '—'} />
        <Card title="Phone" value={c.phone ?? '—'} />
      </div>
    </div>
  )
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground uppercase">{title}</p>
      <p className="text-base font-medium text-gray-900 mt-1">{value}</p>
    </div>
  )
}
