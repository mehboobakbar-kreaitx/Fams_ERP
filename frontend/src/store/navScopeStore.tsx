import { createContext, useContext, useState, type ReactNode } from 'react'

// Canonical workspace mode type. 'network' = platform governance view with no
// campus selected. 'school' = a specific school is selected, school-scoped
// analytics are shown. 'campus' = a specific campus is selected, full
// campus-operational modules are shown.
export type WorkspaceMode = 'network' | 'school' | 'campus'

// Kept as a backward-compatible alias so existing code that imports ScopeType continues to work.
export type ScopeType = WorkspaceMode

type NavScopeState = {
  scopeType: WorkspaceMode
  selectedSchoolId: string | null
  selectedSchoolName: string | null
  selectedCampusId: string | null
  selectedCampusName: string | null
}

type NavScopeContextValue = NavScopeState & {
  // Explicit alias so consumer components can destructure `currentWorkspaceMode`
  // instead of `scopeType` — both refer to the same value.
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

export function NavScopeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NavScopeState>(NETWORK)

  const selectNetwork = () => setState(NETWORK)

  const selectSchool = (id: string, name: string) =>
    setState({
      scopeType: 'school',
      selectedSchoolId: id,
      selectedSchoolName: name,
      selectedCampusId: null,
      selectedCampusName: null,
    })

  const selectCampus = (id: string, name: string, schoolId: string, schoolName: string) =>
    setState({
      scopeType: 'campus',
      selectedSchoolId: schoolId,
      selectedSchoolName: schoolName,
      selectedCampusId: id,
      selectedCampusName: name,
    })

  const value: NavScopeContextValue = {
    ...state,
    currentWorkspaceMode: state.scopeType,
    selectNetwork,
    selectSchool,
    // enterCampus is a semantic alias for selectCampus — same action, clearer intent
    // when called from "Enter Workspace" UI affordances.
    enterCampus: selectCampus,
    selectCampus,
    exitWorkspace: selectNetwork,
  }

  return <NavScopeContext.Provider value={value}>{children}</NavScopeContext.Provider>
}

export function useNavScope(): NavScopeContextValue {
  const ctx = useContext(NavScopeContext)
  if (!ctx) throw new Error('useNavScope must be used inside NavScopeProvider')
  return ctx
}
