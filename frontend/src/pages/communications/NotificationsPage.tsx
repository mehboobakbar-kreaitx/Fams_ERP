import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'

type NotificationStatus = 'Sent' | 'Scheduled' | 'Failed' | 'Draft'
type NotificationTarget = 'All' | 'Students' | 'Staff' | 'Parents' | 'Campus' | 'Custom'
type NotificationChannel = 'InApp' | 'Push' | 'Both'

type Notification = {
  id: string
  title: string
  body: string
  target: NotificationTarget
  channel: NotificationChannel
  recipientCount: number
  readCount: number
  status: NotificationStatus
  scheduledAt?: string
  sentAt?: string
  createdBy: string
  priority: 'Normal' | 'High' | 'Critical'
}

type NotificationSummary = {
  sentToday: number
  scheduledUpcoming: number
  totalRecipients: number
  avgReadRate: number
  failedCount: number
}

const STATUS_COLORS: Record<NotificationStatus, string> = {
  Sent:      'bg-emerald-100 text-emerald-700',
  Scheduled: 'bg-blue-100 text-blue-700',
  Failed:    'bg-red-100 text-red-700',
  Draft:     'bg-gray-100 text-gray-600',
}

const PRIORITY_COLORS: Record<string, string> = {
  Normal:   'text-gray-600',
  High:     'text-amber-600 font-semibold',
  Critical: 'text-red-600 font-bold',
}

const BLANK = {
  title: '', body: '', target: 'All' as NotificationTarget,
  channel: 'InApp' as NotificationChannel, priority: 'Normal', scheduledAt: '',
}

export default function NotificationsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | 'All'>('All')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(BLANK)

  const summaryQuery = useQuery({
    queryKey: ['notification-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<NotificationSummary>('/notifications/summary')
      return res.data
    },
    retry: false,
  })

  const notificationsQuery = useQuery({
    queryKey: ['notifications', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'All' ? { status: statusFilter } : {}
      const res = await axiosClient.get<Notification[] | { items: Notification[] }>('/notifications', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const sendMutation = useMutation({
    mutationFn: (data: typeof BLANK) => axiosClient.post('/notifications/send', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notification-summary'] })
      setShowCreate(false)
      setForm(BLANK)
    },
  })

  const s = summaryQuery.data
  const notifications = notificationsQuery.data ?? []
  const STATUS_FILTERS: Array<NotificationStatus | 'All'> = ['All', 'Sent', 'Scheduled', 'Draft', 'Failed']

  const columns: Column<Notification>[] = [
    {
      key: 'title', header: 'Notification',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{r.body}</p>
        </div>
      ),
    },
    {
      key: 'priority', header: 'Priority', width: '90px',
      render: (r) => <span className={`text-xs ${PRIORITY_COLORS[r.priority]}`}>{r.priority}</span>,
    },
    { key: 'target',  header: 'Target',  width: '100px' },
    { key: 'channel', header: 'Channel', width: '90px' },
    {
      key: 'recipientCount', header: 'Recipients', width: '100px',
      render: (r) => <span className="font-semibold">{r.recipientCount.toLocaleString()}</span>,
    },
    {
      key: 'readCount', header: 'Read Rate', width: '100px',
      render: (r) => {
        if (r.status !== 'Sent' || r.recipientCount === 0) return <span className="text-muted-foreground">—</span>
        const rate = Math.round((r.readCount / r.recipientCount) * 100)
        return (
          <div>
            <p className={`font-medium ${rate >= 60 ? 'text-emerald-700' : rate >= 30 ? 'text-amber-600' : 'text-red-600'}`}>{rate}%</p>
            <p className="text-xs text-muted-foreground">{r.readCount.toLocaleString()} read</p>
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="text-sm text-muted-foreground">Send and manage push & in-app notifications to students, staff and parents.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Send Notification
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Sent Today"      value={s?.sentToday ?? '—'}                                          icon="📤" />
        <KpiCard label="Scheduled"       value={s?.scheduledUpcoming ?? '—'}                                  icon="⏰" />
        <KpiCard label="Total Recipients" value={s?.totalRecipients?.toLocaleString() ?? '—'}                 icon="👥" />
        <KpiCard label="Avg Read Rate"   value={s ? `${s.avgReadRate.toFixed(0)}%` : '—'}                    icon="👁️" trend={s && s.avgReadRate >= 50 ? 'up' : 'down'} />
      </div>

      {notificationsQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Notifications API not yet available. Will appear once the Communications backend module is deployed.
        </p>
      )}

      <div className="flex gap-2 flex-wrap mb-4">
        {STATUS_FILTERS.map((sf) => (
          <button key={sf} onClick={() => setStatusFilter(sf)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${statusFilter === sf ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-border hover:bg-gray-50'}`}>
            {sf}
          </button>
        ))}
      </div>

      {!notificationsQuery.isLoading && !notificationsQuery.isError && (
        <DataTable<Notification>
          columns={columns}
          data={notifications}
          rowKey={(r) => r.id}
          searchableFields={['title', 'body', 'target', 'createdBy']}
          pageSize={15}
          emptyMessage="No notifications sent yet."
        />
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Send Notification" size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50">Cancel</button>
            <button form="notif-form" type="submit" disabled={sendMutation.isPending}
              className="px-4 py-2 text-sm bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50">
              {sendMutation.isPending ? 'Sending…' : 'Send Now'}
            </button>
          </div>
        }>
        <form id="notif-form" onSubmit={(e) => { e.preventDefault(); sendMutation.mutate(form) }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required
              className="w-full border border-input rounded-lg px-3 py-2 text-sm" placeholder="Notification title…" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Message *</label>
            <textarea value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} required
              rows={4} className="w-full border border-input rounded-lg px-3 py-2 text-sm" placeholder="Notification body…" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Target Audience</label>
              <select value={form.target} onChange={(e) => setForm((p) => ({ ...p, target: e.target.value as NotificationTarget }))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm">
                {(['All', 'Students', 'Staff', 'Parents', 'Campus'] as const).map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Channel</label>
              <select value={form.channel} onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value as NotificationChannel }))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm">
                <option value="InApp">In-App</option>
                <option value="Push">Push</option>
                <option value="Both">Both</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm">
                <option>Normal</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Schedule (optional — leave blank to send immediately)</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          {sendMutation.isError && <p className="text-sm text-red-600">Failed to send notification.</p>}
        </form>
      </Modal>
    </div>
  )
}
