import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'

type SubscriptionPlan = 'Free' | 'Basic' | 'Professional' | 'Enterprise'
type SubscriptionStatus = 'Trial' | 'Active' | 'PastDue' | 'Suspended' | 'Cancelled'

type SchoolSubscription = {
  id: string
  schoolId: string
  schoolName: string
  schoolCode: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  trialEndsAt?: string
  periodStart?: string
  periodEnd?: string
  maxCampuses: number
  currentCampuses: number
  maxStudentsPerCampus: number
  totalStudents: number
  monthlyFeeUsd: number
  externalSubscriptionId?: string
  isActive: boolean
}

type SubscriptionSummary = {
  totalSchools: number
  activeSubscriptions: number
  trialSubscriptions: number
  pastDueSubscriptions: number
  mrr: number
}

const PLAN_COLORS: Record<SubscriptionPlan, string> = {
  Free:         'bg-gray-100 text-gray-600',
  Basic:        'bg-blue-100 text-blue-700',
  Professional: 'bg-violet-100 text-violet-700',
  Enterprise:   'bg-amber-100 text-amber-700',
}

const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  Trial:     'bg-cyan-100 text-cyan-700',
  Active:    'bg-emerald-100 text-emerald-700',
  PastDue:   'bg-red-100 text-red-700',
  Suspended: 'bg-orange-100 text-orange-700',
  Cancelled: 'bg-gray-100 text-gray-500',
}

const PLAN_LIMITS: Record<SubscriptionPlan, { campuses: number; students: number; fee: number }> = {
  Free:         { campuses: 1,            students: 200,            fee: 0   },
  Basic:        { campuses: 3,            students: 500,            fee: 49  },
  Professional: { campuses: 10,           students: 2000,           fee: 149 },
  Enterprise:   { campuses: 999,          students: 999999,         fee: 499 },
}

