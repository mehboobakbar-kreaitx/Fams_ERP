import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'

type TicketStatus = 'Open' | 'InProgress' | 'Resolved' | 'Closed' | 'Reopened'
type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical'
type TicketCategory =
  | 'Technical'
  | 'Academic'
  | 'Finance'
  | 'HR'
  | 'Facilities'
  | 'Transport'
  | 'Hostel'
  | 'Library'
  | 'General'

type Ticket = {
  id: string
  ticketNumber: string
  subject: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  raisedBy: string
  raisedByType: 'Student' | 'Staff' | 'Parent'
  assignedTo?: string
  assignedDepartment?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  slaDeadline?: string
  commentCount: number
}

type TicketSummary = {
  open: number
  inProgress: number
  resolvedToday: number
  overdueSLA: number
  avgResolutionHours: number
  totalThisMonth: number
}

const STATUS_COLORS: Record<TicketStatus, string> = {
  Open:       'bg-red-100 text-red-700',
  InProgress: 'bg-amber-100 text-amber-700',
  Resolved:   'bg-emerald-100 text-emerald-700',
  Closed:     'bg-gray-100 text-gray-500',
  Reopened:   'bg-orange-100 text-orange-700',
}

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  Low:      'text-gray-500',
  Medium:   'text-blue-600',
  High:     'text-amber-600 font-semibold',
  Critical: 'text-red-600 font-bold',
}

const CATEGORIES: TicketCategory[] = [
  'Technical', 'Academic', 'Finance', 'HR', 'Facilities', 'Transport', 'Hostel', 'Library', 'General',
]

const BLANK = {
  subject: '', description: '', category: 'General' as TicketCategory,
  priority: 'Medium' as TicketPriority, raisedByType: 'Staff' as 'Student' | 'Staff' | 'Parent',
}

