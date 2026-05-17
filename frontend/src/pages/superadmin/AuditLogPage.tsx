import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import DataTable, { type Column } from '../../components/ui/DataTable'

type Severity = 'Info' | 'Warning' | 'Critical'

type AuditEntry = {
  id: string
  timestamp: string
  actorName: string
  actorEmail?: string
  action: string
  entityType?: string
  entityId?: string
  campusName?: string
  ipAddress?: string
  details?: string
  severity?: Severity
  userAgent?: string
}

type Filters = {
  action: string
  fromDate: string
  toDate: string
  severity: string
}

const SEVERITY_COLORS: Record<Severity, string> = {
  Info:     'bg-blue-100 text-blue-700',
  Warning:  'bg-amber-100 text-amber-700',
  Critical: 'bg-red-100 text-red-700',
}

function exportCsv(rows: AuditEntry[]) {
  const headers = ['Timestamp', 'Actor', 'Email', 'Action', 'Entity', 'Campus', 'IP', 'Severity', 'Details']
  const lines = rows.map((r) =>
    [
      r.timestamp,
      r.actorName,
      r.actorEmail ?? '',
      r.action,
      r.entityType ?? '',
      r.campusName ?? '',
      r.ipAddress ?? '',
      r.severity ?? 'Info',
      (r.details ?? '').replace(/,/g, ';'),
    ]
      .map((v) => `"${v}"`)
      .join(','),
  )
  const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AuditLogPage() {
  const [filters, setFilters] = useState<Filters>({ action: '', fromDate: '', toDate: '', severity: '' })
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const logs = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (filters.action)   params.action   = filters.action
      if (filters.fromDate) params.fromDate  = filters.fromDate
      if (filters.toDate)   params.toDate    = filters.toDate
      if (filters.severity) params.severity  = filters.severity
      const res = await axiosClient.get<AuditEntry[] | { items: AuditEntry[] }>('/audit/logs', {
        params,
        headers: { 'x-skip-error-toast': '1' },
      })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: 0,
  })

  const data = logs.data ?? []

  const columns: Column<AuditEntry>[] = [
    {
      key: 'severity', header: 'Level', width: '90px',
      render: (r) => {
        const sev = r.severity ?? 'Info'
        return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${SEVERITY_COLORS[sev as Severity] ?? SEVERITY_COLORS.Info}`}>{sev}</span>
      },
    },
    {
      key: 'timestamp', header: 'When', width: '155px',
      render: (r) => (
        <div>
          <p className="font-mono text-xs">{new Date(r.timestamp).toLocaleDateString('en-PK')}</p>
          <p className="font-mono text-xs text-muted-foreground">{new Date(r.timestamp).toLocaleTimeString('en-PK')}</p>
        </div>
      ),
    },
    {
      key: 'actorName', header: 'Actor',
      render: (r) => (
        <div>
          <div className="font-medium text-gray-900">{r.actorName}</div>
          {r.actorEmail && <div className="text-xs text-muted-foreground">{r.actorEmail}</div>}
        </div>
      ),
    },
    {
      key: 'action', header: 'Action',
      render: (r) => (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
          {r.action}
        </span>
      ),
    },
    { key: 'entityType', header: 'Entity', width: '120px', render: (r) => r.entityType ?? '—' },
    { key: 'campusName', header: 'Campus', width: '120px', render: (r) => r.campusName ?? '—' },
    { key: 'ipAddress', header: 'IP', width: '120px', render: (r) => <span className="font-mono text-xs">{r.ipAddress ?? '—'}</span> },
    {
      key: 'details', header: '', width: '60px',
      render: (r) => r.details
        ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === r.id ? null : r.id) }}
            className="text-xs text-primary-600 hover:underline"
          >
            {expandedId === r.id ? 'Hide' : 'Detail'}
          </button>
        )
        : null,
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold text-gray-900">Audit Log</h1>
        <button
          type="button"
          disabled={data.length === 0}
          onClick={() => exportCsv(data)}
          className="text-sm px-4 py-2 bg-white border border-border rounded-lg hover:bg-gray-50 disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Immutable record of administrative actions across all campuses.</p>

      <div className="bg-white rounded-xl border border-border p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            placeholder="Action (e.g. CreateStudent)"
            value={filters.action}
            onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
            className="border border-input rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={filters.severity}
            onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value }))}
            className="border border-input rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Severities</option>
            <option>Info</option>
            <option>Warning</option>
            <option>Critical</option>
          </select>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
            className="border border-input rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
            className="border border-input rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => logs.refetch()}
            className="bg-primary-700 hover:bg-primary-800 text-white text-sm rounded-lg px-3 py-2"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {logs.isLoading && <p className="text-muted-foreground">Loading audit entries…</p>}
      {logs.isError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          The audit log endpoint (<code>/audit/logs</code>) is not yet available. Filters above are wired and ready
          once the backend exposes it.
        </div>
      )}
      {!logs.isLoading && !logs.isError && (
        <>
          <DataTable<AuditEntry>
            columns={columns}
            data={data}
            rowKey={(r) => r.id}
            searchableFields={['actorName', 'actorEmail', 'action', 'entityType', 'entityId', 'campusName']}
            pageSize={25}
            emptyMessage="No audit entries match the current filters."
          />
          {expandedId && (() => {
            const entry = data.find((r) => r.id === expandedId)
            if (!entry?.details) return null
            return (
              <div className="mt-3 bg-gray-50 border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">Entry detail — {entry.action}</p>
                  <button type="button" onClick={() => setExpandedId(null)} className="text-xs text-muted-foreground hover:text-gray-700">✕ Close</button>
                </div>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono break-all">{entry.details}</pre>
                {entry.userAgent && <p className="text-xs text-muted-foreground mt-2 font-mono">{entry.userAgent}</p>}
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}
