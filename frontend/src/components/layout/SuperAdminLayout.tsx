import PortalLayout, { type PortalNavItem, type PortalTheme } from './PortalLayout'

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

const navItems: PortalNavItem[] = [
  { to: '/super-admin/dashboard', label: 'Dashboard',  icon: '🏠' },
  { to: '/super-admin/schools',   label: 'Schools',    icon: '🏛️' },
  { to: '/super-admin/campuses',  label: 'Campuses',   icon: '🏫' },
  { to: '/super-admin/students',  label: 'Students',   icon: '👥' },
  { to: '/super-admin/staff',     label: 'Staff',      icon: '👤' },
  { to: '/super-admin/finance',   label: 'Finance',    icon: '💰' },
  { to: '/super-admin/audit',     label: 'Audit Logs', icon: '📜' },
  { to: '/super-admin/config',    label: 'System Config', icon: '⚙️' },
]

export default function SuperAdminLayout() {
  return (
    <PortalLayout
      portalName="Super Admin Portal"
      portalShortName="Super Admin"
      theme={theme}
      navItems={navItems}
    />
  )
}
