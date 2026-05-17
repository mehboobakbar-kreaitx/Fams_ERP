import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatDate } from '../../lib/utils'

type Tab = 'students' | 'staff' | 'trends'

type StudentAttendanceRecord = {
  id: string
  studentName: string
  rollNumber: string
  className: string
  section: string
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  attendanceRate: number
  status: 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Critical'
}

type StaffAttendanceRecord = {
  id: string
  staffName: string
  designation: string
  department: string
  totalWorkdays: number
  presentDays: number
  absentDays: number
  leaveDays: number
  attendanceRate: number
}

type DailyTrend = {
  id: string
  date: string
  studentPresentCount: number
  studentAbsentCount: number
  studentAttendanceRate: number
  staffPresentCount: number
  staffAttendanceRate: number
}

type AttendanceSummary = {
  studentAttendanceRate: number
  staffAttendanceRate: number
  criticalAbsentees: number
  averageDailyPresent: number
}

const STATUS_COLORS: Record<string, string> = {
  Excellent: 'bg-emerald-100 text-emerald-700',
  Good:      'bg-blue-100 text-blue-700',
  Average:   'bg-amber-100 text-amber-700',
  Poor:      'bg-orange-100 text-orange-700',
  Critical:  'bg-red-100 text-red-700',
}

function attendanceStatus(rate: number): string {
  if (rate >= 95) return 'Excellent'
  if (rate >= 85) return 'Good'
  if (rate >= 75) return 'Average'
  if (rate >= 60) return 'Poor'
  return 'Critical'
}

