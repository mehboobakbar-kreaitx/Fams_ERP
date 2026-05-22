import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import { useNavScope } from '../../store/navScopeStore'

type SchoolItem = { id: string; name: string; code: string }
type CampusItem = { id: string; schoolId: string; name: string; code: string; isActive: boolean }

// Activates campus workspace from a bookmarked URL.
// Primary path is the tree nav (synchronous click handler).
// This loader exists for direct URL access / refresh.
export default function CampusWorkspaceLoader() {
  const { campusId } = useParams<{ campusId: string }>()
  const { selectedCampusId, scopeType, enterCampus } = useNavScope()

  // 'pending' = waiting for data; 'done' = context activated; 'missing' = invalid id
  const [status, setStatus] = useState<'pending' | 'done' | 'missing'>(() =>
    scopeType === 'campus' && selectedCampusId === campusId ? 'done' : 'pending',
  )

  const schoolsQuery = useQuery({
    queryKey: ['tree-schools'],
    queryFn: async () => {
      const res = await axiosClient.get<{ items: SchoolItem[] } | SchoolItem[]>('/schools', {
        params: { pageSize: 200 },
        headers: { 'x-skip-error-toast': '1' },
      })
      return Array.isArray(res.data) ? res.data : (res.data.items ?? [])
    },
    staleTime: 2 * 60_000,
    retry: false,
  })

  const campusesQuery = useQuery({
    queryKey: ['tree-campuses'],
    queryFn: async () => {
      const res = await axiosClient.get<CampusItem[]>('/campuses', {
        headers: { 'x-skip-error-toast': '1' },
      })
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 2 * 60_000,
    retry: false,
  })

  useEffect(() => {
    if (status !== 'pending') return
    if (campusesQuery.isLoading || schoolsQuery.isLoading) return
    if (!campusId) { setStatus('missing'); return }

    const campus = (campusesQuery.data ?? []).find((c) => c.id === campusId)
    const school = campus ? (schoolsQuery.data ?? []).find((s) => s.id === campus.schoolId) : null

    if (!campus || !school) { setStatus('missing'); return }

    // State update + setStatus are batched — SuperAdminLayoutInner re-renders
    // with campus nav items before <Navigate> is returned on the next render.
    enterCampus(campus.id, campus.name, school.id, school.name)
    setStatus('done')
  }, [
    status,
    campusId,
    campusesQuery.isLoading,
    campusesQuery.data,
    schoolsQuery.isLoading,
    schoolsQuery.data,
    enterCampus,
  ])

  if (status === 'pending') {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Activating workspace…
      </div>
    )
  }

  return <Navigate to="/super-admin/dashboard" replace />
}
