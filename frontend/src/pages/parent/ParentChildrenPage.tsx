import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { axiosClient } from '../../api/axiosClient'

type ChildSummary = {
  studentId: string
  name: string
  rollNumber: string
  className: string
  sectionName: string
}

type ParentDashboardDto = {
  children: ChildSummary[]
}

export default function ParentChildrenPage() {
  const dash = useQuery({
    queryKey: ['parent-children'],
    queryFn: async () => {
      const res = await axiosClient.get<ParentDashboardDto>('/dashboard/parent')
      return res.data
    },
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">My Children</h1>
      <p className="text-sm text-muted-foreground mb-6">All students linked to your account.</p>

      {dash.isLoading && <p>Loading…</p>}
      {dash.isError && <p className="text-red-600">Failed to load.</p>}

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-semibold text-gray-700">Name</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-700">Roll #</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-700">Class</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-700">Section</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-700"></th>
            </tr>
          </thead>
          <tbody>
            {(dash.data?.children ?? []).map((c) => (
              <tr key={c.studentId} className="border-b border-border">
                <td className="px-4 py-2 font-medium">{c.name}</td>
                <td className="px-4 py-2 font-mono text-xs">{c.rollNumber}</td>
                <td className="px-4 py-2">{c.className}</td>
                <td className="px-4 py-2">{c.sectionName}</td>
                <td className="px-4 py-2">
                  <Link to={`/parent/children/${c.studentId}`} className="text-primary-700 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
