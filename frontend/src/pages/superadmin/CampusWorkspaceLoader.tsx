import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import { useNavScope } from '../../store/navScopeStore'

type SchoolItem = { id: string; name: string; code: string }
type CampusItem = { id: string; schoolId: string; name: string; code: string; isActive: boolean }

export default function CampusWorkspaceLoader() {
  const { campusId } = useParams<{ campusId: string }>()
  const navigate = useNavigate()
  const { selectedCampusId, scopeType, enterCampus } = useNavScope()

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
    if (campusesQuery.isLoading || schoolsQuery.isLoading) return
    if (!campusId) {
      navigate('/super-admin/dashboard', { replace: true })
      return
    }

    // Already in this campus workspace — nothing to do.
    if (scopeType === 'campus' && selectedCampusId === campusId) {
      navigate('/super-admin/dashboard', { replace: true })
      return
    }

    const campus = (campusesQuery.data ?? []).find((c) => c.id === campusId)
    const school = campus
      ? (schoolsQuery.data ?? []).find((s) => s.id === campus.schoolId)
      : null

    if (!campus || !school) {
      navigate('/super-admin/dashboard', { replace: true })
      return
    }

    enterCampus(campus.id, campus.name, school.id, school.name)
    navigate('/super-admin/dashboard', { replace: true })
  }, [
    campusId,
    campusesQuery.isLoading,
    campusesQuery.data,
    schoolsQuery.isLoading,
    schoolsQuery.data,
    scopeType,
    selectedCampusId,
    enterCampus,
    navigate,
  ])

  return (
    <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
      Activating workspace…
    </div>
  )
}
