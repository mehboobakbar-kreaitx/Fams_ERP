import PortalLayout, { type PortalNavItem, type PortalTheme } from './PortalLayout'

const theme: PortalTheme = {
  sidebarBg: 'bg-[#1A2340]',
  sidebarActiveBg: 'bg-[#2d3a5e] text-white',
  sidebarHoverBg: 'hover:bg-[#242f4f]',
  sidebarText: 'text-[#E8EDF5]',
  sidebarMutedText: 'text-[#A8B4CC]',
  badgeBg: 'bg-indigo-600',
  badgeText: 'text-white',
  avatarBg: 'bg-indigo-600',
}

const navItems: PortalNavItem[] = [
  { to: '/executive/dashboard', label: 'Dashboard', icon: '📊' },

  {
    label: 'Reports & Analytics',
    icon: '📊',
    defaultOpen: true,
    children: [
      { to: '/executive/reports',                label: 'Reports Hub',      icon: '📊' },
      { to: '/executive/reports/cross-campus',   label: 'Cross-Campus',     icon: '🌐' },
      { to: '/executive/reports/campus-kpi',     label: 'Campus KPIs',      icon: '🏆' },
      { to: '/executive/reports/academic',       label: 'Academic Reports', icon: '📚' },
      { to: '/executive/reports/attendance',     label: 'Attendance',       icon: '📅' },
      { to: '/executive/reports/operational',    label: 'Operational',      icon: '⚙️' },
    ],
  },
]

export default function ExecutiveLayout() {
  return (
    <PortalLayout
      portalName="Executive Portal"
      portalShortName="Executive"
      theme={theme}
      navItems={navItems}
    />
  )
}