export default function SupportTicketsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'All'>('Open')
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'All'>('All')
  const [showCreate, setShowCreate] = useState(false)
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null)
  const [form, setForm] = useState(BLANK)

  const summaryQuery = useQuery({
    queryKey: ['ticket-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<TicketSummary>('/support/tickets/summary')
      return res.data
    },
    retry: false,
  })

  const ticketsQuery = useQuery({
    queryKey: ['tickets', statusFilter, categoryFilter],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (statusFilter !== 'All') params.status = statusFilter
      if (categoryFilter !== 'All') params.category = categoryFilter
      const res = await axiosClient.get<Ticket[] | { items: Ticket[] }>('/support/tickets', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof BLANK) => axiosClient.post('/support/tickets', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
      qc.invalidateQueries({ queryKey: ['ticket-summary'] })
      setShowCreate(false)
      setForm(BLANK)
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      axiosClient.patch(`/support/tickets/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
      qc.invalidateQueries({ queryKey: ['ticket-summary'] })
      setDetailTicket(null)
    },
  })

  const s = summaryQuery.data
  const tickets = ticketsQuery.data ?? []

  const STATUS_FILTERS: Array<TicketStatus | 'All'> = ['All', 'Open', 'InProgress', 'Resolved', 'Closed', 'Reopened']

  const columns: Column<Ticket>[] = [
    {
      key: 'ticketNumber',
      header: 'Ticket #',
      width: '110px',
      render: (r) => (
        <button onClick={() => setDetailTicket(r)} className="font-mono text-xs font-semibold text-primary-700 hover:underline">
          {r.ticketNumber}
        </button>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.subject}</p>
          <p className="text-xs text-muted-foreground">{r.category} · {r.raisedBy} ({r.raisedByType})</p>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      width: '90px',
      render: (r) => <span className={`text-xs ${PRIORITY_COLORS[r.priority]}`}>{r.priority}</span>,
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      width: '130px',
      render: (r) => r.assignedTo ?? <span className="text-amber-600 text-xs font-medium">Unassigned</span>,
    },
    {
      key: 'slaDeadline',
      header: 'SLA',
      width: '105px',
      render: (r) => {
        if (!r.slaDeadline) return <span className="text-muted-foreground text-xs">—</span>
        const overdue = ['Open', 'InProgress', 'Reopened'].includes(r.status) && new Date(r.slaDeadline) < new Date()
        return <span className={`font-mono text-xs ${overdue ? 'text-red-600 font-bold' : ''}`}>{formatDate(r.slaDeadline)}</span>
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      width: '105px',
      render: (r) => <span className="font-mono text-xs">{formatDate(r.createdAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '115px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status]}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'id',
      header: '',
      width: '110px',
      render: (r) => {
        if (r.status === 'Open') {
          return (
            <button
              onClick={() => updateStatusMutation.mutate({ id: r.id, status: 'InProgress' })}
              disabled={updateStatusMutation.isPending}
              className="px-3 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50"
            >
              Pick Up
            </button>
          )
        }
        if (r.status === 'InProgress') {
          return (
            <button
              onClick={() => updateStatusMutation.mutate({ id: r.id, status: 'Resolved' })}
              disabled={updateStatusMutation.isPending}
              className="px-3 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
            >
              Resolve
            </button>
          )
        }
        return null
      },
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Support Tickets</h1>
          <p className="text-sm text-muted-foreground">Campus help-desk — track and resolve issues raised by students, staff and parents.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + New Ticket
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Open"              value={s?.open ?? '—'}                                              icon="🔴" trend={s && s.open > 0 ? 'neutral' : 'up'} />
        <KpiCard label="In Progress"       value={s?.inProgress ?? '—'}                                       icon="🟡" />
        <KpiCard label="Resolved Today"    value={s?.resolvedToday ?? '—'}                                    icon="✅" trend="up" />
        <KpiCard label="SLA Overdue"       value={s?.overdueSLA ?? '—'}                                       icon="🚨" trend={s && s.overdueSLA > 0 ? 'down' : 'up'} />
      </div>

      {/* Avg resolution hint */}
      {s?.avgResolutionHours != null && (
        <p className="text-xs text-muted-foreground mb-4">
          Avg resolution time: <span className="font-medium text-gray-700">{s.avgResolutionHours.toFixed(1)} hours</span>
          &nbsp;·&nbsp; {s.totalThisMonth} tickets this month
        </p>
      )}

      {ticketsQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Support tickets API not yet available. Will appear once the Communications backend module is deployed.
        </p>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap mb-4">
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((sf) => (
            <button key={sf} onClick={() => setStatusFilter(sf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${statusFilter === sf ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-border hover:bg-gray-50'}`}>
              {sf}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['All', ...CATEGORIES] as const).map((c) => (
            <button key={c} onClick={() => setCategoryFilter(c as TicketCategory | 'All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${categoryFilter === c ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-border hover:bg-gray-50'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {!ticketsQuery.isLoading && !ticketsQuery.isError && (
        <DataTable<Ticket>
          columns={columns}
          data={tickets}
          rowKey={(r) => r.id}
          searchableFields={['ticketNumber', 'subject', 'raisedBy', 'assignedTo', 'category']}
          pageSize={20}
          emptyMessage="No tickets in this queue."
        />
      )}

      {/* Detail modal */}
      <Modal open={!!detailTicket} onClose={() => setDetailTicket(null)} title={`Ticket ${detailTicket?.ticketNumber ?? ''}`} size="lg">
        {detailTicket && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-muted-foreground">Subject:</span> <span className="font-medium">{detailTicket.subject}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[detailTicket.status]}`}>{detailTicket.status}</span></div>
              <div><span className="text-muted-foreground">Category:</span> {detailTicket.category}</div>
              <div><span className="text-muted-foreground">Priority:</span> <span className={PRIORITY_COLORS[detailTicket.priority]}>{detailTicket.priority}</span></div>
              <div><span className="text-muted-foreground">Raised By:</span> {detailTicket.raisedBy} ({detailTicket.raisedByType})</div>
              <div><span className="text-muted-foreground">Assigned:</span> {detailTicket.assignedTo ?? 'Unassigned'}</div>
              <div><span className="text-muted-foreground">Created:</span> {formatDate(detailTicket.createdAt)}</div>
              {detailTicket.slaDeadline && <div><span className="text-muted-foreground">SLA:</span> {formatDate(detailTicket.slaDeadline)}</div>}
              {detailTicket.resolvedAt && <div><span className="text-muted-foreground">Resolved:</span> {formatDate(detailTicket.resolvedAt)}</div>}
              <div><span className="text-muted-foreground">Comments:</span> {detailTicket.commentCount}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Description</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{detailTicket.description}</p>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              {detailTicket.status === 'Open' && (
                <button onClick={() => updateStatusMutation.mutate({ id: detailTicket.id, status: 'InProgress' })}
                  disabled={updateStatusMutation.isPending}
                  className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50">
                  Pick Up
                </button>
              )}
              {detailTicket.status === 'InProgress' && (
                <button onClick={() => updateStatusMutation.mutate({ id: detailTicket.id, status: 'Resolved' })}
                  disabled={updateStatusMutation.isPending}
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                  Mark Resolved
                </button>
              )}
              {detailTicket.status === 'Resolved' && (
                <button onClick={() => updateStatusMutation.mutate({ id: detailTicket.id, status: 'Closed' })}
                  disabled={updateStatusMutation.isPending}
                  className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50">
                  Close Ticket
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create ticket modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Support Ticket" size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50">Cancel</button>
            <button form="ticket-form" type="submit" disabled={createMutation.isPending}
              className="px-4 py-2 text-sm bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50">
              {createMutation.isPending ? 'Saving…' : 'Create Ticket'}
            </button>
          </div>
        }>
        <form id="ticket-form" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Subject *</label>
            <input value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} required
              className="w-full border border-input rounded-lg px-3 py-2 text-sm" placeholder="Brief description of the issue…" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as TicketCategory }))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as TicketPriority }))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm">
                {(['Low', 'Medium', 'High', 'Critical'] as const).map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Raised By</label>
              <select value={form.raisedByType} onChange={(e) => setForm((p) => ({ ...p, raisedByType: e.target.value as 'Student' | 'Staff' | 'Parent' }))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm">
                <option value="Staff">Staff</option>
                <option value="Student">Student</option>
                <option value="Parent">Parent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required
              rows={5} className="w-full border border-input rounded-lg px-3 py-2 text-sm"
              placeholder="Detailed description of the issue, steps to reproduce, expected vs actual behaviour…" />
          </div>
          {createMutation.isError && <p className="text-sm text-red-600">Failed to create ticket.</p>}
        </form>
      </Modal>
    </div>
  )
}
