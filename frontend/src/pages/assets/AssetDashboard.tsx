import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import { formatCurrency } from '../../lib/utils'

type AssetSummary = {
  totalAssets: number
  activeAssets: number
  underMaintenance: number
  disposed: number
  totalBookValue: number
  lowStockItems: number
  pendingTransfers: number
  overdueMaintenanceCount: number
}

const MODULES = [
  { to: '/campus/assets/registry',    label: 'Asset Registry',    icon: '🗂️',  desc: 'Full asset register & lifecycle' },
  { to: '/campus/assets/assignments', label: 'Assignments',        icon: '👤',  desc: 'Assign assets to staff / dept' },
  { to: '/campus/assets/maintenance', label: 'Maintenance',        icon: '🔧',  desc: 'Work orders & service history' },
  { to: '/campus/assets/depreciation',label: 'Depreciation',       icon: '📉',  desc: 'Book value & depreciation schedule' },
  { to: '/campus/assets/inventory',   label: 'Inventory Stock',    icon: '📦',  desc: 'Stock levels & reorder alerts' },
  { to: '/campus/assets/transfers',   label: 'Transfers',          icon: '🔄',  desc: 'Inter-dept / inter-campus transfers' },
  { to: '/campus/assets/audit',       label: 'Audit Logs',         icon: '🔒',  desc: 'Immutable asset event history' },
]

export default function AssetDashboard() {
  const summaryQuery = useQuery({
    queryKey: ['asset-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<AssetSummary>('/assets/summary', {
        headers: { 'x-skip-error-toast': '1' },
        timeout: 15_000,
      })
      return res.data
    },
    retry: false,
  })

  const s = summaryQuery.data

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Asset & Inventory Management</h1>
        <p className="text-sm text-muted-foreground">
          Full asset lifecycle — registry, assignments, maintenance, depreciation and stock control.
        </p>
      </div>

      {summaryQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          Asset API not yet available. Will appear once the Asset backend module is deployed.
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Assets"       value={s?.totalAssets ?? '—'}                          icon="🗂️" />
        <KpiCard label="Active"             value={s?.activeAssets ?? '—'}                         icon="✅" trend="up" />
        <KpiCard label="Under Maintenance"  value={s?.underMaintenance ?? '—'}                     icon="🔧" trend={s && s.underMaintenance > 0 ? 'neutral' : 'up'} />
        <KpiCard label="Total Book Value"   value={s ? formatCurrency(s.totalBookValue) : '—'}    icon="💰" />
        <KpiCard label="Low Stock Items"    value={s?.lowStockItems ?? '—'}                        icon="⚠️" trend={s && s.lowStockItems > 0 ? 'down' : 'up'} />
        <KpiCard label="Pending Transfers"  value={s?.pendingTransfers ?? '—'}                     icon="🔄" />
        <KpiCard label="Overdue Maint."     value={s?.overdueMaintenanceCount ?? '—'}              icon="🚨" trend={s && s.overdueMaintenanceCount > 0 ? 'down' : 'up'} />
        <KpiCard label="Disposed"           value={s?.disposed ?? '—'}                             icon="🗑️" />
      </div>

      <h2 className="text-base font-semibold text-gray-800 mb-3">Asset Modules</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MODULES.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className="bg-white rounded-xl border border-border p-5 hover:border-primary-400 hover:shadow-sm transition-all group"
          >
            <div className="text-3xl mb-3">{m.icon}</div>
            <p className="font-semibold text-gray-900 group-hover:text-primary-700">{m.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
