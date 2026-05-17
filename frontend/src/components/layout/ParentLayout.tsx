import PortalLayout, { type PortalNavItem, type PortalTheme } from './PortalLayout'

const theme: PortalTheme = {
  sidebarBg: 'bg-[#3F2C61]',
  sidebarActiveBg: 'bg-[#4f3a78] text-white',
  sidebarHoverBg: 'hover:bg-[#48346d]',
  sidebarText: 'text-white',
  sidebarMutedText: 'text-purple-100',
  badgeBg: 'bg-purple-500',
  badgeText: 'text-white',
  avatarBg: 'bg-purple-600',
}

const navItems: PortalNavItem[] = [
  { to: '/parent/dashboard', label: 'Dashboard', icon: '🏠' },
  {
    label: 'My Children',
    icon: '👨‍👩‍👧',
    defaultOpen: true,
    children: [
      { to: '/parent/children',   label: 'Children',   icon: '👨‍👩‍👧' },
      { to: '/parent/attendance', label: 'Attendance', icon: '📅' },
      { to: '/parent/results',    label: 'Results',    icon: '📊' },
      { to: '/parent/fee',        label: 'Fee',        icon: '💳' },
    ],
  },
  { to: '/parent/communications', label: 'Communications', icon: '✉️' },
]

export default function ParentLayout() {
  return (
    <PortalLayout
      portalName="Parent Portal"
      portalShortName="Parent"
      theme={theme}
      navItems={navItems}
    />
  )
}
