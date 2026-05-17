import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatDate } from '../../lib/utils'

type AuditAction =
  | 'Created'
  | 'Updated'
  | 'Assigned'
  | 'Returned'
  | 'Transferred'
  | 'MaintenanceScheduled'
  | 'MaintenanceCompleted'
  | 'Disposed'
  | 'Lost'
  | 'Restocked'

type AuditEntry = {
  id: string
  assetId: string
  assetCode: string
  assetName: string
  action: AuditAction
  performedBy: string
  performedAt: string
  description: string
  previousValue?: string
  newValue?: string
  ipAddress?: string
}

const ACTION_COLORS: Record<AuditAction, string> = {
  Created:               'bg-emerald-100 text-emerald-700',
  Updated:               'bg-blue-100 text-blue-700',
  Assigned:              'bg-primary-100 text-primary-700',
  Returned:              'bg-gray-100 text-gray-600',
  Transferred:           'bg-amber-100 text-amber-700',
  MaintenanceScheduled:  'bg-blue-50 text-blue-600',
  MaintenanceCompleted:  'bg-emerald-50 text-emerald-600',
  Disposed:              'bg-red-100 text-red-700',
  Lost:                  'bg-red-200 text-red-800',
  Restocked:             'bg-teal-100 text-teal-700',
}

const ALL_ACTIONS: Array<AuditAction | 'All'> = [
  'All', 'Created', 'Assigned', 'Transferred', 'MaintenanceScheduled',
  'MaintenanceCompleted', 'Disposed', 'Restocked',
]

export default function AssetAuditPage() {
  const [actionFilter, setActionFilter] = useState<AuditAction | 'All'>('All')
  const [period, setPeriod] = useState('')
  const [assetSearch, setAssetSearch] = useState('')

  const auditQuery = useQuery({
    queryKey: ['asset-audit', actionFilter, period, assetSearch],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (actionFilter !== 'All') params.action = actionFilter
      if (period) params.period = period
      if (assetSearch) params.assetCode = assetSearch
      const res = await axiosClient.get<AuditEntry[] | { items: AuditEntry[] }>('/assets/audit', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const entries = auditQuery.data ?? []

  const columns: Column<AuditEntry>[] = [
    {
      key: 'performedAt',
      header: 'Timestamp',
      width: '145px',
      render: (r) => (
        <div>
          <p className="font-mono text-xs">{formatDate(r.performedAt)}</p>
          <p className="text-xs text-muted-foreground font-mono">{new Date(r.performedAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      ),
    },
    {
      key: 'assetCode',
      header: 'Asset',
      width: '200px',
      render: (r) => (
        <div>
          <p className="font-mono text-xs font-semibold text-primary-700">{r.assetCode}</p>
          <p className="text-sm text-gray-800">{r.assetName}</p>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      width: '170px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLORS[r.action]}`}>
          {r.action}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (r) => (
        <div>
          <p className="text-sm text-gray-800">{r.description}</p>
          {(r.previousValue || r.newValue) && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {r.previousValue && <span className="line-through mr-1">{r.previousValue}</span>}
              {r.newValue && <span className="text-emerald-700">→ {r.newValue}</span>}
            </p>
          )}
        </div>
      ),
    },
    { key: 'performedBy', header: 'By', width: '130px' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Asset Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Immutable event history for all asset lifecycle actions. Read-only — system-generated.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 mb-4 flex gap-4 flex-wrap items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Asset Code</label>
          <input
            value={assetSearch}
            onChange={(e) => setAssetSearch(e.target.value)}
            placeholder="e.g. AST-001"
            className="border border-input rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Period (YYYY-MM)</label>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm"
          />
        </div>
        {(assetSearch || period) && (
          <button
            onClick={() => { setAssetSearch(''); setPeriod('') }}
            className="text-xs text-muted-foreground hover:text-gray-700 border border-border px-3 py-2 rounded-lg"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex gap-1 flex-wrap mb-4">
        {ALL_ACTIONS.map((a) => (
          <button key={a} onClick={() => setActionFilter(a)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${actionFilter === a ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-border hover:bg-gray-50'}`}>
            {a}
          </button>
        ))}
      </div>

      {auditQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Asset audit API not yet available. Will appear once the Asset backend module is deployed.
        </p>
      )}

      {auditQuery.isLoading && <p className="text-muted-foreground text-sm">Loading audit log…</p>}

      {!auditQuery.isLoading && !auditQuery.isError && (
        <DataTable<AuditEntry>
          columns={columns}
          data={entries}
          rowKey={(r) => r.id}
          searchableFields={['assetCode', 'assetName', 'performedBy', 'description']}
          pageSize={25}
          emptyMessage="No audit entries match the current filters."
        />
      )}
    </div>
  )
}
