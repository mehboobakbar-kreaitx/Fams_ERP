import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { authStore } from '../../store/authStore'
import { cn } from '../../lib/utils'
import { useIdleLogout } from '../../hooks/useIdleLogout'
import ChatbotWidget from '../chatbot/ChatbotWidget'

export type PortalNavItem = { to: string; label: string; icon: string }

export type PortalTheme = {
  sidebarBg: string         // tailwind class for sidebar background
  sidebarActiveBg: string   // tailwind class for active nav item
  sidebarHoverBg: string    // tailwind class for hover
  sidebarText: string       // primary text color class
  sidebarMutedText: string  // muted text color class
  badgeBg: string           // badge color for portal name
  badgeText: string
  avatarBg: string          // header avatar background
}

export type PortalLayoutProps = {
  portalName: string
  portalShortName: string
  theme: PortalTheme
  navItems: PortalNavItem[]
  showChatbot?: boolean
}

export default function PortalLayout({
  portalName,
  portalShortName,
  theme,
  navItems,
  showChatbot = true,
}: PortalLayoutProps) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = authStore.getState()
  useIdleLogout()

  const handleLogout = () => {
    authStore.clear()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 transform transition-transform lg:translate-x-0 lg:static lg:inset-auto',
          theme.sidebarBg,
          theme.sidebarText,
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className={cn('px-6 py-5 border-b border-black/20')}>
          <Link to={navItems[0]?.to ?? '/'} className="flex items-center gap-2">
            <span className="text-2xl">🦅</span>
            <div>
              <p className="font-bold text-lg leading-tight">FAMS</p>
              <span className={cn('inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded mt-0.5', theme.badgeBg, theme.badgeText)}>
                {portalShortName}
              </span>
            </div>
          </Link>
        </div>
        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              end={item.to.endsWith('/dashboard')}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive ? theme.sidebarActiveBg : cn(theme.sidebarMutedText, theme.sidebarHoverBg),
                )
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-20 bg-black/40 lg:hidden" />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-border sticky top-0 z-10">
          <div className="px-4 lg:px-6 h-16 flex items-center justify-between gap-3">
            <button
              onClick={() => setSidebarOpen((s) => !s)}
              className="lg:hidden text-gray-700"
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
            <h1 className="text-lg font-semibold text-gray-800 hidden md:block">{portalName}</h1>
            <div className="flex items-center gap-4 ml-auto">
              <button className="relative text-gray-600 hover:text-primary-700" aria-label="Notifications">
                🔔
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">3</span>
              </button>
              <div className="flex items-center gap-3">
                <div className={cn('w-9 h-9 text-white rounded-full flex items-center justify-center text-sm font-semibold', theme.avatarBg)}>
                  {(user?.firstName?.[0] ?? '?') + (user?.lastName?.[0] ?? '')}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-800">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user?.roles?.[0] ?? 'User'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-red-600 border border-border rounded-lg px-3 py-1.5"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {showChatbot && <ChatbotWidget />}
    </div>
  )
}
