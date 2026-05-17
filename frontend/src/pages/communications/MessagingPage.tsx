import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'

type CampaignStatus = 'Draft' | 'Queued' | 'Sending' | 'Sent' | 'Failed' | 'Cancelled'
type CampaignType = 'SMS' | 'Email'
type Audience = 'All' | 'Students' | 'Staff' | 'Parents' | 'FeeDefaulters' | 'Custom'

type Campaign = {
  id: string
  campaignName: string
  type: CampaignType
  audience: Audience
  subject?: string
  message: string
  recipientCount: number
  deliveredCount: number
  failedCount: number
  status: CampaignStatus
  scheduledAt?: string
  sentAt?: string
  createdBy: string
  cost?: number
}

type MessagingSummary = {
  smsSentThisMonth: number
  emailsSentThisMonth: number
  totalCampaigns: number
  deliveryRate: number
  smsBalance?: number
}

const STATUS_COLORS: Record<CampaignStatus, string> = {
  Draft:     'bg-gray-100 text-gray-600',
  Queued:    'bg-blue-100 text-blue-700',
  Sending:   'bg-amber-100 text-amber-700',
  Sent:      'bg-emerald-100 text-emerald-700',
  Failed:    'bg-red-100 text-red-700',
  Cancelled: 'bg-gray-100 text-gray-500',
}

const BLANK_SMS = { campaignName: '', audience: 'All' as Audience, message: '', scheduledAt: '' }
const BLANK_EMAIL = { campaignName: '', audience: 'All' as Audience, subject: '', message: '', scheduledAt: '' }

type Tab = 'sms' | 'email'

