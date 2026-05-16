import PortalLayout, { type PortalNavItem, type PortalTheme } from './PortalLayout'

const theme: PortalTheme = {
  sidebarBg: 'bg-primary-800',
  sidebarActiveBg: 'bg-primary-900 text-white',
  sidebarHoverBg: 'hover:bg-primary-700',
  sidebarText: 'text-white',
  sidebarMutedText: 'text-primary-100',
  badgeBg: 'bg-secondary',
  badgeText: 'text-white',
  avatarBg: 'bg-primary-700',
}

const navItems: PortalNavItem[] = [
  { to: '/campus/dashboard',    label: 'Dashboard',  icon: '🏠' },
  { to: '/campus/students',     label: 'Students',   icon: '👥' },
  { to: '/campus/admissions',   label: 'Admissions', icon: '📋' },
  { to: '/campus/attendance',   label: 'Attendance', icon: '📅' },
  { to: '/campus/results',      label: 'Results',    icon: '📊' },
  { to: '/campus/fee',          label: 'Fee',        icon: '💰' },
  { to: '/campus/hrm',          label: 'HRM',        icon: '🏢' },
]

export default function CampusLayout() {
  return (
    <PortalLayout
      portalName="Campus Portal"
      portalShortName="Campus"
      theme={theme}
      navItems={navItems}
    />
  )
}
