import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'

type SecuritySummary = {
  mfaCoveragePercent: number
  failedLoginsLast24h: number
  activeSessions: number
  blockedIps: number
  criticalAlertsOpen: number
  lastAuditEventAt: string
}

type SecurityEvent = {
  id: string
  timestamp: string
  eventType: string
  severity: 'Info' | 'Warning' | 'Critical'
  actorName: string
  description: string
  ipAddress?: string
}

const SEV_COLORS = {
  Info:     'border-blue-300 bg-blue-50 text-blue-800',
  Warning:  'border-amber-300 bg-amber-50 text-amber-800',
  Critical: 'border-red-300 bg-red-50 text-red-800',
}

const SEV_DOT = {
  Info:     'bg-blue-400',
  Warning:  'bg-amber-400',
  Critical: 'bg-red-500',
}

type SecurityModule = {
  title: string
  description: string
  icon: string
  to: string
  color: string
}

const MODULES: SecurityModule[] = [
  { title: 'Roles & Permissions', description: 'Role-to-permission matrix and user role assignments.', icon: '🔐', to: 'roles', color: 'border-violet-200 bg-violet-50' },
  { title: 'MFA Management', description: 'MFA enrollment status; force-enroll or revoke users.', icon: '🔑', to: 'mfa', color: 'border-blue-200 bg-blue-50' },
  { title: 'Activity Monitor', description: 'Real-time activity feed, failed logins, suspicious events.', icon: '👁️', to: 'activity', color: 'border-amber-200 bg-amber-50' },
  { title: 'Compliance Logs', description: 'Data access, exports, bulk operations and privacy events.', icon: '📋', to: 'compliance', color: 'border-emerald-200 bg-emerald-50' },
  { title: 'Audit Logs', description: 'Immutable administrative action log across all campuses.', icon: '🔒', to: '../audit', color: 'border-gray-200 bg-gray-50' },
]

export default function SecurityDashboard() {
  const summaryQuery = useQuery({
    queryKey: ['security-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<SecuritySummary>('/security/summary', {
        headers: { 'x-skip-error-toast': '1' },
        timeout: 15_000,
      })
      return res.data
    },
    retry: false,
  })

  const eventsQuery = useQuery({
    queryKey: ['security-recent-events'],
    queryFn: async () => {
      const res = await axiosClient.get<SecurityEvent[]>('/security/events/recent', {
        headers: { 'x-skip-error-toast': '1' },
        timeout: 15_000,
      })
      return Array.isArray(res.data) ? res.data : []
    },
    retry: false,
  })

  const s = summaryQuery.data
  const events = eventsQuery.data ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Security Dashboard</h1>
        <p className="text-sm text-muted-foreground">Enterprise security health, MFA coverage, and threat indicators.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KpiCard label="MFA Coverage"       value={s ? `${s.mfaCoveragePercent.toFixed(0)}%` : '—'} icon="🔑" trend={s && s.mfaCoveragePercent >= 90 ? 'up' : 'down'} />
        <KpiCard label="Failed Logins (24h)" value={s?.failedLoginsLast24h?.toLocaleString() ?? '—'} icon="⚠️" />
        <KpiCard label="Active Sessions"    value={s?.activeSessions?.toLocaleString() ?? '—'}      icon="👤" />
        <KpiCard label="Blocked IPs"        value={s?.blockedIps?.toLocaleString() ?? '—'}           icon="🚫" />
        <KpiCard label="Critical Alerts"    value={s?.criticalAlertsOpen?.toLocaleString() ?? '—'}   icon="🔴" />
        <KpiCard label="Last Event"         value={s?.lastAuditEventAt ? new Date(s.lastAuditEventAt).toLocaleTimeString('en-PK') : '—'} icon="🕐" />
      </div>

      {summaryQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          Security API not yet available. Will appear once the Security backend module is deployed.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Module cards */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Security Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MODULES.map((m) => (
              <Link key={m.title} to={m.to} relative="path"
                className={`border rounded-xl p-4 hover:shadow-sm transition-shadow ${m.color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{m.icon}</span>
                  <span className="font-semibold text-gray-900 text-sm">{m.title}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{m.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent events */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Recent Security Events</h2>
          {eventsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading events…</p>
          ) : eventsQuery.isError || events.length === 0 ? (
            <div className="bg-gray-50 border border-border rounded-xl p-4 text-sm text-muted-foreground">
              No recent events. Security monitoring will appear once the backend is deployed.
            </div>
          ) : (
            <div className="space-y-2">
              {events.slice(0, 8).map((ev) => (
                <div key={ev.id} className={`border rounded-lg px-3 py-2.5 ${SEV_COLORS[ev.severity]}`}>
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${SEV_DOT[ev.severity]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{ev.eventType}</p>
                      <p className="text-xs truncate">{ev.description}</p>
                      <p className="text-xs opacity-70 mt-0.5">{ev.actorName} · {new Date(ev.timestamp).toLocaleTimeString('en-PK')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Security health indicators */}
      {s && (
        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Security Health Checklist</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'MFA coverage ≥ 90%',       pass: s.mfaCoveragePercent >= 90 },
              { label: 'Failed logins (24h) < 50',  pass: s.failedLoginsLast24h < 50 },
              { label: 'No critical open alerts',   pass: s.criticalAlertsOpen === 0 },
              { label: 'Blocked IP list maintained', pass: s.blockedIps >= 0 },
            ].map((item) => (
              <div key={item.label} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${item.pass ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                <span className="text-base">{item.pass ? '✅' : '❌'}</span>
                <span className="text-sm text-gray-800">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
