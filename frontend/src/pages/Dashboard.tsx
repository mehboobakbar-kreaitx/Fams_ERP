import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { authStore } from '../store/authStore'
import { axiosClient } from '../api/axiosClient'
import KpiCard from '../components/ui/KpiCard'
import { formatCurrency } from '../lib/utils'

type RecentAdmission = {
  studentId: string
  name: string
  rollNumber: string
  enrollmentDate: string
}

type PrincipalDashboardDto = {
  totalStudents: number
  totalStaff: number
  activeClasses: number
  todayAttendancePercent: number
  outstandingFees: number
  pendingLeaves: number
  openApplications: number
  publishedExamsThisTerm: number
  recentAdmissions: RecentAdmission[]
}

const modules = [
  { to: '/students', label: 'Students', icon: '👥', description: 'Student & parent records' },
  { to: '/admissions', label: 'Admissions', icon: '📋', description: 'Application processing' },
  { to: '/attendance', label: 'Attendance', icon: '📅', description: 'Daily attendance' },
  { to: '/results', label: 'Results', icon: '📊', description: 'Exams & grading' },
  { to: '/fee', label: 'Fee', icon: '💰', description: 'Fee collection & invoicing' },
  { to: '/hrm', label: 'HRM', icon: '🏢', description: 'Staff & payroll' },
]

function useExport(format: 'pdf' | 'xlsx') {
  const [loading, setLoading] = useState(false)
  const trigger = async () => {
    setLoading(true)
    try {
      const res = await axiosClient.get(`/dashboard/principal/export.${format}`, {
        responseType: 'blob',
      })
      const url = URL.createObjectURL(res.data as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dashboard-${new Date().toISOString().slice(0, 10)}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }
  return { loading, trigger }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = authStore.getState()
  const xlsxExport = useExport('xlsx')
  const pdfExport = useExport('pdf')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-principal'],
    queryFn: async () => {
      const res = await axiosClient.get<PrincipalDashboardDto>('/dashboard/principal')
      return res.data
    },
  })

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard…</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Failed to load dashboard. Please refresh.</div>
      </div>
    )
  }

  const totalStudents = data.totalStudents ?? 0
  const totalStaff = data.totalStaff ?? 0
  const attendancePct = data.todayAttendancePercent ?? 0
  const outstanding = data.outstandingFees ?? 0
  const openApps = data.openApplications ?? 0
  const recent = data.recentAdmissions ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-2xl font-semibold text-gray-900">Welcome back, {user?.firstName || 'User'}!</h2>
        <div className="flex gap-2">
          <button
            onClick={xlsxExport.trigger}
            disabled={xlsxExport.loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {xlsxExport.loading ? 'Exporting…' : '⬇ Excel'}
          </button>
          <button
            onClick={pdfExport.trigger}
            disabled={pdfExport.loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {pdfExport.loading ? 'Exporting…' : '⬇ PDF'}
          </button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Here is what is happening across your campus today.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Total Students"
          value={(totalStudents ?? 0).toLocaleString()}
          hint={`${totalStaff} staff • ${(data.activeClasses ?? 0)} classes`}
          icon="👥"
        />
        <KpiCard
          label="Attendance Today"
          value={`${(attendancePct ?? 0).toFixed(1)}%`}
          trend={(attendancePct ?? 0) >= 80 ? 'up' : (attendancePct ?? 0) >= 60 ? 'neutral' : 'down'}
          icon="✅"
        />
        <KpiCard
          label="Outstanding Fees"
          value={formatCurrency(outstanding)}
          trend={outstanding === 0 ? 'up' : 'down'}
          icon="💰"
        />
        <KpiCard label="Open Applications" value={(openApps ?? 0).toLocaleString()} icon="📋" />
      </div>

      {recent.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5 mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">Recent Admissions</h3>
          <ul className="divide-y divide-border">
            {recent.map((r) => (
              <li key={r.studentId} className="py-2 flex justify-between text-sm">
                <span className="font-medium text-gray-900">{r.name}</span>
                <span className="text-muted-foreground">{r.rollNumber}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-3">Modules</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {modules.map((mod) => (
          <button
            key={mod.to}
            onClick={() => navigate(mod.to)}
            className="bg-white rounded-xl p-5 shadow-sm border border-border hover:shadow-md hover:border-primary-300 transition-all text-left group"
          >
            <div className="text-3xl mb-2">{mod.icon}</div>
            <h4 className="font-semibold text-gray-800 group-hover:text-primary-700">{mod.label}</h4>
            <p className="text-sm text-muted-foreground mt-1">{mod.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
