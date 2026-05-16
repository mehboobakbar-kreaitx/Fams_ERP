import PortalLayout, { type PortalNavItem, type PortalTheme } from './PortalLayout'

const theme: PortalTheme = {
  sidebarBg: 'bg-[#1E3A5F]',
  sidebarActiveBg: 'bg-[#2c4e7d] text-white',
  sidebarHoverBg: 'hover:bg-[#264571]',
  sidebarText: 'text-white',
  sidebarMutedText: 'text-blue-100',
  badgeBg: 'bg-blue-500',
  badgeText: 'text-white',
  avatarBg: 'bg-blue-600',
}

const navItems: PortalNavItem[] = [
  { to: '/teacher/dashboard',  label: 'Dashboard',       icon: '🏠' },
  { to: '/teacher/schedule',   label: 'My Schedule',     icon: '🗓️' },
  { to: '/teacher/attendance', label: 'Mark Attendance', icon: '✅' },
  { to: '/teacher/students',   label: 'My Students',     icon: '👥' },
  { to: '/teacher/marks',      label: 'Enter Marks',     icon: '📊' },
  { to: '/teacher/leave',      label: 'Apply Leave',     icon: '🌴' },
]

export default function TeacherLayout() {
  return (
    <PortalLayout
      portalName="Teacher Portal"
      portalShortName="Teacher"
      theme={theme}
      navItems={navItems}
    />
  )
}
