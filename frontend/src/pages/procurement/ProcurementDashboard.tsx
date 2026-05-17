import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import { formatCurrency } from '../../lib/utils'

type ProcurementSummary = {
  totalVendors: number
  activeVendors: number
  openPRs: number
  pendingApprovals: number
  openPOs: number
  totalSpendMTD: number
  totalSpendYTD: number
  pendingGRNs: number
}

const MODULES = [
  { to: '/campus/procurement/vendors',      label: 'Vendors',           icon: '🏢', desc: 'Vendor registry & approvals' },
  { to: '/campus/procurement/requests',     label: 'Purchase Requests', icon: '📋', desc: 'Create & track PRs' },
  { to: '/campus/procurement/quotations',   label: 'Quotations',        icon: '📄', desc: 'Compare vendor quotes' },
  { to: '/campus/procurement/orders',       label: 'Purchase Orders',   icon: '🛒', desc: 'PO management & tracking' },
  { to: '/campus/procurement/approvals',    label: 'Approvals',         icon: '✅', desc: 'Pending approval queue', roles: ['ProcurementOfficer', 'Principal'] },
  { to: '/campus/procurement/grn',          label: 'Goods Receiving',   icon: '📦', desc: 'GRN & delivery verification' },
  { to: '/campus/procurement/reports',      label: 'Reports',           icon: '📊', desc: 'Spend analytics & insights' },
]

export default function ProcurementDashboard() {
  const summaryQuery = useQuery({
    queryKey: ['procurement-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<ProcurementSummary>('/procurement/summary')
      return res.data
    },
    retry: false,
  })

  const s = summaryQuery.data

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Vendor & Procurement</h1>
        <p className="text-sm text-muted-foreground">
          End-to-end procurement — purchase requests, quotations, orders and goods receiving.
        </p>
      </div>

      {summaryQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          Procurement API not yet available. Will appear once the Procurement backend module is deployed.
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Active Vendors"     value={s?.activeVendors ?? '—'}             icon="🏢" />
        <KpiCard label="Open PRs"           value={s?.openPRs ?? '—'}                   icon="📋" trend={s && s.openPRs > 0 ? 'neutral' : 'up'} />
        <KpiCard label="Pending Approvals"  value={s?.pendingApprovals ?? '—'}           icon="✅" trend={s && s.pendingApprovals > 0 ? 'down' : 'up'} />
        <KpiCard label="Open POs"           value={s?.openPOs ?? '—'}                   icon="🛒" />
        <KpiCard label="Spend MTD"          value={s ? formatCurrency(s.totalSpendMTD) : '—'} icon="💰" />
        <KpiCard label="Spend YTD"          value={s ? formatCurrency(s.totalSpendYTD) : '—'} icon="💸" />
        <KpiCard label="Pending GRNs"       value={s?.pendingGRNs ?? '—'}               icon="📦" trend={s && s.pendingGRNs > 0 ? 'neutral' : 'up'} />
        <KpiCard label="Total Vendors"      value={s?.totalVendors ?? '—'}              icon="🏢" />
      </div>

      <h2 className="text-base font-semibold text-gray-800 mb-3">Procurement Modules</h2>
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
