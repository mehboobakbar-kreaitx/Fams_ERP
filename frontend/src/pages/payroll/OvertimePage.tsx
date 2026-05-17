import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatCurrency, formatDate } from '../../lib/utils'

type OvertimeEntry = {
  id: string
  employeeName: string
  employeeNumber: string
  department: string
  date: string
  regularHours: number
  overtimeHours: number
  overtimeRate: number
  overtimeAmount: number
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid'
  approvedBy?: string
}

type Summary = {
  totalOtHours: number
  totalOtAmount: number
  pendingApprovals: number
  paidThisMonth: number
}

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Approved: 'bg-blue-100 text-blue-700',
  Rejected: 'bg-red-100 text-red-700',
  Paid: 'bg-emerald-100 text-emerald-700',
}

export default function OvertimePage() {
  const [statusFilter, setStatusFilter] = useState('All')
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const summaryQuery = useQuery({
    queryKey: ['overtime-summary', month],
    queryFn: async () => {
      const res = await axiosClient.get<Summary>('/payroll/overtime/summary', { params: { month } })
      return res.data
    },
    retry: false,
  })

  const overtimeQuery = useQuery({
    queryKey: ['overtime-entries', month, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = { month }
      if (statusFilter !== 'All') params.status = statusFilter
      const res = await axiosClient.get<OvertimeEntry[] | { items: OvertimeEntry[] }>('/payroll/overtime', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const s = summaryQuery.data
  const entries = overtimeQuery.data ?? []

  const columns: Column<OvertimeEntry>[] = [
    {
      key: 'employeeName',
      header: 'Employee',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.employeeName}</p>
          <p className="text-xs text-muted-foreground">{r.employeeNumber} · {r.department}</p>
        </div>
      ),
    },
    { key: 'date', header: 'Date', width: '105px', render: (r) => formatDate(r.date) },
    { key: 'regularHours',  header: 'Regular Hrs', width: '100px', render: (r) => `${r.regularHours}h` },
    {
      key: 'overtimeHours',
      header: 'OT Hours',
      width: '95px',
      render: (r) => <span className="font-medium text-primary-700">{r.overtimeHours}h</span>,
    },
    { key: 'overtimeRate',   header: 'Rate/Hr', width: '110px', render: (r) => formatCurrency(r.overtimeRate) },
    { key: 'overtimeAmount', header: 'OT Amount', render: (r) => <span className="font-semibold">{formatCurrency(r.overtimeAmount)}</span> },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] ?? ''}`}>
          {r.status}
        </span>
      ),
    },
    { key: 'approvedBy', header: 'Approved By', render: (r) => r.approvedBy ?? '—' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Overtime</h1>
          <p className="text-sm text-muted-foreground">Attendance-derived overtime entries and approvals.</p>
        </div>
        <button className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Log Overtime
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total OT Hours" value={s ? `${s.totalOtHours}h` : '—'} icon="⏰" />
        <KpiCard label="Total OT Amount" value={s ? formatCurrency(s.totalOtAmount) : '—'} icon="💵" />
        <KpiCard label="Pending Approvals" value={s?.pendingApprovals ?? '—'} icon="⏳" trend="down" />
        <KpiCard label="Paid This Month" value={s ? formatCurrency(s.paidThisMonth) : '—'} icon="✅" trend="up" />
      </div>

      <div className="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {['All', 'Pending', 'Approved', 'Rejected', 'Paid'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                statusFilter === s
                  ? 'bg-primary-700 text-white border-primary-700'
                  : 'bg-white text-gray-700 border-border hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {overtimeQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
          Overtime API not yet available. Will appear once the Payroll backend module is deployed.
        </p>
      )}
      {!overtimeQuery.isError && (
        <DataTable<OvertimeEntry>
          columns={columns}
          data={entries}
          rowKey={(r) => r.id}
          searchableFields={['employeeName', 'employeeNumber', 'department']}
          pageSize={15}
          emptyMessage="No overtime entries for this period."
        />
      )}
    </div>
  )
}
