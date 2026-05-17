import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'

type Severity = 'Info' | 'Warning' | 'Critical'
type EventType = 'Login' | 'Logout' | 'FailedLogin' | 'DataAccess' | 'DataExport' | 'ConfigChange' | 'PermissionChange' | 'AccountLocked' | 'SessionExpired' | 'SuspiciousActivity'

type ActivityEvent = {
  id: string
  timestamp: string
  eventType: EventType
  severity: Severity
  actorName: string
  actorEmail?: string
  ipAddress?: string
  campusName?: string
  description: string
  details?: string
  resolved: boolean
}

type ActivitySummary = {
  totalEvents24h: number
  failedLogins24h: number
  suspiciousEvents24h: number
  blockedAttempts24h: number
}

const SEV_COLORS: Record<Severity, string> = {
  Info:     'bg-blue-100 text-blue-700',
  Warning:  'bg-amber-100 text-amber-700',
  Critical: 'bg-red-100 text-red-700',
}

const EVENT_COLORS: Partial<Record<EventType, string>> = {
  FailedLogin:        'bg-red-50 text-red-700 border-red-200',
  AccountLocked:      'bg-red-50 text-red-700 border-red-200',
  SuspiciousActivity: 'bg-orange-50 text-orange-700 border-orange-200',
  ConfigChange:       'bg-violet-50 text-violet-700 border-violet-200',
  PermissionChange:   'bg-violet-50 text-violet-700 border-violet-200',
  DataExport:         'bg-amber-50 text-amber-700 border-amber-200',
}

function exportCsv(rows: ActivityEvent[]) {
  const headers = ['Timestamp', 'Event', 'Severity', 'Actor', 'Email', 'IP', 'Campus', 'Description']
  const lines = rows.map((r) =>
    [r.timestamp, r.eventType, r.severity, r.actorName, r.actorEmail ?? '', r.ipAddress ?? '', r.campusName ?? '', r.description.replace(/,/g, ';')]
      .map((v) => `"${v}"`).join(','),
  )
  const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `activity-monitor-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ActivityMonitorPage() {
  const [severityFilter, setSeverityFilter] = useState<Severity | ''>('')
  const [eventTypeFilter, setEventTypeFilter] = useState<EventType | ''>('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const summaryQuery = useQuery({
    queryKey: ['activity-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<ActivitySummary>('/security/activity/summary')
      return res.data
    },
    retry: false,
  })

  const eventsQuery = useQuery({
    queryKey: ['activity-events', severityFilter, eventTypeFilter, fromDate, toDate],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (severityFilter)  params.severity  = severityFilter
      if (eventTypeFilter) params.eventType = eventTypeFilter
      if (fromDate)        params.fromDate  = fromDate
      if (toDate)          params.toDate    = toDate
      const res = await axiosClient.get<ActivityEvent[]>('/security/activity/events', { params })
      return Array.isArray(res.data) ? res.data : []
    },
    retry: false,
    refetchInterval: 30_000,
  })

  const s = summaryQuery.data
  const events = eventsQuery.data ?? []

  const columns: Column<ActivityEvent>[] = [
    {
      key: 'severity', header: 'Level', width: '90px',
      render: (r) => <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${SEV_COLORS[r.severity]}`}>{r.severity}</span>,
    },
    {
      key: 'timestamp', header: 'When', width: '145px',
      render: (r) => (
        <div>
          <p className="font-mono text-xs">{new Date(r.timestamp).toLocaleDateString('en-PK')}</p>
          <p className="font-mono text-xs text-muted-foreground">{new Date(r.timestamp).toLocaleTimeString('en-PK')}</p>
        </div>
      ),
    },
    {
      key: 'eventType', header: 'Event', width: '160px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${EVENT_COLORS[r.eventType] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
          {r.eventType}
        </span>
      ),
    },
    {
      key: 'actorName', header: 'Actor',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900 text-sm">{r.actorName}</p>
          {r.actorEmail && <p className="text-xs text-muted-foreground">{r.actorEmail}</p>}
        </div>
      ),
    },
    { key: 'ipAddress', header: 'IP', width: '130px', render: (r) => <span className="font-mono text-xs">{r.ipAddress ?? '—'}</span> },
    { key: 'campusName', header: 'Campus', width: '120px', render: (r) => r.campusName ?? '—' },
    {
      key: 'description', header: 'Description',
      render: (r) => <span className="text-sm text-gray-700 line-clamp-1">{r.description}</span>,
    },
    {
      key: 'resolved', header: 'Status', width: '80px',
      render: (r) => <span className={`text-xs font-semibold ${r.resolved ? 'text-gray-400' : r.severity === 'Critical' ? 'text-red-600' : 'text-amber-600'}`}>{r.resolved ? 'Resolved' : 'Open'}</span>,
    },
  ]

  const EVENT_TYPES: EventType[] = ['Login', 'Logout', 'FailedLogin', 'DataAccess', 'DataExport', 'ConfigChange', 'PermissionChange', 'AccountLocked', 'SessionExpired', 'SuspiciousActivity']

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Activity Monitor</h1>
          <p className="text-sm text-muted-foreground">Real-time security event feed. Auto-refreshes every 30 seconds.</p>
        </div>
        <button type="button" disabled={events.length === 0} onClick={() => exportCsv(events)}
          className="text-sm px-4 py-2 bg-white border border-border rounded-lg hover:bg-gray-50 disabled:opacity-40">
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Events (24h)"         value={s?.totalEvents24h?.toLocaleString() ?? '—'}      icon="📊" />
        <KpiCard label="Failed Logins (24h)"  value={s?.failedLogins24h?.toLocaleString() ?? '—'}     icon="⚠️" />
        <KpiCard label="Suspicious (24h)"     value={s?.suspiciousEvents24h?.toLocaleString() ?? '—'} icon="🚨" />
        <KpiCard label="Blocked (24h)"        value={s?.blockedAttempts24h?.toLocaleString() ?? '—'}   icon="🚫" />
      </div>

      {summaryQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Activity monitor API not yet available. Will appear once the Security backend module is deployed.
        </p>
      )}

      <div className="bg-white border border-border rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as Severity | '')}
            className="border border-input rounded-lg px-3 py-2 text-sm">
            <option value="">All Severities</option>
            <option>Info</option>
            <option>Warning</option>
            <option>Critical</option>
          </select>
          <select value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value as EventType | '')}
            className="border border-input rounded-lg px-3 py-2 text-sm">
            <option value="">All Event Types</option>
            {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm" placeholder="From date" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm" placeholder="To date" />
        </div>
      </div>

      {!eventsQuery.isLoading && !eventsQuery.isError && (
        <DataTable<ActivityEvent>
          columns={columns}
          data={events}
          rowKey={(r) => r.id}
          searchableFields={['actorName', 'actorEmail', 'eventType', 'ipAddress', 'campusName', 'description']}
          pageSize={25}
          emptyMessage="No activity events match the current filters."
        />
      )}
    </div>
  )
}
