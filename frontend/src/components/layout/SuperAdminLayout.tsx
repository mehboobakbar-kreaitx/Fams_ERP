import { cn } from '../../lib/utils'
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

// Network-level governance — visible only in Network / School scope.
const networkNavItems: PortalNavItem[] = [
  { to: '/super-admin/dashboard', label: 'Network Dashboard', icon: '🌐' },

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

  { to: '/super-admin/config', label: 'System Config', icon: '⚙️' },
]

// Campus-operational modules — visible only when a campus workspace is selected.
const campusNavItems: PortalNavItem[] = [
  { to: '/super-admin/dashboard',  label: 'Campus Overview',  icon: '🏫' },
  { to: '/super-admin/students',   label: 'Students',         icon: '👥' },
  { to: '/super-admin/staff',      label: 'Staff',            icon: '🧑‍💼' },
  { to: '/super-admin/classes',    label: 'Classes',          icon: '📚' },
  { to: '/super-admin/exams',      label: 'Examinations',     icon: '📝' },
  { to: '/super-admin/certificates', label: 'Certificates',   icon: '🎓' },

  {
    label: 'Finance',
    icon: '💼',
    children: [
      { to: '/super-admin/finance',         label: 'Finance Dashboard', icon: '💼' },
      { to: '/super-admin/finance/reports', label: 'Reports',           icon: '📊' },
    ],
  },

  { to: '/super-admin/payroll', label: 'Payroll', icon: '💵' },

  {
    label: 'Procurement',
    icon: '🛒',
    children: [
      { to: '/super-admin/procurement',          label: 'Dashboard', icon: '🛒' },
      { to: '/super-admin/procurement/vendors',  label: 'Vendors',   icon: '🏢' },
      { to: '/super-admin/procurement/requests', label: 'Requests',  icon: '📋' },
      { to: '/super-admin/procurement/orders',   label: 'Orders',    icon: '📦' },
      { to: '/super-admin/procurement/reports',  label: 'Reports',   icon: '📊' },
    ],
  },

  {
    label: 'Assets',
    icon: '🏗️',
    children: [
      { to: '/super-admin/assets',           label: 'Dashboard', icon: '🏗️' },
      { to: '/super-admin/assets/registry',  label: 'Registry',  icon: '📋' },
      { to: '/super-admin/assets/inventory', label: 'Inventory', icon: '📦' },
      { to: '/super-admin/assets/transfers', label: 'Transfers', icon: '🔄' },
      { to: '/super-admin/assets/audit',     label: 'Audit',     icon: '🔍' },
    ],
  },

  { to: '/super-admin/transport',     label: 'Transport',     icon: '🚌' },
  { to: '/super-admin/library',       label: 'Library',       icon: '📚' },
  { to: '/super-admin/hostel',        label: 'Hostel',        icon: '🏠' },
  { to: '/super-admin/notifications', label: 'Notifications', icon: '🔔' },
  { to: '/super-admin/messaging',     label: 'Messaging',     icon: '💬' },
  { to: '/super-admin/support',       label: 'Support',       icon: '🎫' },
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

function SuperAdminLayoutInner() {
  const { scopeType, selectNetwork } = useNavScope()

  const isCampusScope = scopeType === 'campus'
  const navItems = isCampusScope ? campusNavItems : networkNavItems

  const preNavContent = scopeType !== 'network' ? (
    <button
      onClick={selectNetwork}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left',
        'text-[#A8B4CC] hover:bg-[#192640]',
      )}
    >
      <span className="text-xs opacity-70">←</span>
      <span>Back to Network</span>
    </button>
  ) : undefined

  return (
    <PortalLayout
      portalName="Super Admin Portal"
      portalShortName="Super Admin"
      theme={theme}
      navItems={navItems}
      preNavContent={preNavContent}
      extraSidebarContent={<NetworkTreeNav theme={theme} />}
      headerContextSlot={<NavScopeBreadcrumb />}
    />
  )
}

export default function SuperAdminLayout() {
  return (
    <NavScopeProvider>
      <SuperAdminLayoutInner />
    </NavScopeProvider>
  )
}
