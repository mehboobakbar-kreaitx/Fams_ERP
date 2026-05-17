import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'

type MfaStatus = 'Enrolled' | 'NotEnrolled' | 'Exempt'

type UserMfaRecord = {
  id: string
  userName: string
  email: string
  role: string
  campusName?: string
  mfaStatus: MfaStatus
  enrolledAt?: string
  lastUsedAt?: string
}

type MfaSummary = {
  totalUsers: number
  enrolled: number
  notEnrolled: number
  exempt: number
  coveragePercent: number
}

const STATUS_COLORS: Record<MfaStatus, string> = {
  Enrolled:    'bg-emerald-100 text-emerald-700',
  NotEnrolled: 'bg-red-100 text-red-700',
  Exempt:      'bg-gray-100 text-gray-500',
}

export default function MfaManagementPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<MfaStatus | ''>('')

  const summaryQuery = useQuery({
    queryKey: ['mfa-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<MfaSummary>('/security/mfa/summary')
      return res.data
    },
    retry: false,
  })

  const usersQuery = useQuery({
    queryKey: ['mfa-users', statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (statusFilter) params.status = statusFilter
      const res = await axiosClient.get<UserMfaRecord[]>('/security/mfa/users', { params })
      return Array.isArray(res.data) ? res.data : []
    },
    retry: false,
  })

  const forceEnrollMutation = useMutation({
    mutationFn: (userId: string) => axiosClient.patch(`/security/mfa/${userId}/force-enroll`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mfa-users'] })
      qc.invalidateQueries({ queryKey: ['mfa-summary'] })
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (userId: string) => axiosClient.patch(`/security/mfa/${userId}/revoke`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mfa-users'] })
      qc.invalidateQueries({ queryKey: ['mfa-summary'] })
    },
  })

  const s = summaryQuery.data

  const columns: Column<UserMfaRecord>[] = [
    {
      key: 'userName', header: 'User',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.userName}</p>
          <p className="text-xs text-muted-foreground">{r.email}</p>
        </div>
      ),
    },
    { key: 'role', header: 'Role', width: '160px', render: (r) => <span className="text-sm">{r.role}</span> },
    { key: 'campusName', header: 'Campus', width: '130px', render: (r) => r.campusName ?? '—' },
    {
      key: 'mfaStatus', header: 'MFA Status', width: '120px',
      render: (r) => <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[r.mfaStatus]}`}>{r.mfaStatus}</span>,
    },
    {
      key: 'enrolledAt', header: 'Enrolled', width: '110px',
      render: (r) => r.enrolledAt
        ? <span className="font-mono text-xs">{new Date(r.enrolledAt).toLocaleDateString('en-PK')}</span>
        : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      key: 'lastUsedAt', header: 'Last Used', width: '110px',
      render: (r) => r.lastUsedAt
        ? <span className="font-mono text-xs">{new Date(r.lastUsedAt).toLocaleDateString('en-PK')}</span>
        : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      key: 'id', header: 'Actions', width: '170px',
      render: (r) => (
        <div className="flex gap-1">
          {r.mfaStatus === 'NotEnrolled' && (
            <button
              type="button"
              disabled={forceEnrollMutation.isPending}
              onClick={() => forceEnrollMutation.mutate(r.id)}
              className="text-xs px-2 py-1 bg-primary-700 text-white rounded hover:bg-primary-800 disabled:opacity-50"
            >
              Force Enroll
            </button>
          )}
          {r.mfaStatus === 'Enrolled' && (
            <button
              type="button"
              disabled={revokeMutation.isPending}
              onClick={() => {
                if (confirm(`Revoke MFA for ${r.userName}?`)) revokeMutation.mutate(r.id)
              }}
              className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Revoke
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">MFA Management</h1>
        <p className="text-sm text-muted-foreground">Monitor MFA enrollment, force-enroll users and revoke authenticator access.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Total Users"    value={s?.totalUsers?.toLocaleString() ?? '—'}                                             icon="👥" />
        <KpiCard label="Enrolled"       value={s?.enrolled?.toLocaleString() ?? '—'}                                               icon="✅" />
        <KpiCard label="Not Enrolled"   value={s?.notEnrolled?.toLocaleString() ?? '—'}                                            icon="❌" />
        <KpiCard label="Exempt"         value={s?.exempt?.toLocaleString() ?? '—'}                                                  icon="⚪" />
        <KpiCard label="Coverage"       value={s ? `${s.coveragePercent.toFixed(0)}%` : '—'} icon="🔑" trend={s && s.coveragePercent >= 90 ? 'up' : 'down'} />
      </div>

      {/* Coverage bar */}
      {s && (
        <div className="bg-white border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">MFA Coverage</p>
            <p className={`text-sm font-bold ${s.coveragePercent >= 90 ? 'text-emerald-700' : s.coveragePercent >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{s.coveragePercent.toFixed(0)}%</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${s.coveragePercent >= 90 ? 'bg-emerald-500' : s.coveragePercent >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${s.coveragePercent}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{s.enrolled} of {s.totalUsers} users have MFA enabled.</p>
        </div>
      )}

      {summaryQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          MFA management API not yet available. Will appear once the Security backend module is deployed.
        </p>
      )}

      <div className="flex gap-2 mb-4">
        {(['', 'Enrolled', 'NotEnrolled', 'Exempt'] as const).map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === f ? 'bg-primary-700 text-white' : 'bg-white border border-border text-gray-700 hover:bg-gray-50'}`}>
            {f === '' ? 'All' : f === 'NotEnrolled' ? 'Not Enrolled' : f}
          </button>
        ))}
      </div>

      {!usersQuery.isLoading && !usersQuery.isError && (
        <DataTable<UserMfaRecord>
          columns={columns}
          data={usersQuery.data ?? []}
          rowKey={(r) => r.id}
          searchableFields={['userName', 'email', 'campusName', 'role']}
          pageSize={20}
          emptyMessage="No users match the current filter."
        />
      )}
    </div>
  )
}
