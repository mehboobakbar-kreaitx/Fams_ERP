import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'

type Tab = 'matrix' | 'assignments'

type RoleDefinition = {
  id: string
  roleName: string
  displayName: string
  description: string
  userCount: number
  permissionCount: number
  portal: string
  permissions: { module: string; actions: string[] }[]
}

type UserRoleAssignment = {
  id: string
  userName: string
  email: string
  roles: string[]
  campusName?: string
  schoolName?: string
  lastLogin?: string
  mfaEnabled: boolean
}

type RbacSummary = {
  totalRoles: number
  totalUsers: number
  totalPermissions: number
  usersWithMultipleRoles: number
}

const PORTAL_COLORS: Record<string, string> = {
  'super-admin': 'bg-red-100 text-red-700',
  executive:     'bg-violet-100 text-violet-700',
  campus:        'bg-blue-100 text-blue-700',
  teacher:       'bg-emerald-100 text-emerald-700',
  student:       'bg-amber-100 text-amber-700',
  parent:        'bg-gray-100 text-gray-600',
}

// Static role definitions derived from rolePortal.ts — shown even before backend is available
const STATIC_ROLES: RoleDefinition[] = [
  { id: '1', roleName: 'SystemAdmin',           displayName: 'System Administrator', description: 'Full system access across all campuses and schools.', userCount: 0, permissionCount: 0, portal: 'super-admin', permissions: [] },
  { id: '2', roleName: 'Executive',             displayName: 'Executive',            description: 'Read-only executive dashboard and cross-campus reports.', userCount: 0, permissionCount: 0, portal: 'executive', permissions: [] },
  { id: '3', roleName: 'Principal',             displayName: 'Principal',            description: 'Full campus management including staff, academic and finance.', userCount: 0, permissionCount: 0, portal: 'campus', permissions: [] },
  { id: '4', roleName: 'AcademicCoordinator',  displayName: 'Academic Coordinator', description: 'Academic management: classes, exams, results, attendance.', userCount: 0, permissionCount: 0, portal: 'campus', permissions: [] },
  { id: '5', roleName: 'Accountant',            displayName: 'Accountant',           description: 'Finance, payroll processing, fee management and reports.', userCount: 0, permissionCount: 0, portal: 'campus', permissions: [] },
  { id: '6', roleName: 'HrOfficer',             displayName: 'HR Officer',           description: 'HR operations: recruitment, contracts, leave, performance.', userCount: 0, permissionCount: 0, portal: 'campus', permissions: [] },
  { id: '7', roleName: 'ProcurementOfficer',   displayName: 'Procurement Officer',  description: 'Procurement: vendors, PRs, POs, GRN, approvals.', userCount: 0, permissionCount: 0, portal: 'campus', permissions: [] },
  { id: '8', roleName: 'Teacher',               displayName: 'Teacher',              description: 'Teaching portal: schedule, attendance, marks, leave.', userCount: 0, permissionCount: 0, portal: 'teacher', permissions: [] },
  { id: '9', roleName: 'Student',               displayName: 'Student',              description: 'Student portal: timetable, results, attendance, fee.', userCount: 0, permissionCount: 0, portal: 'student', permissions: [] },
  { id: '10', roleName: 'Parent',               displayName: 'Parent',               description: 'Parent portal: children overview, attendance, fee, results.', userCount: 0, permissionCount: 0, portal: 'parent', permissions: [] },
]