function QuotaBar({ used, max, label }: { used: number; max: number; label: string }) {
  const pct = max > 0 && max < 999999 ? Math.min((used / max) * 100, 100) : (used > 0 ? 50 : 0)
  const color = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
  const unlimited = max >= 999999
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
          <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${unlimited ? 30 : pct}%` }} />
        </div>
        <span className="text-xs font-mono w-20 text-right text-gray-600">
          {used} / {unlimited ? '∞' : max}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export default function SubscriptionPage() {
  const qc = useQueryClient()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [selectedSub, setSelectedSub] = useState<SchoolSubscription | null>(null)
  const [newPlan, setNewPlan] = useState<SubscriptionPlan>('Professional')
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | ''>('')

  const summaryQuery = useQuery({
    queryKey: ['subscription-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<SubscriptionSummary>('/subscriptions/summary')
      return res.data
    },
    retry: false,
  })

  const subsQuery = useQuery({
    queryKey: ['subscriptions', statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (statusFilter) params.status = statusFilter
      const res = await axiosClient.get<SchoolSubscription[]>('/subscriptions', { params })
      return Array.isArray(res.data) ? res.data : []
    },
    retry: false,
  })

  const upgradeMutation = useMutation({
    mutationFn: (payload: { schoolId: string; plan: SubscriptionPlan }) =>
      axiosClient.patch(`/subscriptions/${payload.schoolId}/upgrade`, { plan: payload.plan }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] })
      qc.invalidateQueries({ queryKey: ['subscription-summary'] })
      setShowUpgrade(false)
      setSelectedSub(null)
    },
  })

  const suspendMutation = useMutation({
    mutationFn: (schoolId: string) => axiosClient.patch(`/subscriptions/${schoolId}/suspend`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] })
      qc.invalidateQueries({ queryKey: ['subscription-summary'] })
    },
  })

  const reactivateMutation = useMutation({
    mutationFn: (schoolId: string) => axiosClient.patch(`/subscriptions/${schoolId}/reactivate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] })
      qc.invalidateQueries({ queryKey: ['subscription-summary'] })
    },
  })

  const s = summaryQuery.data
  const subs = subsQuery.data ?? []

  const daysRemaining = (dateStr?: string) => {
    if (!dateStr) return null
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
    return diff
  }

  const columns: Column<SchoolSubscription>[] = [
    {
      key: 'schoolName', header: 'School',
      render: (r) => (
        <div>
          <p className="font-semibold text-gray-900">{r.schoolName}</p>
          <p className="text-xs text-muted-foreground font-mono">{r.schoolCode}</p>
        </div>
      ),
    },
    {
      key: 'plan', header: 'Plan', width: '120px',
      render: (r) => <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${PLAN_COLORS[r.plan]}`}>{r.plan}</span>,
    },
    {
      key: 'status', header: 'Status', width: '110px',
      render: (r) => {
        const days = r.status === 'Trial' ? daysRemaining(r.trialEndsAt) : null
        return (
          <div>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status]}`}>{r.status}</span>
            {days !== null && <p className={`text-xs mt-0.5 ${days <= 7 ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>{days}d left</p>}
          </div>
        )
      },
    },
    {
      key: 'currentCampuses', header: 'Campus Quota', width: '170px',
      render: (r) => <QuotaBar used={r.currentCampuses} max={r.maxCampuses} label="campuses" />,
    },
    {
      key: 'totalStudents', header: 'Student Quota', width: '170px',
      render: (r) => <QuotaBar used={r.totalStudents} max={r.maxStudentsPerCampus} label="total students" />,
    },
    {
      key: 'monthlyFeeUsd', header: 'MRR', width: '90px',
      render: (r) => <span className="font-mono font-semibold text-sm">{r.monthlyFeeUsd > 0 ? `$${r.monthlyFeeUsd}` : 'Free'}</span>,
    },
    {
      key: 'periodEnd', header: 'Renews', width: '110px',
      render: (r) => r.periodEnd
        ? <span className="font-mono text-xs">{formatDate(r.periodEnd)}</span>
        : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      key: 'id', header: 'Actions', width: '190px',
      render: (r) => (
        <div className="flex gap-1 flex-wrap">
          <button type="button"
            onClick={() => { setSelectedSub(r); setNewPlan(r.plan); setShowUpgrade(true) }}
            className="text-xs px-2 py-1 bg-primary-700 text-white rounded hover:bg-primary-800">
            Upgrade
          </button>
          {r.status === 'Active' && (
            <button type="button"
              disabled={suspendMutation.isPending}
              onClick={() => { if (confirm(`Suspend ${r.schoolName}?`)) suspendMutation.mutate(r.schoolId) }}
              className="text-xs px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50">
              Suspend
            </button>
          )}
          {(r.status === 'Suspended' || r.status === 'PastDue') && (
            <button type="button"
              disabled={reactivateMutation.isPending}
              onClick={() => reactivateMutation.mutate(r.schoolId)}
              className="text-xs px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50">
              Reactivate
            </button>
          )}
        </div>
      ),
    },
  ]

  const PLANS: SubscriptionPlan[] = ['Free', 'Basic', 'Professional', 'Enterprise']

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">Manage school subscription plans, quotas and billing status.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Total Schools"    value={s?.totalSchools?.toLocaleString() ?? '—'}                          icon="🏛️" />
        <KpiCard label="Active"           value={s?.activeSubscriptions?.toLocaleString() ?? '—'}                   icon="✅" />
        <KpiCard label="On Trial"         value={s?.trialSubscriptions?.toLocaleString() ?? '—'}                    icon="⏳" />
        <KpiCard label="Past Due"         value={s?.pastDueSubscriptions?.toLocaleString() ?? '—'}                   icon="⚠️" />
        <KpiCard label="MRR"              value={s?.mrr != null ? `$${s.mrr.toLocaleString()}` : '—'}               icon="💵" trend={s && s.mrr > 0 ? 'up' : 'neutral'} />
      </div>

      {summaryQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Subscription API not yet available. Will appear once the billing backend module is deployed.
        </p>
      )}

      {/* Plan tier overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {PLANS.map((plan) => {
          const limits = PLAN_LIMITS[plan]
          const count = subs.filter((s) => s.plan === plan).length
          return (
            <div key={plan} className={`rounded-xl border p-4 ${PLAN_COLORS[plan].includes('gray') ? 'border-gray-200 bg-gray-50' : 'border-current/20 bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PLAN_COLORS[plan]}`}>{plan}</span>
                <span className="text-lg font-bold text-gray-900">{subs.length > 0 ? count : '—'}</span>
              </div>
              <p className="text-xs text-muted-foreground">{limits.campuses < 999 ? `${limits.campuses} campuses` : 'Unlimited'}</p>
              <p className="text-xs text-muted-foreground">{limits.students < 999999 ? `${limits.students.toLocaleString()} students/campus` : 'Unlimited'}</p>
              <p className="text-xs font-semibold text-gray-700 mt-1">{limits.fee > 0 ? `$${limits.fee}/mo` : 'Free'}</p>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2 mb-4">
        {(['', 'Trial', 'Active', 'PastDue', 'Suspended', 'Cancelled'] as const).map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusFilter === f ? 'bg-primary-700 text-white' : 'bg-white border border-border text-gray-700 hover:bg-gray-50'}`}>
            {f === '' ? 'All' : f === 'PastDue' ? 'Past Due' : f}
          </button>
        ))}
      </div>

      {!subsQuery.isLoading && !subsQuery.isError && (
        <DataTable<SchoolSubscription>
          columns={columns}
          data={subs}
          rowKey={(r) => r.id}
          searchableFields={['schoolName', 'schoolCode']}
          pageSize={20}
          emptyMessage="No subscriptions match the current filter."
        />
      )}

      {/* Upgrade Plan Modal */}
      <Modal
        open={showUpgrade}
        onClose={() => { setShowUpgrade(false); setSelectedSub(null) }}
        title={`Change Plan — ${selectedSub?.schoolName ?? ''}`}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowUpgrade(false); setSelectedSub(null) }}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              disabled={upgradeMutation.isPending || newPlan === selectedSub?.plan}
              onClick={() => { if (selectedSub) upgradeMutation.mutate({ schoolId: selectedSub.schoolId, plan: newPlan }) }}
              className="px-4 py-2 text-sm bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50">
              {upgradeMutation.isPending ? 'Saving…' : 'Confirm Change'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {selectedSub && (
            <div className="bg-gray-50 border border-border rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">Current plan</p>
              <p className="font-semibold">{selectedSub.plan} — {STATUS_COLORS[selectedSub.status] ? selectedSub.status : '—'}</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">New Plan</label>
            <div className="space-y-2">
              {PLANS.map((plan) => {
                const limits = PLAN_LIMITS[plan]
                return (
                  <label key={plan} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${newPlan === plan ? 'border-primary-600 bg-primary-50' : 'border-border hover:bg-gray-50'}`}>
                    <input type="radio" name="plan" value={plan} checked={newPlan === plan} onChange={() => setNewPlan(plan)} className="accent-primary-700" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_COLORS[plan]}`}>{plan}</span>
                        <span className="text-sm font-semibold text-gray-900">{limits.fee > 0 ? `$${limits.fee}/mo` : 'Free'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {limits.campuses < 999 ? `${limits.campuses} campuses` : 'Unlimited campuses'} ·{' '}
                        {limits.students < 999999 ? `${limits.students.toLocaleString()} students/campus` : 'Unlimited students'}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
          {upgradeMutation.isError && <p className="text-sm text-red-600">Failed to update subscription. Please try again.</p>}
        </div>
      </Modal>
    </div>
  )
}
