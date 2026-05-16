import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { authStore } from '../../store/authStore'
import { cn } from '../../lib/utils'
import ChatbotWidget from '../chatbot/ChatbotWidget'

type NavItem = { to: string; label: string; icon: string; roles?: string[] }

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/students', label: 'Students', icon: '👥' },
  { to: '/admissions', label: 'Admissions', icon: '📋' },
  { to: '/attendance', label: 'Attendance', icon: '📅' },
  { to: '/results', label: 'Results', icon: '📊' },
  { to: '/fee', label: 'Fee', icon: '💰' },
  { to: '/hrm', label: 'HRM', icon: '🏢' },
]

export default function AppLayout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = authStore.getState()

  const handleLogout = () => {
    authStore.clear()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 bg-primary-800 text-white transform transition-transform lg:translate-x-0 lg:static lg:inset-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="px-6 py-5 border-b border-primary-900">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🦅</span>
            <div>
              <p className="font-bold text-lg leading-tight">FAMS</p>
              <p className="text-xs text-primary-200">Falcon Academic</p>
            </div>
          </Link>
        </div>
        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive ? 'bg-primary-900 text-white' : 'text-primary-100 hover:bg-primary-700',
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
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-border sticky top-0 z-10">
          <div className="px-4 lg:px-6 h-16 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen((s) => !s)}
              className="lg:hidden text-gray-700"
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
            <h1 className="text-lg font-semibold text-gray-800 hidden md:block">Welcome, {user?.firstName || 'User'}</h1>
            <div className="flex items-center gap-4">
              <button className="relative text-gray-600 hover:text-primary-700" aria-label="Notifications">
                🔔
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">3</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-700 text-white rounded-full flex items-center justify-center text-sm font-semibold">
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

      <ChatbotWidget />
    </div>
  )
}