export default function RolesPermissionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('matrix')
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null)

  const summaryQuery = useQuery({
    queryKey: ['rbac-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<RbacSummary>('/security/rbac/summary')
      return res.data
    },
    retry: false,
  })

  const rolesQuery = useQuery({
    queryKey: ['rbac-roles'],
    queryFn: async () => {
      const res = await axiosClient.get<RoleDefinition[]>('/security/rbac/roles')
      return Array.isArray(res.data) ? res.data : []
    },
    enabled: activeTab === 'matrix',
    retry: false,
  })

  const assignmentsQuery = useQuery({
    queryKey: ['rbac-assignments'],
    queryFn: async () => {
      const res = await axiosClient.get<UserRoleAssignment[]>('/security/rbac/assignments')
      return Array.isArray(res.data) ? res.data : []
    },
    enabled: activeTab === 'assignments',
    retry: false,
  })

  const s = summaryQuery.data
  const roles = rolesQuery.data?.length ? rolesQuery.data : (activeTab === 'matrix' && rolesQuery.isError ? STATIC_ROLES : [])
  const displayRoles = activeTab === 'matrix' ? roles : STATIC_ROLES

  const assignmentCols: Column<UserRoleAssignment>[] = [
    {
      key: 'userName', header: 'User',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.userName}</p>
          <p className="text-xs text-muted-foreground">{r.email}</p>
        </div>
      ),
    },
    {
      key: 'roles', header: 'Roles',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.roles.map((role) => (
            <span key={role} className={`text-xs px-2 py-0.5 rounded-full font-medium ${PORTAL_COLORS[role] ?? 'bg-gray-100 text-gray-600'}`}>{role}</span>
          ))}
        </div>
      ),
    },
    { key: 'campusName', header: 'Campus', width: '130px', render: (r) => r.campusName ?? r.schoolName ?? '—' },
    {
      key: 'mfaEnabled', header: 'MFA', width: '70px',
      render: (r) => <span className={`text-xs font-semibold ${r.mfaEnabled ? 'text-emerald-700' : 'text-red-600'}`}>{r.mfaEnabled ? '✓ On' : '✗ Off'}</span>,
    },
    { key: 'lastLogin', header: 'Last Login', width: '130px', render: (r) => r.lastLogin ? <span className="font-mono text-xs">{new Date(r.lastLogin).toLocaleDateString('en-PK')}</span> : <span className="text-muted-foreground text-xs">—</span> },
  ]

  const TABS: { key: Tab; label: string }[] = [
    { key: 'matrix', label: 'Role Matrix' },
    { key: 'assignments', label: 'User Assignments' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Roles & Permissions</h1>
        <p className="text-sm text-muted-foreground">RBAC role definitions, permission matrix and user role assignments.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Roles"          value={s?.totalRoles?.toString() ?? String(STATIC_ROLES.length)} icon="🔐" />
        <KpiCard label="Total Users"          value={s?.totalUsers?.toLocaleString() ?? '—'}                   icon="👥" />
        <KpiCard label="Permissions"          value={s?.totalPermissions?.toLocaleString() ?? '—'}              icon="✅" />
        <KpiCard label="Multi-Role Users"     value={s?.usersWithMultipleRoles?.toLocaleString() ?? '—'}        icon="🔀" />
      </div>

      {summaryQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Live RBAC data not yet available. Role definitions below are derived from the system configuration.
        </p>
      )}

      <div className="flex gap-1 mb-4">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); setSelectedRole(null) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === t.key ? 'bg-primary-700 text-white' : 'bg-white border border-border text-gray-700 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role list */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              {displayRoles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(selectedRole?.id === role.id ? null : role)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${selectedRole?.id === role.id ? 'bg-primary-50 border-l-2 border-l-primary-600' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{role.displayName}</p>
                      <p className="text-xs text-muted-foreground">{role.roleName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PORTAL_COLORS[role.portal] ?? 'bg-gray-100 text-gray-600'}`}>{role.portal}</span>
                      {role.userCount > 0 && <span className="text-xs text-muted-foreground">{role.userCount} users</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Role detail */}
          <div className="lg:col-span-2">
            {selectedRole ? (
              <div className="bg-white border border-border rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-gray-900 text-lg">{selectedRole.displayName}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{selectedRole.description}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${PORTAL_COLORS[selectedRole.portal] ?? 'bg-gray-100 text-gray-600'}`}>{selectedRole.portal}</span>
                </div>
                {selectedRole.permissions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedRole.permissions.map((perm) => (
                      <div key={perm.module}>
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">{perm.module}</p>
                        <div className="flex flex-wrap gap-1">
                          {perm.actions.map((a) => (
                            <span key={a} className="text-xs bg-primary-50 text-primary-700 border border-primary-200 px-2 py-0.5 rounded">{a}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Permission details will appear once the RBAC backend module is deployed.</p>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-border rounded-xl p-8 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Select a role to view its permissions.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <>
          {!assignmentsQuery.isLoading && assignmentsQuery.isError && (
            <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              User assignment data not yet available. Will appear once the Security backend module is deployed.
            </p>
          )}
          {!assignmentsQuery.isLoading && !assignmentsQuery.isError && (
            <DataTable<UserRoleAssignment>
              columns={assignmentCols}
              data={assignmentsQuery.data ?? []}
              rowKey={(r) => r.id}
              searchableFields={['userName', 'email', 'campusName']}
              pageSize={20}
              emptyMessage="No user role assignments found."
            />
          )}
        </>
      )}
    </div>
  )
}
