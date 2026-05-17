import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatCurrency, formatDate } from '../../lib/utils'

type PayslipSummary = {
  id: string
  employeeName: string
  employeeNumber: string
  department: string
  period: string
  grossPay: number
  totalDeductions: number
  netPay: number
  disbursedAt?: string
  status: 'Generated' | 'Disbursed'
}

type PayslipDetail = {
  employeeName: string
  employeeNumber: string
  designation: string
  department: string
  period: string
  basicSalary: number
  allowances: { name: string; amount: number }[]
  deductions: { name: string; amount: number }[]
  grossPay: number
  totalDeductions: number
  netPay: number
  disbursedAt?: string
}

export default function PayslipsPage() {
  const [period, setPeriod] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const payslipsQuery = useQuery({
    queryKey: ['payslips', period],
    queryFn: async () => {
      const res = await axiosClient.get<PayslipSummary[] | { items: PayslipSummary[] }>('/payroll/payslips', {
        params: { period },
      })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const detailQuery = useQuery({
    queryKey: ['payslip-detail', selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const res = await axiosClient.get<PayslipDetail>(`/payroll/payslips/${selectedId}`)
      return res.data
    },
    retry: false,
  })

  const payslips = payslipsQuery.data ?? []
  const filtered = search
    ? payslips.filter(
        (p) =>
          p.employeeName.toLowerCase().includes(search.toLowerCase()) ||
          p.employeeNumber.toLowerCase().includes(search.toLowerCase()),
      )
    : payslips

  const columns: Column<PayslipSummary>[] = [
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
    { key: 'period', header: 'Period', width: '100px' },
    { key: 'grossPay',        header: 'Gross Pay',   render: (r) => formatCurrency(r.grossPay) },
    { key: 'totalDeductions', header: 'Deductions',  render: (r) => <span className="text-red-600">–{formatCurrency(r.totalDeductions)}</span> },
    { key: 'netPay',          header: 'Net Pay',     render: (r) => <span className="font-semibold">{formatCurrency(r.netPay)}</span> },
    {
      key: 'disbursedAt',
      header: 'Disbursed',
      width: '110px',
      render: (r) => (r.disbursedAt ? formatDate(r.disbursedAt) : '—'),
    },
    {
      key: 'id',
      header: '',
      width: '90px',
      render: (r) => (
        <button
          onClick={() => setSelectedId(r.id)}
          className="text-xs text-primary-700 hover:underline font-medium"
        >
          View Slip
        </button>
      ),
    },
  ]

  const d = detailQuery.data

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Payslips</h1>
      <p className="text-sm text-muted-foreground mb-6">View and print employee payslips by pay period.</p>

      <div className="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Pay Period</label>
          <input
            type="month"
            value={period}
            onChange={(e) => { setPeriod(e.target.value); setSelectedId(null) }}
            className="border border-input rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-700 mb-1">Search Employee</label>
          <input
            placeholder="Name or employee number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className={selectedId ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}>
        {/* List */}
        <div>
          {payslipsQuery.isLoading && <p className="text-muted-foreground">Loading payslips…</p>}
          {payslipsQuery.isError && (
            <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
              Payslips API not yet available. Will appear once the Payroll backend module is deployed.
            </p>
          )}
          {!payslipsQuery.isLoading && !payslipsQuery.isError && (
            <DataTable<PayslipSummary>
              columns={columns}
              data={filtered}
              rowKey={(r) => r.id}
              searchableFields={[]}
              pageSize={15}
              emptyMessage="No payslips generated for this period."
            />
          )}
        </div>

        {/* Detail panel */}
        {selectedId && (
          <div className="bg-white rounded-xl border border-border p-6 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Payslip Detail</h2>
              <div className="flex gap-2">
                <button className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-gray-50">
                  Print
                </button>
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-xs text-muted-foreground hover:text-gray-700"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {detailQuery.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {detailQuery.isError && <p className="text-sm text-amber-600">Could not load payslip detail.</p>}
            {d && (
              <div className="text-sm space-y-4">
                <div className="grid grid-cols-2 gap-2 pb-3 border-b border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Employee</p>
                    <p className="font-semibold">{d.employeeName}</p>
                    <p className="text-xs text-muted-foreground">{d.employeeNumber} · {d.designation}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Period</p>
                    <p className="font-semibold">{d.period}</p>
                    <p className="text-xs text-muted-foreground">{d.department}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Earnings</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Basic Salary</span>
                      <span className="font-medium">{formatCurrency(d.basicSalary)}</span>
                    </div>
                    {d.allowances.map((a) => (
                      <div key={a.name} className="flex justify-between text-gray-600">
                        <span>{a.name}</span>
                        <span>{formatCurrency(a.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                      <span>Gross Pay</span>
                      <span>{formatCurrency(d.grossPay)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Deductions</p>
                  <div className="space-y-1">
                    {d.deductions.map((ded) => (
                      <div key={ded.name} className="flex justify-between text-red-600">
                        <span>{ded.name}</span>
                        <span>–{formatCurrency(ded.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold border-t pt-1 mt-1 text-red-700">
                      <span>Total Deductions</span>
                      <span>–{formatCurrency(d.totalDeductions)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-primary-50 rounded-lg p-3 flex justify-between items-center">
                  <span className="font-bold text-primary-900">Net Pay</span>
                  <span className="text-xl font-bold text-primary-700">{formatCurrency(d.netPay)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
