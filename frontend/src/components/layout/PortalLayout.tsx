import { useState, useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { authStore } from '../../store/authStore'
import { cn } from '../../lib/utils'
import { useIdleLogout } from '../../hooks/useIdleLogout'
import ChatbotWidget from '../chatbot/ChatbotWidget'

// A nav item is either a leaf (has `to`) or a collapsible group (has `children`).
export type PortalNavItem = {
  to?: string
  label: string
  icon: string
  children?: PortalNavItem[]
  defaultOpen?: boolean
  // RBAC: item is hidden unless the user has at least one of these roles.
  // Omit to show to everyone with access to this portal.
  roles?: string[]
}

export type PortalTheme = {
  sidebarBg: string
  sidebarActiveBg: string
  sidebarHoverBg: string
  sidebarText: string
  sidebarMutedText: string
  badgeBg: string
  badgeText: string
  avatarBg: string
}

export type PortalLayoutProps = {
  portalName: string
  portalShortName: string
  theme: PortalTheme
  navItems: PortalNavItem[]
  showChatbot?: boolean
  extraSidebarContent?: React.ReactNode
  headerContextSlot?: React.ReactNode
}

// ── Leaf nav item (NavLink to a route) ────────────────────────────────────────

function NavLeafItem({
  item,
  theme,
  onNavigate,
}: {
  item: PortalNavItem
  theme: PortalTheme
  onNavigate: () => void
}) {
  if (!item.to) return null
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
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
  )
}

// ── Collapsible group item ─────────────────────────────────────────────────────

function NavGroupItem({
  item,
  theme,
  onNavigate,
  userRoles,
}: {
  item: PortalNavItem
  theme: PortalTheme
  onNavigate: () => void
  userRoles: string[]
}) {
  const { pathname } = useLocation()

  const visibleChildren = (item.children ?? []).filter(
    (c) => !c.roles || c.roles.some((r) => userRoles.includes(r)),
  )

  const hasActiveChild = visibleChildren.some((c) => c.to && pathname.startsWith(c.to))
  const [open, setOpen] = useState(item.defaultOpen ?? hasActiveChild)

  // Auto-expand when the user navigates into a child route.
  useEffect(() => {
    if (hasActiveChild) setOpen(true)
  }, [hasActiveChild])

  if (visibleChildren.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left',
          hasActiveChild
            ? theme.sidebarActiveBg
            : cn(theme.sidebarMutedText, theme.sidebarHoverBg),
        )}
      >
        <span>{item.icon}</span>
        <span className="flex-1 font-medium">{item.label}</span>
        <span className="text-[10px] opacity-60 shrink-0">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="ml-4 mt-0.5 pb-1 space-y-0.5">
          {visibleChildren.map((child) => (
            <NavLeafItem
              key={child.to ?? child.label}
              item={child}
              theme={theme}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Dispatcher — renders leaf or group based on item shape ────────────────────

function NavItem({
  item,
  theme,
  onNavigate,
  userRoles,
}: {
  item: PortalNavItem
  theme: PortalTheme
  onNavigate: () => void
  userRoles: string[]
}) {
  if (item.roles && !item.roles.some((r) => userRoles.includes(r))) return null
  if (item.children) {
    return (
      <NavGroupItem
        item={item}
        theme={theme}
        onNavigate={onNavigate}
        userRoles={userRoles}
      />
    )
  }
  return <NavLeafItem item={item} theme={theme} onNavigate={onNavigate} />
}

// ── Main layout ───────────────────────────────────────────────────────────────

export default function PortalLayout({
  portalName,
  portalShortName,
  theme,
  navItems,
  showChatbot = true,
  extraSidebarContent,
  headerContextSlot,
}: PortalLayoutProps) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = authStore.getState()
  const userRoles = user?.roles ?? []
  useIdleLogout()

  const handleLogout = () => {
    authStore.clear()
    navigate('/login')
  }

  // Find the first leaf for the logo home link.
  const homeTo = navItems.find((i) => i.to)?.to ?? '/'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 flex flex-col transform transition-transform',
          'lg:translate-x-0 lg:static lg:inset-auto',
          theme.sidebarBg,
          theme.sidebarText,
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo / portal badge */}
        <div className="shrink-0 px-6 py-5 border-b border-black/20">
          <Link to={homeTo} className="flex items-center gap-2">
            <span className="text-2xl">🦅</span>
            <div>
              <p className="font-bold text-lg leading-tight">FAMS</p>
              <span
                className={cn(
                  'inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded mt-0.5',
                  theme.badgeBg,
                  theme.badgeText,
                )}
              >
                {portalShortName}
              </span>
            </div>
          </Link>
        </div>

        {/* Scrollable nav area */}
        <div className="flex-1 overflow-y-auto">
          <nav className="px-3 py-4 space-y-0.5">
            {navItems.map((item) => (
              <NavItem
                key={item.to ?? item.label}
                item={item}
                theme={theme}
                onNavigate={() => setSidebarOpen(false)}
                userRoles={userRoles}
              />
            ))}
          </nav>
          {extraSidebarContent && (
            <div className="px-3 pb-4 border-t border-black/10">
              {extraSidebarContent}
            </div>
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
        />
      )}

      {/* ── Main content ─────────────────────────────────────────────────── */}
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
            <div className="hidden md:block">
              <p className="text-lg font-semibold text-gray-800 leading-tight">{portalName}</p>
              {headerContextSlot}
            </div>
            <div className="flex items-center gap-4 ml-auto">
              <button
                className="relative text-gray-600 hover:text-primary-700"
                aria-label="Notifications"
              >
                🔔
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  3
                </span>
              </button>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-9 h-9 text-white rounded-full flex items-center justify-center text-sm font-semibold',
                    theme.avatarBg,
                  )}
                >
                  {(user?.firstName?.[0] ?? '?') + (user?.lastName?.[0] ?? '')}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-800">
                    {user?.firstName} {user?.lastName}
                  </p>
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
