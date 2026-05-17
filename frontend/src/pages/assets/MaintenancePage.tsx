import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { formatCurrency, formatDate } from '../../lib/utils'

type WorkOrderStatus = 'Scheduled' | 'InProgress' | 'Completed' | 'Overdue' | 'Cancelled'
type MaintenanceType = 'Preventive' | 'Corrective' | 'Emergency' | 'Calibration' | 'Inspection'

type WorkOrder = {
  id: string
  workOrderNumber: string
  assetId: string
  assetCode: string
  assetName: string
  maintenanceType: MaintenanceType
  title: string
  description?: string
  scheduledDate: string
  completedDate?: string
  technicianName?: string
  vendor?: string
  estimatedCost: number
  actualCost?: number
  status: WorkOrderStatus
  nextScheduledDate?: string
  notes?: string
}

type MaintenanceSummary = {
  scheduled: number
  inProgress: number
  completedThisMonth: number
  overdue: number
  totalCostMTD: number
}

const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  Scheduled:  'bg-blue-100 text-blue-700',
  InProgress: 'bg-amber-100 text-amber-700',
  Completed:  'bg-emerald-100 text-emerald-700',
  Overdue:    'bg-red-100 text-red-700',
  Cancelled:  'bg-gray-100 text-gray-500',
}

const TYPE_COLORS: Record<MaintenanceType, string> = {
  Preventive:  'bg-emerald-50 text-emerald-700',
  Corrective:  'bg-amber-50 text-amber-700',
  Emergency:   'bg-red-50 text-red-700',
  Calibration: 'bg-blue-50 text-blue-700',
  Inspection:  'bg-gray-50 text-gray-700',
}

