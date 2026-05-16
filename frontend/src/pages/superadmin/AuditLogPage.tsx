import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import DataTable, { type Column } from '../../components/ui/DataTable'

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
}

type Filters = {
  search: string
  action: string
  fromDate: string
  toDate: string
}

export default function AuditLogPage() {
  const [filters, setFilters] = useState<Filters>({ search: '', action: '', fromDate: '', toDate: '' })

  const logs = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (filters.action) params.action = filters.action
      if (filters.fromDate) params.fromDate = filters.fromDate
      if (filters.toDate) params.toDate = filters.toDate
      const res = await axiosClient.get<AuditEntry[] | { items: AuditEntry[] }>('/audit/logs', {
        params,
        headers: { 'x-skip-error-toast': '1' },
      })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: 0,
  })

  const columns: Column<AuditEntry>[] = [
    {
      key: 'timestamp',
      header: 'When',
      width: '160px',
      render: (r) => <span className="font-mono text-xs">{new Date(r.timestamp).toLocaleString('en-PK')}</span>,
    },
    {
      key: 'actorName',
      header: 'Actor',
      render: (r) => (
        <div>
          <div className="font-medium">{r.actorName}</div>
          {r.actorEmail && <div className="text-xs text-muted-foreground">{r.actorEmail}</div>}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (r) => (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
          {r.action}
        </span>
      ),
    },
    { key: 'entityType', header: 'Entity', render: (r) => r.entityType ?? '—' },
    { key: 'campusName', header: 'Campus', render: (r) => r.campusName ?? '—' },
    { key: 'ipAddress', header: 'IP', render: (r) => <span className="font-mono text-xs">{r.ipAddress ?? '—'}</span> },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Audit Log</h1>
      <p className="text-sm text-muted-foreground mb-6">Searchable record of administrative actions across all campuses.</p>

      <div className="bg-white rounded-xl border border-border p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            placeholder="Action (e.g. CreateStudent)"
            value={filters.action}
            onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
            className="border border-input rounded-lg px-3 py-2 text-sm"
          />
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
        <DataTable<AuditEntry>
          columns={columns}
          data={logs.data ?? []}
          rowKey={(r) => r.id}
          searchableFields={['actorName', 'actorEmail', 'action', 'entityType', 'entityId', 'campusName']}
          pageSize={25}
          emptyMessage="No audit entries match the current filters."
        />
      )}
    </div>
  )
}
