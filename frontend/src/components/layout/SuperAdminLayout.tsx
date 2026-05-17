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

// All 15 enterprise modules mapped to routes/groups.
const navItems: PortalNavItem[] = [
  // 1. Dashboard & Analytics
  { to: '/super-admin/dashboard', label: 'Dashboard', icon: '🏠' },

  // 2. Institution Management
  {
    label: 'Institution Management',
    icon: '🏛️',
    defaultOpen: true,
    children: [
      { to: '/super-admin/schools',        label: 'Schools',       icon: '🏛️' },
      { to: '/super-admin/campuses',       label: 'Campuses',      icon: '🏫' },
      { to: '/super-admin/students',       label: 'Students',      icon: '👥' },
      { to: '/super-admin/subscriptions',  label: 'Subscriptions', icon: '💳' },
    ],
  },

  // 3. Academic Management
  {
    label: 'Academic Management',
    icon: '📚',
    children: [
      { to: '/super-admin/classes',      label: 'Classes & Sections', icon: '🏛️' },
      { to: '/super-admin/exams',        label: 'Examinations',       icon: '📝' },
      { to: '/super-admin/certificates', label: 'Certificates',       icon: '🎓' },
    ],
  },

  // 4. Staff & HRM
  {
    label: 'Staff & HRM',
    icon: '👤',
    children: [
      { to: '/super-admin/staff', label: 'Staff Directory', icon: '👤' },
    ],
  },

  // 5. Finance & Accounting
  {
    label: 'Finance & Accounting',
    icon: '💰',
    children: [
      { to: '/super-admin/finance',          label: 'Institution Finance',  icon: '💰' },
      { to: '/super-admin/finance/reports',  label: 'Financial Reports',    icon: '📈' },
    ],
  },

  // 8. Payroll & Salaries
  {
    label: 'Payroll & Salaries',
    icon: '💵',
    children: [
      { to: '/super-admin/payroll',  label: 'Payroll Dashboard', icon: '🏠' },
    ],
  },

  // 6. Vendor & Procurement
  {
    label: 'Vendor & Procurement',
    icon: '🛒',
    children: [
      { to: '/super-admin/procurement',          label: 'Procurement Dashboard', icon: '🏠' },
      { to: '/super-admin/procurement/vendors',  label: 'Vendors',               icon: '🏢' },
      { to: '/super-admin/procurement/requests', label: 'Purchase Requests',     icon: '📋' },
      { to: '/super-admin/procurement/orders',   label: 'Purchase Orders',       icon: '🛒' },
      { to: '/super-admin/procurement/reports',  label: 'Procurement Reports',   icon: '📊' },
    ],
  },

  // 7. Asset & Inventory
  {
    label: 'Asset & Inventory',
    icon: '📦',
    children: [
      { to: '/super-admin/assets',             label: 'Asset Dashboard',  icon: '🏠' },
      { to: '/super-admin/assets/registry',    label: 'Asset Registry',   icon: '🗂️' },
      { to: '/super-admin/assets/inventory',   label: 'Inventory Stock',  icon: '📦' },
      { to: '/super-admin/assets/transfers',   label: 'Transfers',         icon: '🔄' },
      { to: '/super-admin/assets/audit',       label: 'Audit Logs',        icon: '🔒' },
    ],
  },

  // 9. Transport
  {
    label: 'Transport',
    icon: '🚌',
    children: [
      { to: '/super-admin/transport', label: 'Transport Management', icon: '🚌' },
    ],
  },

  // 10. Library
  {
    label: 'Library',
    icon: '📚',
    children: [
      { to: '/super-admin/library', label: 'Library Management', icon: '📚' },
    ],
  },

  // 11. Hostel
  {
    label: 'Hostel',
    icon: '🏨',
    children: [
      { to: '/super-admin/hostel', label: 'Hostel Management', icon: '🏨' },
    ],
  },

  // 12. Communication & Engagement
  {
    label: 'Communication',
    icon: '💬',
    children: [
      { to: '/super-admin/notifications', label: 'Notifications',   icon: '🔔' },
      { to: '/super-admin/messaging',     label: 'SMS & Email',     icon: '📧' },
      { to: '/super-admin/support',       label: 'Support Tickets', icon: '🎫' },
    ],
  },

  // 13. Reports & Analytics  /  14. Security & Compliance
  {
    label: 'Reports & Analytics',
    icon: '📊',
    children: [
      { to: '/super-admin/reports',                label: 'Reports Hub',        icon: '📊' },
      { to: '/super-admin/reports/academic',       label: 'Academic Reports',   icon: '📚' },
      { to: '/super-admin/reports/attendance',     label: 'Attendance',         icon: '📅' },
      { to: '/super-admin/reports/campus-kpi',     label: 'Campus KPIs',        icon: '🏆' },
      { to: '/super-admin/reports/cross-campus',   label: 'Cross-Campus',       icon: '🌐' },
      { to: '/super-admin/reports/operational',    label: 'Operational',        icon: '⚙️' },
    ],
  },

  // 14. Security & Compliance
  {
    label: 'Security & Compliance',
    icon: '🛡️',
    children: [
      { to: '/super-admin/security',              label: 'Security Dashboard',  icon: '🛡️' },
      { to: '/super-admin/security/roles',        label: 'Roles & Permissions', icon: '🔐' },
      { to: '/super-admin/security/mfa',          label: 'MFA Management',      icon: '🔑' },
      { to: '/super-admin/security/activity',     label: 'Activity Monitor',    icon: '👁️' },
      { to: '/super-admin/security/compliance',   label: 'Compliance Logs',     icon: '📋' },
      { to: '/super-admin/audit',                 label: 'Audit Logs',          icon: '🔒' },
    ],
  },

  // 15. System Configuration
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
