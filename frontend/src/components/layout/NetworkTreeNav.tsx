import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import { cn } from '../../lib/utils'
import { useNavScope } from '../../store/navScopeStore'
import type { PortalTheme } from './PortalLayout'

type SchoolItem = {
  id: string
  name: string
  code: string
  campusCount: number
  isActive: boolean
}

type CampusItem = {
  id: string
  schoolId: string
  name: string
  code: string
  isActive: boolean
}

type Props = { theme: PortalTheme }

export function NetworkTreeNav({ theme }: Props) {
  const navigate = useNavigate()
  const {
    scopeType,
    selectedSchoolId,
    selectedCampusId,
    selectNetwork,
    selectSchool,
    enterCampus,
  } = useNavScope()

  const [expanded, setExpanded] = useState<Set<string>>(new Set())

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

  const schools = schoolsQuery.data ?? []
  const campuses = campusesQuery.data ?? []

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="space-y-0.5">
      <p className={cn('px-3 pt-3 pb-1 text-[10px] uppercase tracking-widest font-semibold opacity-50', theme.sidebarMutedText)}>
        Network Hierarchy
      </p>

      {/* Network root — clicking exits any active workspace */}
      <button
        onClick={() => { selectNetwork(); navigate('/super-admin/dashboard') }}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left',
          scopeType === 'network' ? theme.sidebarActiveBg : cn(theme.sidebarMutedText, theme.sidebarHoverBg),
        )}
      >
        <span>🌐</span>
        <span className="font-medium flex-1">All Schools</span>
        {scopeType === 'network' && <span className="text-[10px] opacity-50">✓</span>}
      </button>

      {(schoolsQuery.isLoading || campusesQuery.isLoading) && (
        <p className={cn('px-4 py-1 text-xs opacity-40', theme.sidebarMutedText)}>Loading…</p>
      )}

      {/* School nodes */}
      {schools.map((school) => {
        const schoolCampuses = campuses.filter((c) => c.schoolId === school.id)
        const isSchoolSelected = selectedSchoolId === school.id && scopeType === 'school'
        const hasCampusFocus = selectedSchoolId === school.id && scopeType === 'campus'
        const isInThisSchool = isSchoolSelected || hasCampusFocus
        const isOpen = expanded.has(school.id) || hasCampusFocus || isSchoolSelected

        return (
          <div key={school.id}>
            <div className="flex items-center gap-0.5">
              {/* Expand / collapse toggle */}
              <button
                onClick={() => toggle(school.id)}
                className={cn(
                  'shrink-0 w-6 h-7 flex items-center justify-center text-[10px] rounded transition-colors',
                  theme.sidebarMutedText,
                  theme.sidebarHoverBg,
                )}
                aria-label={isOpen ? 'Collapse school' : 'Expand school'}
              >
                {isOpen ? '▾' : '▸'}
              </button>

              {/* School label — clicking enters school workspace */}
              <button
                onClick={() => {
                  selectSchool(school.id, school.name)
                  navigate('/super-admin/dashboard')
                  if (!isOpen) toggle(school.id)
                }}
                className={cn(
                  'group flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors text-left',
                  isSchoolSelected
                    ? theme.sidebarActiveBg
                    : cn(theme.sidebarMutedText, theme.sidebarHoverBg),
                )}
                title="Enter school workspace"
              >
                <span className="shrink-0">🏛️</span>
                <span className="truncate flex-1">{school.name}</span>

                {/* Workspace status indicator */}
                {isSchoolSelected ? (
                  <span className="text-[10px] opacity-60 shrink-0">✓</span>
                ) : isInThisSchool ? (
                  /* A campus within this school is active */
                  <span className="text-[10px] opacity-40 shrink-0">↳</span>
                ) : (
                  /* Hover affordance — Enter School Workspace */
                  <span className="text-[10px] opacity-0 group-hover:opacity-50 transition-opacity shrink-0">
                    →
                  </span>
                )}

                {/* Campus count badge — only shown when not in any workspace */}
                {!isInThisSchool && (
                  <span className={cn('shrink-0 text-[10px] opacity-30 group-hover:hidden', theme.sidebarMutedText)}>
                    {school.campusCount}
                  </span>
                )}
              </button>
            </div>

            {/* Campus nodes */}
            {isOpen && (
              <div className="ml-7 mt-0.5 mb-1 space-y-0.5">
                {schoolCampuses.length === 0 && !campusesQuery.isLoading && (
                  <p className={cn('px-3 py-1 text-[11px] opacity-40', theme.sidebarMutedText)}>
                    No campuses
                  </p>
                )}
                {schoolCampuses.map((campus) => {
                  const isCampusActive = scopeType === 'campus' && selectedCampusId === campus.id

                  return (
                    <button
                      key={campus.id}
                      onClick={() => {
                        enterCampus(campus.id, campus.name, school.id, school.name)
                        navigate('/super-admin/dashboard')
                      }}
                      className={cn(
                        'group w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors text-left',
                        isCampusActive
                          ? theme.sidebarActiveBg
                          : cn(theme.sidebarMutedText, theme.sidebarHoverBg),
                      )}
                      title="Enter campus workspace"
                    >
                      <span className="text-xs">🏫</span>
                      <span className="truncate flex-1">{campus.name}</span>

                      {/* Enter Campus Workspace affordance */}
                      {isCampusActive ? (
                        <span className="text-[10px] opacity-60 shrink-0">✓</span>
                      ) : (
                        <span className="text-[10px] opacity-0 group-hover:opacity-50 transition-opacity shrink-0">
                          →
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Error states — shown below the tree, non-blocking */}
      {schoolsQuery.isError && (
        <p className={cn('px-3 py-2 text-[11px] opacity-50', theme.sidebarMutedText)}>
          Could not load schools.
        </p>
      )}
    </div>
  )
}
