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