export default function MessagingPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('sms')
  const [showCreate, setShowCreate] = useState(false)
  const [smsForm, setSmsForm] = useState(BLANK_SMS)
  const [emailForm, setEmailForm] = useState(BLANK_EMAIL)

  const summaryQuery = useQuery({
    queryKey: ['messaging-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<MessagingSummary>('/messaging/summary')
      return res.data
    },
    retry: false,
  })

  const campaignsQuery = useQuery({
    queryKey: ['campaigns', activeTab],
    queryFn: async () => {
      const res = await axiosClient.get<Campaign[] | { items: Campaign[] }>('/messaging/campaigns', { params: { type: activeTab.toUpperCase() } })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const smsMutation = useMutation({
    mutationFn: (data: typeof BLANK_SMS) => axiosClient.post('/messaging/campaigns/sms', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      qc.invalidateQueries({ queryKey: ['messaging-summary'] })
      setShowCreate(false)
      setSmsForm(BLANK_SMS)
    },
  })

  const emailMutation = useMutation({
    mutationFn: (data: typeof BLANK_EMAIL) => axiosClient.post('/messaging/campaigns/email', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      qc.invalidateQueries({ queryKey: ['messaging-summary'] })
      setShowCreate(false)
      setEmailForm(BLANK_EMAIL)
    },
  })

  const s = summaryQuery.data
  const campaigns = campaignsQuery.data ?? []

  const columns: Column<Campaign>[] = [
    {
      key: 'campaignName', header: 'Campaign',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.campaignName}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{r.message}</p>
        </div>
      ),
    },
    { key: 'audience', header: 'Audience', width: '110px' },
    {
      key: 'recipientCount', header: 'Recipients', width: '100px',
      render: (r) => <span className="font-semibold">{r.recipientCount.toLocaleString()}</span>,
    },
    {
      key: 'deliveredCount', header: 'Delivered', width: '100px',
      render: (r) => {
        if (r.status !== 'Sent' && r.status !== 'Sending') return <span className="text-muted-foreground">—</span>
        const rate = r.recipientCount > 0 ? Math.round((r.deliveredCount / r.recipientCount) * 100) : 0
        return (
          <div>
            <p className={`font-medium ${rate >= 90 ? 'text-emerald-700' : rate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{rate}%</p>
            <p className="text-xs text-muted-foreground">{r.deliveredCount.toLocaleString()}</p>
          </div>
        )
      },
    },
    {
      key: 'sentAt', header: 'Sent / Scheduled', width: '130px',
      render: (r) => r.sentAt
        ? <span className="font-mono text-xs">{formatDate(r.sentAt)}</span>
        : r.scheduledAt
          ? <span className="font-mono text-xs text-blue-600">{formatDate(r.scheduledAt)}</span>
          : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      key: 'status', header: 'Status', width: '110px',
      render: (r) => <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status]}`}>{r.status}</span>,
    },
  ]

  const AUDIENCES: Audience[] = ['All', 'Students', 'Staff', 'Parents', 'FeeDefaulters']

  function selectField(label: string, value: string, onChange: (v: string) => void, options: string[]) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm">
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">SMS & Email Messaging</h1>
          <p className="text-sm text-muted-foreground">Create and send bulk SMS and email campaigns to any audience segment.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + New Campaign
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="SMS Sent (MTD)"    value={s?.smsSentThisMonth?.toLocaleString() ?? '—'}   icon="💬" />
        <KpiCard label="Emails Sent (MTD)" value={s?.emailsSentThisMonth?.toLocaleString() ?? '—'} icon="📧" />
        <KpiCard label="Delivery Rate"     value={s ? `${s.deliveryRate.toFixed(0)}%` : '—'}       icon="📤" trend={s && s.deliveryRate >= 90 ? 'up' : 'neutral'} />
        <KpiCard label="SMS Balance"       value={s?.smsBalance?.toLocaleString() ?? '—'}          icon="💳" />
      </div>

      {campaignsQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Messaging API not yet available. Will appear once the Communications backend module is deployed.
        </p>
      )}

      <div className="flex gap-1 mb-4">
        {(['sms', 'email'] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium uppercase ${activeTab === t ? 'bg-primary-700 text-white' : 'bg-white border border-border text-gray-700 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {!campaignsQuery.isLoading && !campaignsQuery.isError && (
        <DataTable<Campaign>
          columns={columns}
          data={campaigns}
          rowKey={(r) => r.id}
          searchableFields={['campaignName', 'audience', 'message']}
          pageSize={15}
          emptyMessage={`No ${activeTab.toUpperCase()} campaigns yet.`}
        />
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={`New ${activeTab.toUpperCase()} Campaign`} size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50">Cancel</button>
            <button form="campaign-form" type="submit"
              disabled={activeTab === 'sms' ? smsMutation.isPending : emailMutation.isPending}
              className="px-4 py-2 text-sm bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50">
              {(activeTab === 'sms' ? smsMutation.isPending : emailMutation.isPending) ? 'Sending…' : 'Send Campaign'}
            </button>
          </div>
        }>
        {activeTab === 'sms' ? (
          <form id="campaign-form" onSubmit={(e) => { e.preventDefault(); smsMutation.mutate(smsForm) }} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Campaign Name *</label>
              <input value={smsForm.campaignName} onChange={(e) => setSmsForm((p) => ({ ...p, campaignName: e.target.value }))} required
                className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
            {selectField('Audience', smsForm.audience, (v) => setSmsForm((p) => ({ ...p, audience: v as Audience })), AUDIENCES)}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Message * <span className="text-muted-foreground font-normal">({smsForm.message.length}/160)</span></label>
              <textarea value={smsForm.message} onChange={(e) => setSmsForm((p) => ({ ...p, message: e.target.value }))} required
                maxLength={480} rows={4} className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Schedule (optional)</label>
              <input type="datetime-local" value={smsForm.scheduledAt} onChange={(e) => setSmsForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
            {smsMutation.isError && <p className="text-sm text-red-600">Failed to send SMS campaign.</p>}
          </form>
        ) : (
          <form id="campaign-form" onSubmit={(e) => { e.preventDefault(); emailMutation.mutate(emailForm) }} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Campaign Name *</label>
              <input value={emailForm.campaignName} onChange={(e) => setEmailForm((p) => ({ ...p, campaignName: e.target.value }))} required
                className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
            {selectField('Audience', emailForm.audience, (v) => setEmailForm((p) => ({ ...p, audience: v as Audience })), AUDIENCES)}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Subject *</label>
              <input value={emailForm.subject ?? ''} onChange={(e) => setEmailForm((p) => ({ ...p, subject: e.target.value }))} required
                className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email Body *</label>
              <textarea value={emailForm.message} onChange={(e) => setEmailForm((p) => ({ ...p, message: e.target.value }))} required
                rows={6} className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Schedule (optional)</label>
              <input type="datetime-local" value={emailForm.scheduledAt} onChange={(e) => setEmailForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
            {emailMutation.isError && <p className="text-sm text-red-600">Failed to send email campaign.</p>}
          </form>
        )}
      </Modal>
    </div>
  )
}
