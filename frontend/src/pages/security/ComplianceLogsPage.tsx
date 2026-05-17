import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'

type ComplianceCategory =
  | 'DataAccess'
  | 'DataExport'
  | 'BulkOperation'
  | 'PrivacyRequest'
  | 'ConfigChange'
  | 'AuditAccess'
  | 'ConsentChange'
  | 'RecordDeletion'

type ComplianceLog = {
  id: string
  timestamp: string
  category: ComplianceCategory
  actorName: string
  actorEmail?: string
  affectedEntity: string
  affectedCount?: number
  campusName?: string
  ipAddress?: string
  description: string
  dataClassification?: 'Public' | 'Internal' | 'Confidential' | 'Restricted'
  requiresReview: boolean
  reviewed: boolean
  reviewedBy?: string
}

type ComplianceSummary = {
  totalLogsThisMonth: number
  pendingReview: number
  dataExportsThisMonth: number
  privacyRequestsOpen: number
}

const CATEGORY_COLORS: Record<ComplianceCategory, string> = {
  DataAccess:      'bg-blue-100 text-blue-700',
  DataExport:      'bg-amber-100 text-amber-700',
  BulkOperation:   'bg-orange-100 text-orange-700',
  PrivacyRequest:  'bg-violet-100 text-violet-700',
  ConfigChange:    'bg-gray-100 text-gray-700',
  AuditAccess:     'bg-slate-100 text-slate-700',
  ConsentChange:   'bg-teal-100 text-teal-700',
  RecordDeletion:  'bg-red-100 text-red-700',
}

const DATA_CLASS_COLORS: Record<string, string> = {
  Public:       'bg-green-100 text-green-700',
  Internal:     'bg-blue-100 text-blue-700',
  Confidential: 'bg-amber-100 text-amber-700',
  Restricted:   'bg-red-100 text-red-700',
}

function exportComplianceCsv(rows: ComplianceLog[]) {
  const headers = ['Timestamp', 'Category', 'Actor', 'Email', 'Entity', 'Count', 'Campus', 'IP', 'Classification', 'Description', 'Requires Review', 'Reviewed']
  const lines = rows.map((r) =>
    [
      r.timestamp, r.category, r.actorName, r.actorEmail ?? '', r.affectedEntity,
      r.affectedCount?.toString() ?? '', r.campusName ?? '', r.ipAddress ?? '',
      r.dataClassification ?? '', r.description.replace(/,/g, ';'),
      r.requiresReview ? 'Yes' : 'No', r.reviewed ? 'Yes' : 'No',
    ].map((v) => `"${v}"`).join(','),
  )
  const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `compliance-logs-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ComplianceLogsPage() {
  const [categoryFilter, setCategoryFilter] = useState<ComplianceCategory | ''>('')
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'reviewed'>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const summaryQuery = useQuery({
    queryKey: ['compliance-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<ComplianceSummary>('/security/compliance/summary')
      return res.data
    },
    retry: false,
  })

  const logsQuery = useQuery({
    queryKey: ['compliance-logs', categoryFilter, reviewFilter, fromDate, toDate],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (categoryFilter) params.category = categoryFilter
      if (reviewFilter !== 'all') params.reviewed = reviewFilter === 'reviewed' ? 'true' : 'false'
      if (fromDate) params.fromDate = fromDate
      if (toDate)   params.toDate   = toDate
      const res = await axiosClient.get<ComplianceLog[]>('/security/compliance/logs', { params })
      return Array.isArray(res.data) ? res.data : []
    },
    retry: false,
  })

  const s = summaryQuery.data
  const logs = logsQuery.data ?? []

  const columns: Column<ComplianceLog>[] = [
    {
      key: 'timestamp', header: 'When', width: '130px',
      render: (r) => (
        <div>
          <p className="font-mono text-xs">{new Date(r.timestamp).toLocaleDateString('en-PK')}</p>
          <p className="font-mono text-xs text-muted-foreground">{new Date(r.timestamp).toLocaleTimeString('en-PK')}</p>
        </div>
      ),
    },
    {
      key: 'category', header: 'Category', width: '140px',
      render: (r) => <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[r.category]}`}>{r.category}</span>,
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
    {
      key: 'affectedEntity', header: 'Affected Entity',
      render: (r) => (
        <div>
          <p className="text-sm text-gray-900">{r.affectedEntity}</p>
          {r.affectedCount != null && <p className="text-xs text-muted-foreground">{r.affectedCount.toLocaleString()} records</p>}
        </div>
      ),
    },
    { key: 'campusName', header: 'Campus', width: '110px', render: (r) => r.campusName ?? '—' },
    {
      key: 'dataClassification', header: 'Classification', width: '120px',
      render: (r) => r.dataClassification
        ? <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${DATA_CLASS_COLORS[r.dataClassification] ?? 'bg-gray-100 text-gray-600'}`}>{r.dataClassification}</span>
        : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      key: 'requiresReview', header: 'Review', width: '90px',
      render: (r) => {
        if (!r.requiresReview) return <span className="text-xs text-gray-400">—</span>
        if (r.reviewed) return <span className="text-xs text-emerald-700 font-semibold">✓ Done{r.reviewedBy ? ` (${r.reviewedBy})` : ''}</span>
        return <span className="text-xs text-amber-600 font-semibold">⏳ Pending</span>
      },
    },
  ]

  const CATEGORIES: ComplianceCategory[] = ['DataAccess', 'DataExport', 'BulkOperation', 'PrivacyRequest', 'ConfigChange', 'AuditAccess', 'ConsentChange', 'RecordDeletion']

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Compliance Logs</h1>
          <p className="text-sm text-muted-foreground">Data access, export, privacy and regulatory compliance event log.</p>
        </div>
        <button type="button" disabled={logs.length === 0} onClick={() => exportComplianceCsv(logs)}
          className="text-sm px-4 py-2 bg-white border border-border rounded-lg hover:bg-gray-50 disabled:opacity-40">
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Logs This Month"     value={s?.totalLogsThisMonth?.toLocaleString() ?? '—'}   icon="📋" />
        <KpiCard label="Pending Review"      value={s?.pendingReview?.toLocaleString() ?? '—'}         icon="⏳" />
        <KpiCard label="Data Exports (MTD)"  value={s?.dataExportsThisMonth?.toLocaleString() ?? '—'} icon="📤" />
        <KpiCard label="Privacy Requests"    value={s?.privacyRequestsOpen?.toLocaleString() ?? '—'}   icon="🔒" />
      </div>

      {summaryQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Compliance logs API not yet available. Will appear once the Compliance backend module is deployed.
        </p>
      )}

      <div className="bg-white border border-border rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as ComplianceCategory | '')}
            className="border border-input rounded-lg px-3 py-2 text-sm">
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={reviewFilter} onChange={(e) => setReviewFilter(e.target.value as typeof reviewFilter)}
            className="border border-input rounded-lg px-3 py-2 text-sm">
            <option value="all">All</option>
            <option value="pending">Pending Review</option>
            <option value="reviewed">Reviewed</option>
          </select>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      {!logsQuery.isLoading && !logsQuery.isError && (
        <DataTable<ComplianceLog>
          columns={columns}
          data={logs}
          rowKey={(r) => r.id}
          searchableFields={['actorName', 'actorEmail', 'affectedEntity', 'campusName', 'category']}
          pageSize={25}
          emptyMessage="No compliance logs match the current filters."
        />
      )}
    </div>
  )
}
