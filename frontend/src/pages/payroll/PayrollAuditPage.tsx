import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatDate } from '../../lib/utils'

type AuditEntry = {
  id: string
  action: string
  entity: string
  entityId: string
  performedBy: string
  performedAt: string
  period?: string
  previousValue?: string
  newValue?: string
  ipAddress?: string
}

const ACTION_COLORS: Record<string, string> = {
  Created: 'bg-blue-100 text-blue-700',
  Submitted: 'bg-amber-100 text-amber-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Disbursed: 'bg-primary-100 text-primary-700',
  Rejected: 'bg-red-100 text-red-700',
  Modified: 'bg-gray-100 text-gray-700',
}

const ACTIONS = ['All', 'Created', 'Submitted', 'Approved', 'Disbursed', 'Rejected', 'Modified']

export default function PayrollAuditPage() {
  const [actionFilter, setActionFilter] = useState('All')
  const [period, setPeriod] = useState('')

  const auditQuery = useQuery({
    queryKey: ['payroll-audit', actionFilter, period],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (actionFilter !== 'All') params.action = actionFilter
      if (period) params.period = period
      const res = await axiosClient.get<AuditEntry[] | { items: AuditEntry[] }>('/payroll/audit', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const entries = auditQuery.data ?? []

  const columns: Column<AuditEntry>[] = [
    {
      key: 'performedAt',
      header: 'Timestamp',
      width: '130px',
      render: (r) => <span className="font-mono text-xs">{formatDate(r.performedAt)}</span>,
    },
    {
      key: 'action',
      header: 'Action',
      width: '110px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[r.action] ?? 'bg-gray-100 text-gray-700'}`}>
          {r.action}
        </span>
      ),
    },
    { key: 'entity', header: 'Entity', width: '120px' },
    { key: 'period', header: 'Period', width: '90px', render: (r) => r.period ?? '—' },
    {
      key: 'performedBy',
      header: 'Performed By',
      render: (r) => <span className="font-medium">{r.performedBy}</span>,
    },
    {
      key: 'previousValue',
      header: 'Change',
      render: (r) =>
        r.previousValue || r.newValue ? (
          <div className="text-xs">
            {r.previousValue && <span className="line-through text-red-500 mr-1">{r.previousValue}</span>}
            {r.newValue && <span className="text-emerald-700">{r.newValue}</span>}
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    { key: 'ipAddress', header: 'IP', width: '120px', render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.ipAddress ?? '—'}</span> },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Payroll Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          Immutable record of all payroll actions — who did what, and when.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Pay Period</label>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="All periods"
            className="border border-input rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <span className="text-xs font-medium text-gray-600 self-center mr-1">Action:</span>
          {ACTIONS.map((a) => (
            <button
              key={a}
              onClick={() => setActionFilter(a)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                actionFilter === a
                  ? 'bg-primary-700 text-white border-primary-700'
                  : 'bg-white text-gray-700 border-border hover:bg-gray-50'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {auditQuery.isLoading && <p className="text-muted-foreground">Loading audit log…</p>}
      {auditQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
          Payroll audit API not yet available. Will appear once the Payroll backend module is deployed.
        </p>
      )}
      {!auditQuery.isLoading && !auditQuery.isError && (
        <DataTable<AuditEntry>
          columns={columns}
          data={entries}
          rowKey={(r) => r.id}
          searchableFields={['action', 'entity', 'performedBy', 'period']}
          pageSize={20}
          emptyMessage="No audit entries found."
        />
      )}
    </div>
  )
}
