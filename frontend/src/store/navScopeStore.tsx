import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type WorkspaceMode = 'network' | 'school' | 'campus'
export type ScopeType = WorkspaceMode

type NavScopeState = {
  scopeType: WorkspaceMode
  selectedSchoolId: string | null
  selectedSchoolName: string | null
  selectedCampusId: string | null
  selectedCampusName: string | null
}

type NavScopeContextValue = NavScopeState & {
  currentWorkspaceMode: WorkspaceMode
  selectNetwork: () => void
  selectSchool: (id: string, name: string) => void
  selectCampus: (id: string, name: string, schoolId: string, schoolName: string) => void
  enterCampus: (id: string, name: string, schoolId: string, schoolName: string) => void
  exitWorkspace: () => void
}

const NavScopeContext = createContext<NavScopeContextValue | null>(null)

const NETWORK: NavScopeState = {
  scopeType: 'network',
  selectedSchoolId: null,
  selectedSchoolName: null,
  selectedCampusId: null,
  selectedCampusName: null,
}

const SCOPE_KEY = 'fams_nav_scope'

function loadScope(): NavScopeState {
  try {
    const raw = sessionStorage.getItem(SCOPE_KEY)
    if (!raw) return NETWORK
    const parsed = JSON.parse(raw) as Partial<NavScopeState>
    if (
      parsed.scopeType === 'network' ||
      parsed.scopeType === 'school' ||
      parsed.scopeType === 'campus'
    ) {
      return parsed as NavScopeState
    }
  } catch {}
  return NETWORK
}

function saveScope(state: NavScopeState) {
  try { sessionStorage.setItem(SCOPE_KEY, JSON.stringify(state)) } catch {}
}

export function NavScopeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NavScopeState>(loadScope)

  const selectNetwork = useCallback(() => {
    saveScope(NETWORK)
    setState(NETWORK)
  }, [])

  const selectSchool = useCallback((id: string, name: string) => {
    const next: NavScopeState = {
      scopeType: 'school',
      selectedSchoolId: id,
      selectedSchoolName: name,
      selectedCampusId: null,
      selectedCampusName: null,
    }
    saveScope(next)
    setState(next)
  }, [])

  const selectCampus = useCallback((id: string, name: string, schoolId: string, schoolName: string) => {
    const next: NavScopeState = {
      scopeType: 'campus',
      selectedSchoolId: schoolId,
      selectedSchoolName: schoolName,
      selectedCampusId: id,
      selectedCampusName: name,
    }
    saveScope(next)
    setState(next)
  }, [])

  const value = useMemo<NavScopeContextValue>(() => ({
    ...state,
    currentWorkspaceMode: state.scopeType,
    selectNetwork,
    selectSchool,
    enterCampus: selectCampus,
    selectCampus,
    exitWorkspace: selectNetwork,
  }), [state, selectNetwork, selectSchool, selectCampus])

  return <NavScopeContext.Provider value={value}>{children}</NavScopeContext.Provider>
}

export function useNavScope(): NavScopeContextValue {
  const ctx = useContext(NavScopeContext)
  if (!ctx) throw new Error('useNavScope must be used inside NavScopeProvider')
  return ctx
}
