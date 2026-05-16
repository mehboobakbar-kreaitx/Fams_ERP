// Maps a user's roles to their primary portal landing path.
// PRD §6 — System Administrator, Executive, Principal, Academic Coordinator, Teacher,
// Accountant, HR Officer, Student, Parent, Procurement Officer.

export type Portal = 'super-admin' | 'campus' | 'teacher' | 'student' | 'parent'

const roleToPortal: Record<string, Portal> = {
  SystemAdmin: 'super-admin',
  Executive: 'super-admin',
  Principal: 'campus',
  AcademicCoordinator: 'campus',
  Accountant: 'campus',
  HrOfficer: 'campus',
  ProcurementOfficer: 'campus',
  Teacher: 'teacher',
  Student: 'student',
  Parent: 'parent',
}

const portalPriority: Portal[] = ['super-admin', 'campus', 'teacher', 'student', 'parent']

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
    case 'campus':      return '/campus/dashboard'
    case 'teacher':     return '/teacher/dashboard'
    case 'student':     return '/student/dashboard'
    case 'parent':      return '/parent/dashboard'
  }
}