export default function AttendanceReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('students')
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const summaryQuery = useQuery({
    queryKey: ['attendance-reports-summary', month],
    queryFn: async () => {
      const res = await axiosClient.get<AttendanceSummary>('/reports/attendance/summary', { params: { month } })
      return res.data
    },
    retry: false,
  })

  const studentsQuery = useQuery({
    queryKey: ['attendance-students', month],
    queryFn: async () => {
      const res = await axiosClient.get<StudentAttendanceRecord[]>('/reports/attendance/students', { params: { month } })
      return Array.isArray(res.data) ? res.data : []
    },
    enabled: activeTab === 'students',
    retry: false,
  })

  const staffQuery = useQuery({
    queryKey: ['attendance-staff', month],
    queryFn: async () => {
      const res = await axiosClient.get<StaffAttendanceRecord[]>('/reports/attendance/staff', { params: { month } })
      return Array.isArray(res.data) ? res.data : []
    },
    enabled: activeTab === 'staff',
    retry: false,
  })

  const trendsQuery = useQuery({
    queryKey: ['attendance-trends', month],
    queryFn: async () => {
      const res = await axiosClient.get<DailyTrend[]>('/reports/attendance/trends', { params: { month } })
      return Array.isArray(res.data) ? res.data : []
    },
    enabled: activeTab === 'trends',
    retry: false,
  })

  const s = summaryQuery.data

  const studentCols: Column<StudentAttendanceRecord>[] = [
    {
      key: 'studentName', header: 'Student',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.studentName}</p>
          <p className="text-xs text-muted-foreground">{r.rollNumber}</p>
        </div>
      ),
    },
    {
      key: 'className', header: 'Class', width: '100px',
      render: (r) => <span>{r.className} {r.section}</span>,
    },
    { key: 'totalDays', header: 'Total Days', width: '90px' },
    {
      key: 'attendanceRate', header: 'Rate', width: '130px',
      render: (r) => (
        <div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full ${r.attendanceRate >= 85 ? 'bg-emerald-500' : r.attendanceRate >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${r.attendanceRate}%` }} />
            </div>
            <span className="text-xs font-semibold w-10 text-right">{r.attendanceRate.toFixed(0)}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{r.presentDays}P / {r.absentDays}A / {r.lateDays}L</p>
        </div>
      ),
    },
    {
      key: 'status', header: 'Status', width: '90px',
      render: (r) => {
        const status = attendanceStatus(r.attendanceRate)
        return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}>{status}</span>
      },
    },
  ]

  const staffCols: Column<StaffAttendanceRecord>[] = [
    {
      key: 'staffName', header: 'Staff Member',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.staffName}</p>
          <p className="text-xs text-muted-foreground">{r.designation}</p>
        </div>
      ),
    },
    { key: 'department', header: 'Department', width: '130px' },
    { key: 'totalWorkdays', header: 'Workdays', width: '90px' },
    {
      key: 'attendanceRate', header: 'Rate', width: '130px',
      render: (r) => (
        <div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full ${r.attendanceRate >= 90 ? 'bg-emerald-500' : r.attendanceRate >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${r.attendanceRate}%` }} />
            </div>
            <span className="text-xs font-semibold w-10 text-right">{r.attendanceRate.toFixed(0)}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{r.presentDays}P / {r.absentDays}A / {r.leaveDays} leave</p>
        </div>
      ),
    },
  ]

  const trendCols: Column<DailyTrend>[] = [
    { key: 'date', header: 'Date', width: '120px', render: (r) => <span className="font-mono text-xs">{formatDate(r.date)}</span> },
    { key: 'studentPresentCount', header: 'Students Present', width: '140px', render: (r) => <span className="font-semibold">{r.studentPresentCount}</span> },
    {
      key: 'studentAttendanceRate', header: 'Student Rate', width: '120px',
      render: (r) => <span className={`font-semibold ${r.studentAttendanceRate >= 85 ? 'text-emerald-700' : r.studentAttendanceRate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{r.studentAttendanceRate.toFixed(0)}%</span>,
    },
    { key: 'staffPresentCount', header: 'Staff Present', width: '120px', render: (r) => <span className="font-semibold">{r.staffPresentCount}</span> },
    {
      key: 'staffAttendanceRate', header: 'Staff Rate', width: '110px',
      render: (r) => <span className={`font-semibold ${r.staffAttendanceRate >= 90 ? 'text-emerald-700' : 'text-amber-600'}`}>{r.staffAttendanceRate.toFixed(0)}%</span>,
    },
  ]

  const TABS: { key: Tab; label: string }[] = [
    { key: 'students', label: 'Students' },
    { key: 'staff', label: 'Staff' },
    { key: 'trends', label: 'Daily Trends' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Attendance Reports</h1>
          <p className="text-sm text-muted-foreground">Student and staff attendance rates, daily trends and absentee lists.</p>
        </div>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          className="border border-input rounded-lg px-3 py-2 text-sm" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Student Attendance"  value={s ? `${s.studentAttendanceRate.toFixed(0)}%` : '—'} icon="👥" trend={s && s.studentAttendanceRate >= 85 ? 'up' : 'down'} />
        <KpiCard label="Staff Attendance"    value={s ? `${s.staffAttendanceRate.toFixed(0)}%` : '—'}   icon="👤" trend={s && s.staffAttendanceRate >= 90 ? 'up' : 'neutral'} />
        <KpiCard label="Critical Absentees"  value={s?.criticalAbsentees?.toLocaleString() ?? '—'}       icon="⚠️" />
        <KpiCard label="Avg Daily Present"   value={s?.averageDailyPresent?.toLocaleString() ?? '—'}     icon="📅" />
      </div>

      {summaryQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Attendance reports API not yet available. Will appear once the Attendance backend module is deployed.
        </p>
      )}

      <div className="flex gap-1 mb-4">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === t.key ? 'bg-primary-700 text-white' : 'bg-white border border-border text-gray-700 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'students' && !studentsQuery.isLoading && !studentsQuery.isError && (
        <DataTable<StudentAttendanceRecord> columns={studentCols} data={studentsQuery.data ?? []} rowKey={(r) => r.id}
          searchableFields={['studentName', 'rollNumber', 'className']} pageSize={20} emptyMessage="No student attendance data." />
      )}
      {activeTab === 'staff' && !staffQuery.isLoading && !staffQuery.isError && (
        <DataTable<StaffAttendanceRecord> columns={staffCols} data={staffQuery.data ?? []} rowKey={(r) => r.id}
          searchableFields={['staffName', 'department', 'designation']} pageSize={20} emptyMessage="No staff attendance data." />
      )}
      {activeTab === 'trends' && !trendsQuery.isLoading && !trendsQuery.isError && (
        <DataTable<DailyTrend> columns={trendCols} data={trendsQuery.data ?? []} rowKey={(r) => r.id}
          searchableFields={['date']} pageSize={31} emptyMessage="No trend data for this period." />
      )}
    </div>
  )
}
