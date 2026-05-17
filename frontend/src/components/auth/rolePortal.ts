// Maps a user's roles to their primary portal landing path.
// PRD §6 — System Administrator, Executive, Principal, Academic Coordinator, Teacher,
// Accountant, HR Officer, Student, Parent, Procurement Officer.

export type Portal = 'super-admin' | 'executive' | 'campus' | 'teacher' | 'student' | 'parent'

const roleToPortal: Record<string, Portal> = {
  SystemAdmin: 'super-admin',
  Executive: 'executive',
  Principal: 'campus',
  AcademicCoordinator: 'campus',
  Accountant: 'campus',
  HrOfficer: 'campus',
  ProcurementOfficer: 'campus',
  Teacher: 'teacher',
  Student: 'student',
  Parent: 'parent',
}

const portalPriority: Portal[] = ['super-admin', 'executive', 'campus', 'teacher', 'student', 'parent']
const EMPTY_GUID = '00000000-0000-0000-0000-000000000000'
const CAMPUS_SETUP_ROLES = new Set([
  'Principal',
  'AcademicCoordinator',
  'Accountant',
  'HrOfficer',
  'ProcurementOfficer',
])

export function resolvePortal(roles: string[] | undefined | null): Portal {
  if (!roles || roles.length === 0) return 'student'
  const candidates = roles
    .map((r) => roleToPortal[r])
    .filter((p): p is Portal => Boolean(p))
  if (candidates.length === 0) return 'student'
  for (const p of portalPriority) {
    if (candidates.includes(p)) return p
  }
  return candidates[0]
}

export function landingPath(portal: Portal): string {
  switch (portal) {
    case 'super-admin': return '/super-admin/dashboard'
    case 'executive':   return '/executive/dashboard'
    case 'campus':      return '/campus/dashboard'
    case 'teacher':     return '/teacher/dashboard'
    case 'student':     return '/student/dashboard'
    case 'parent':      return '/parent/dashboard'
  }
}

export function needsCampusSetup(roles: string[] | undefined | null, campusId: string | undefined | null): boolean {
  return Boolean(
    roles?.some((role) => CAMPUS_SETUP_ROLES.has(role)) &&
    (!campusId || campusId === EMPTY_GUID),
  )
}

export function authenticatedLandingPath(roles: string[] | undefined | null, campusId: string | undefined | null): string {
  if (needsCampusSetup(roles, campusId)) return '/campus/setup'
  return landingPath(resolvePortal(roles))
}
