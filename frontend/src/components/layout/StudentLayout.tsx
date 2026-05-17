import PortalLayout, { type PortalNavItem, type PortalTheme } from './PortalLayout'

const theme: PortalTheme = {
  sidebarBg: 'bg-[#2D3748]',
  sidebarActiveBg: 'bg-[#3c4858] text-white',
  sidebarHoverBg: 'hover:bg-[#384353]',
  sidebarText: 'text-white',
  sidebarMutedText: 'text-gray-300',
  badgeBg: 'bg-emerald-500',
  badgeText: 'text-white',
  avatarBg: 'bg-emerald-600',
}

const navItems: PortalNavItem[] = [
  { to: '/student/dashboard', label: 'Dashboard', icon: '🏠' },
  {
    label: 'Academic',
    icon: '📚',
    defaultOpen: true,
    children: [
      { to: '/student/timetable',  label: 'Timetable',  icon: '🗓️' },
      { to: '/student/attendance', label: 'Attendance', icon: '📅' },
      { to: '/student/results',    label: 'Results',    icon: '📊' },
    ],
  },
  {
    label: 'Finance',
    icon: '💰',
    children: [
      { to: '/student/fee', label: 'Fee', icon: '💳' },
    ],
  },
  { to: '/student/documents', label: 'Documents', icon: '📄' },
]

export default function StudentLayout() {
  return (
    <PortalLayout
      portalName="Student Portal"
      portalShortName="Student"
      theme={theme}
      navItems={navItems}
    />
  )
}
