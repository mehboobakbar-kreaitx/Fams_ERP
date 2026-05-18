import PortalLayout, { type PortalNavItem, type PortalTheme } from './PortalLayout'
import { NavScopeProvider, useNavScope } from '../../store/navScopeStore'
import { NetworkTreeNav } from './NetworkTreeNav'

const theme: PortalTheme = {
  sidebarBg: 'bg-[#0F1B2D]',
  sidebarActiveBg: 'bg-[#1d2c47] text-white',
  sidebarHoverBg: 'hover:bg-[#192640]',
  sidebarText: 'text-[#E8EDF5]',
  sidebarMutedText: 'text-[#A8B4CC]',
  badgeBg: 'bg-red-600',
  badgeText: 'text-white',
  avatarBg: 'bg-red-600',
}

// Network-level governance nav — Super Admin sees the NETWORK, not campus operations.
// Campus-operational modules (HRM, Finance, Payroll, Procurement, Assets, Transport,
// Library, Hostel, Communication) belong to the Campus Portal, not here.
const navItems: PortalNavItem[] = [
  // 1. Network Dashboard
  { to: '/super-admin/dashboard', label: 'Network Dashboard', icon: '🌐' },

  // 2. Institution Management — schools, campuses, billing (network governance)
  {
    label: 'Institution Management',
    icon: '🏛️',
    defaultOpen: true,
    children: [
      { to: '/super-admin/schools',       label: 'Schools',       icon: '🏛️' },
      { to: '/super-admin/campuses',      label: 'Campuses',      icon: '🏫' },
      { to: '/super-admin/subscriptions', label: 'Subscriptions', icon: '💳' },
    ],
  },

  // 3. Network Analytics — cross-campus and KPI views only (not per-campus ops)
  {
    label: 'Network Analytics',
    icon: '📊',
    children: [
      { to: '/super-admin/reports',               label: 'Analytics Hub',        icon: '📊' },
      { to: '/super-admin/reports/cross-campus',  label: 'Cross-Campus',         icon: '🌐' },
      { to: '/super-admin/reports/campus-kpi',    label: 'Campus KPIs',          icon: '🏆' },
      { to: '/super-admin/reports/academic',      label: 'Academic Overview',    icon: '📚' },
      { to: '/super-admin/reports/attendance',    label: 'Attendance Overview',  icon: '📅' },
      { to: '/super-admin/reports/operational',   label: 'Operational Overview', icon: '⚙️' },
    ],
  },

  // 4. Audit & Compliance — platform-wide security governance
  {
    label: 'Audit & Compliance',
    icon: '🛡️',
    children: [
      { to: '/super-admin/security',            label: 'Security Overview',   icon: '🛡️' },
      { to: '/super-admin/security/roles',      label: 'Roles & Permissions', icon: '🔐' },
      { to: '/super-admin/security/mfa',        label: 'MFA Management',      icon: '🔑' },
      { to: '/super-admin/security/activity',   label: 'Activity Monitor',    icon: '👁️' },
      { to: '/super-admin/security/compliance', label: 'Compliance Logs',     icon: '📋' },
      { to: '/super-admin/audit',               label: 'Audit Logs',          icon: '🔒' },
    ],
  },

  // 5. System Configuration
  { to: '/super-admin/config', label: 'System Config', icon: '⚙️' },
]

function NavScopeBreadcrumb() {
  const { scopeType, selectedSchoolName, selectedCampusName } = useNavScope()
  if (scopeType === 'network') return null
  const crumbs = ['Network']
  if (selectedSchoolName) crumbs.push(selectedSchoolName)
  if (scopeType === 'campus' && selectedCampusName) crumbs.push(selectedCampusName)
  return (
    <p className="text-[11px] text-[#A8B4CC] leading-none mt-0.5 truncate max-w-xs">
      {crumbs.join(' › ')}
    </p>
  )
}

export default function SuperAdminLayout() {
  return (
    <NavScopeProvider>
      <PortalLayout
        portalName="Super Admin Portal"
        portalShortName="Super Admin"
        theme={theme}
        navItems={navItems}
        extraSidebarContent={<NetworkTreeNav theme={theme} />}
        headerContextSlot={<NavScopeBreadcrumb />}
      />
    </NavScopeProvider>
  )
}
