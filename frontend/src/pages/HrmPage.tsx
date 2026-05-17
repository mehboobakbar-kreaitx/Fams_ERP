import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../api/axiosClient'
import KpiCard from '../components/ui/KpiCard'

type Analytics = {
  totalStaff: number
  activeStaff: number
  onLeaveToday: number
  attritionRate: number
  pendingLeaveRequests?: number
  expiringContracts?: number
  openPositions?: number
  pendingReviews?: number
}

const QUICK_LINKS = [
  { to: '/campus/hrm/departments',     label: 'Departments',        icon: '🏛️', desc: 'Manage departments & heads' },
  { to: '/campus/hrm/recruitment',     label: 'Recruitment',        icon: '📋', desc: 'Job postings & applicants' },
  { to: '/campus/hrm/leaves',          label: 'Leave Management',   icon: '🌴', desc: 'Approve / reject leave requests' },
  { to: '/campus/hrm/staff-attendance',label: 'Staff Attendance',   icon: '📅', desc: 'Mark daily staff attendance' },
  { to: '/campus/hrm/contracts',       label: 'Contracts',          icon: '📄', desc: 'Employment contract tracking' },
  { to: '/campus/hrm/performance',     label: 'Performance',        icon: '📈', desc: 'Staff performance reviews' },
  { to: '/campus/hrm/benefits',        label: 'Benefits',           icon: '🎁', desc: 'Benefit plans & enrollments' },
  { to: '/campus/hrm/resignations',    label: 'Resignations',       icon: '🚪', desc: 'Process resignation requests' },
  { to: '/campus/hrm/reports',         label: 'HR Reports',         icon: '📊', desc: 'Workforce analytics & attrition' },
]

export default function HrmPage() {
  const analyticsQuery = useQuery({
    queryKey: ['hrm-analytics'],
    queryFn: async () => {
      const res = await axiosClient.get<Analytics>('/hrm/analytics')
      return res.data
    },
    retry: false,
  })

  const a = analyticsQuery.data

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Human Resources</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Staff management, recruitment, leave, payroll oversight and workforce analytics.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Staff" value={a?.totalStaff ?? '—'} icon="👤" />
        <KpiCard label="Active" value={a?.activeStaff ?? '—'} trend="up" icon="✅" />
        <KpiCard label="On Leave Today" value={a?.onLeaveToday ?? '—'} icon="🌴" />
        <KpiCard
          label="Attrition Rate"
          value={a ? `${(a.attritionRate ?? 0).toFixed(1)}%` : '—'}
          trend="down"
          icon="📉"
        />
      </div>

      {a && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard label="Pending Leave" value={a.pendingLeaveRequests ?? '—'} icon="⏳" trend="down" />
          <KpiCard label="Expiring Contracts" value={a.expiringContracts ?? '—'} icon="⚠️" trend="down" />
          <KpiCard label="Open Positions" value={a.openPositions ?? '—'} icon="📋" />
          <KpiCard label="Pending Reviews" value={a.pendingReviews ?? '—'} icon="📝" />
        </div>
      )}

      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="font-semibold text-gray-900 mb-4">HRM Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary-300 hover:bg-primary-50 transition-colors group"
            >
              <span className="text-2xl mt-0.5">{link.icon}</span>
              <div>
                <p className="font-medium text-gray-900 group-hover:text-primary-700 text-sm">{link.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