const NEXT_ACTION: Partial<Record<WorkOrderStatus, { label: string; endpoint: string; color: string }>> = {
  Scheduled:  { label: 'Start',    endpoint: 'start',    color: 'bg-amber-500 hover:bg-amber-600 text-white' },
  InProgress: { label: 'Complete', endpoint: 'complete', color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  Overdue:    { label: 'Start',    endpoint: 'start',    color: 'bg-amber-500 hover:bg-amber-600 text-white' },
}

const BLANK = {
  assetId: '', maintenanceType: 'Preventive' as MaintenanceType,
  title: '', description: '', scheduledDate: '', technicianName: '',
  vendor: '', estimatedCost: '', notes: '',
}

export default function MaintenancePage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'All'>('All')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(BLANK)

  const summaryQuery = useQuery({
    queryKey: ['maintenance-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<MaintenanceSummary>('/assets/maintenance/summary')
      return res.data
    },
    retry: false,
  })

  const workOrdersQuery = useQuery({
    queryKey: ['work-orders', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'All' ? { status: statusFilter } : {}
      const res = await axiosClient.get<WorkOrder[] | { items: WorkOrder[] }>('/assets/maintenance', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof BLANK) => axiosClient.post('/assets/maintenance', {
      ...data,
      estimatedCost: parseFloat(data.estimatedCost) || 0,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      qc.invalidateQueries({ queryKey: ['maintenance-summary'] })
      qc.invalidateQueries({ queryKey: ['asset-summary'] })
      setShowCreate(false)
      setForm(BLANK)
    },
  })

  const transitionMutation = useMutation({
    mutationFn: ({ id, endpoint }: { id: string; endpoint: string }) =>
      axiosClient.patch(`/assets/maintenance/${id}/${endpoint}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      qc.invalidateQueries({ queryKey: ['maintenance-summary'] })
    },
  })

  const s = summaryQuery.data
  const workOrders = workOrdersQuery.data ?? []
  const STATUS_FILTERS: Array<WorkOrderStatus | 'All'> = ['All', 'Scheduled', 'InProgress', 'Completed', 'Overdue', 'Cancelled']

  const columns: Column<WorkOrder>[] = [
    {
      key: 'workOrderNumber',
      header: 'WO #',
      width: '110px',
      render: (r) => <span className="font-mono text-xs font-semibold text-primary-700">{r.workOrderNumber}</span>,
    },
    {
      key: 'title',
      header: 'Work Order',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.title}</p>
          <p className="text-xs text-muted-foreground font-mono">{r.assetCode} · {r.assetName}</p>
        </div>
      ),
    },
    {
      key: 'maintenanceType',
      header: 'Type',
      width: '110px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[r.maintenanceType]}`}>
          {r.maintenanceType}
        </span>
      ),
    },
    {
      key: 'scheduledDate',
      header: 'Scheduled',
      width: '105px',
      render: (r) => <span className="font-mono text-xs">{formatDate(r.scheduledDate)}</span>,
    },
    { key: 'technicianName', header: 'Technician', width: '130px', render: (r) => r.technicianName ?? '—' },
    {
      key: 'estimatedCost',
      header: 'Est. Cost',
      width: '110px',
      render: (r) => (
        <div>
          <p>{formatCurrency(r.estimatedCost)}</p>
          {r.actualCost != null && (
            <p className={`text-xs ${r.actualCost > r.estimatedCost ? 'text-red-600' : 'text-emerald-700'}`}>
              Actual: {formatCurrency(r.actualCost)}
            </p>
          )}
        </div>
      ),
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
      width: '100px',
      render: (r) => {
        const action = NEXT_ACTION[r.status]
        if (!action) return null
        return (
          <button
            onClick={() => transitionMutation.mutate({ id: r.id, endpoint: action.endpoint })}
            disabled={transitionMutation.isPending}
            className={`px-3 py-1 rounded-lg text-xs font-medium ${action.color} disabled:opacity-50`}
          >
            {action.label}
          </button>
        )
      },
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Maintenance</h1>
          <p className="text-sm text-muted-foreground">Schedule and track asset maintenance work orders.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + New Work Order
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Scheduled"          value={s?.scheduled ?? '—'}                           icon="📅" />
        <KpiCard label="In Progress"        value={s?.inProgress ?? '—'}                          icon="🔧" />
        <KpiCard label="Completed (MTD)"    value={s?.completedThisMonth ?? '—'}                  icon="✅" trend="up" />
        <KpiCard label="Overdue"            value={s?.overdue ?? '—'}                             icon="🚨" trend={s && s.overdue > 0 ? 'down' : 'neutral'} />
        <KpiCard label="Cost MTD"           value={s ? formatCurrency(s.totalCostMTD) : '—'}     icon="💰" />
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {STATUS_FILTERS.map((sf) => (
          <button key={sf} onClick={() => setStatusFilter(sf)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${statusFilter === sf ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-border hover:bg-gray-50'}`}>
            {sf}
          </button>
        ))}
      </div>

      {workOrdersQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Maintenance API not yet available. Will appear once the Asset backend module is deployed.
        </p>
      )}

      {!workOrdersQuery.isLoading && !workOrdersQuery.isError && (
        <DataTable<WorkOrder>
          columns={columns}
          data={workOrders}
          rowKey={(r) => r.id}
          searchableFields={['workOrderNumber', 'title', 'assetCode', 'assetName', 'technicianName']}
          pageSize={15}
          emptyMessage="No work orders found."
        />
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Work Order"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50">Cancel</button>
            <button form="wo-form" type="submit" disabled={createMutation.isPending}
              className="px-4 py-2 text-sm bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50">
              {createMutation.isPending ? 'Saving…' : 'Create Work Order'}
            </button>
          </div>
        }
      >
        <form id="wo-form" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Asset ID *</label>
            <input value={form.assetId} onChange={(e) => setForm((p) => ({ ...p, assetId: e.target.value }))} required
              placeholder="Asset Code or ID" className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required
              className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select value={form.maintenanceType} onChange={(e) => setForm((p) => ({ ...p, maintenanceType: e.target.value as MaintenanceType }))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm">
                {(['Preventive', 'Corrective', 'Emergency', 'Calibration', 'Inspection'] as const).map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Scheduled Date *</label>
              <input type="date" value={form.scheduledDate} onChange={(e) => setForm((p) => ({ ...p, scheduledDate: e.target.value }))} required
                className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Technician</label>
              <input value={form.technicianName} onChange={(e) => setForm((p) => ({ ...p, technicianName: e.target.value }))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Cost (PKR)</label>
              <input type="number" value={form.estimatedCost} onChange={(e) => setForm((p) => ({ ...p, estimatedCost: e.target.value }))}
                min={0} className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3} className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          {createMutation.isError && <p className="text-sm text-red-600">Failed to create work order.</p>}
        </form>
      </Modal>
    </div>
  )
}
