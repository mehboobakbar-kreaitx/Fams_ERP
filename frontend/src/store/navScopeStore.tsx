import { createContext, useContext, useState, type ReactNode } from 'react'

export type ScopeType = 'network' | 'school' | 'campus'

type NavScopeState = {
  scopeType: ScopeType
  selectedSchoolId: string | null
  selectedSchoolName: string | null
  selectedCampusId: string | null
  selectedCampusName: string | null
}

type NavScopeContextValue = NavScopeState & {
  selectNetwork: () => void
  selectSchool: (id: string, name: string) => void
  selectCampus: (id: string, name: string, schoolId: string, schoolName: string) => void
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

  const value: NavScopeContextValue = {
    ...state,
    selectNetwork: () => setState(NETWORK),
    selectSchool: (id, name) =>
      setState({ scopeType: 'school', selectedSchoolId: id, selectedSchoolName: name, selectedCampusId: null, selectedCampusName: null }),
    selectCampus: (id, name, schoolId, schoolName) =>
      setState({ scopeType: 'campus', selectedSchoolId: schoolId, selectedSchoolName: schoolName, selectedCampusId: id, selectedCampusName: name }),
  }

  return <NavScopeContext.Provider value={value}>{children}</NavScopeContext.Provider>
}

export function useNavScope(): NavScopeContextValue {
  const ctx = useContext(NavScopeContext)
  if (!ctx) throw new Error('useNavScope must be used inside NavScopeProvider')
  return ctx
}
