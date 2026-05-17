import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatDate } from '../../lib/utils'

type Certificate = {
  id: string
  certificateNumber: string
  studentName: string
  rollNumber: string
  certificateType: string
  issuedDate?: string
  status: 'Pending' | 'Issued' | 'Cancelled'
  requestedBy?: string
}

type CertSummary = {
  totalIssued: number
  pendingRequests: number
  issuedThisMonth: number
  cancelledCount: number
}

const CERT_TYPES = ['All', 'Degree', 'Transcript', 'Bonafide', 'Character', 'Migration', 'Provisional']

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Issued: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-700',
}

export default function CertificatesPage() {
  const [typeFilter, setTypeFilter] = useState('All')

  const summaryQuery = useQuery({
    queryKey: ['certs-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<CertSummary>('/certificates/summary')
      return res.data
    },
    retry: false,
  })

  const certsQuery = useQuery({
    queryKey: ['certificates', typeFilter],
    queryFn: async () => {
      const params = typeFilter !== 'All' ? { type: typeFilter } : {}
      const res = await axiosClient.get<Certificate[] | { items: Certificate[] }>('/certificates', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const summary = summaryQuery.data
  const certs = certsQuery.data ?? []

  const columns: Column<Certificate>[] = [
    {
      key: 'certificateNumber',
      header: 'Cert #',
      width: '130px',
      render: (r) => <span className="font-mono text-sm">{r.certificateNumber}</span>,
    },
    {
      key: 'studentName',
      header: 'Student',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.studentName}</p>
          <p className="text-xs text-muted-foreground">{r.rollNumber}</p>
        </div>
      ),
    },
    {
      key: 'certificateType',
      header: 'Type',
      render: (r) => (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
          {r.certificateType}
        </span>
      ),
    },
    {
      key: 'issuedDate',
      header: 'Issue Date',
      width: '110px',
      render: (r) => (r.issuedDate ? formatDate(r.issuedDate) : '—'),
    },
    { key: 'requestedBy', header: 'Requested By', render: (r) => r.requestedBy ?? '—' },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'id',
      header: '',
      width: '80px',
      render: (r) =>
        r.status === 'Pending' ? (
          <button className="text-xs text-primary-700 hover:underline font-medium">Issue</button>
        ) : r.status === 'Issued' ? (
          <button className="text-xs text-gray-500 hover:underline">Print</button>
        ) : null,
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Certificates</h1>
          <p className="text-sm text-muted-foreground">Manage certificate requests, issuance and record-keeping.</p>
        </div>
        <button className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + New Request
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Issued" value={summary?.totalIssued ?? '—'} icon="🎓" />
        <KpiCard label="Pending" value={summary?.pendingRequests ?? '—'} icon="⏳" trend={summary && summary.pendingRequests > 0 ? 'down' : 'neutral'} />
        <KpiCard label="Issued This Month" value={summary?.issuedThisMonth ?? '—'} icon="📋" />
        <KpiCard label="Cancelled" value={summary?.cancelledCount ?? '—'} icon="❌" />
      </div>

      <div className="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-2 items-center">
        <span className="text-xs font-medium text-gray-600 mr-1">Filter by type:</span>
        {CERT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border ${
              typeFilter === t
                ? 'bg-primary-700 text-white border-primary-700'
                : 'bg-white text-gray-700 border-border hover:bg-gray-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {certsQuery.isLoading && <p className="text-muted-foreground">Loading certificates…</p>}
      {certsQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
          Certificate data is not yet available from the API. This module will be active once the Certificates
          backend is deployed.
        </p>
      )}
      {!certsQuery.isLoading && !certsQuery.isError && (
        <DataTable<Certificate>
          columns={columns}
          data={certs}
          rowKey={(r) => r.id}
          searchableFields={['studentName', 'rollNumber', 'certificateNumber', 'certificateType']}
          pageSize={15}
          emptyMessage="No certificate requests yet."
        />
      )}
    </div>
  )
}
