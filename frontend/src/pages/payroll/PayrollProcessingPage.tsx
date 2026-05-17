import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatCurrency } from '../../lib/utils'

type RunStatus = 'Draft' | 'UnderReview' | 'Approved' | 'Disbursed'

type PayrollRun = {
  id: string
  period: string
  status: RunStatus
  employeeCount: number
  totalGross: number
  totalDeductions: number
  totalNet: number
  createdAt: string
  processedBy?: string
  approvedBy?: string
}

type EmployeePayLine = {
  id: string
  employeeName: string
  employeeNumber: string
  department: string
  basicSalary: number
  allowances: number
  deductions: number
  netPay: number
  status: 'Included' | 'Held' | 'Error'
}

const WORKFLOW_LABELS: Record<RunStatus, string> = {
  Draft: 'Draft',
  UnderReview: 'Under Review',
  Approved: 'Approved',
  Disbursed: 'Disbursed',
}
const NEXT_ACTION: Partial<Record<RunStatus, { label: string; endpoint: string; color: string }>> = {
  Draft:       { label: 'Submit for Review', endpoint: 'submit',   color: 'bg-blue-600 hover:bg-blue-700' },
  UnderReview: { label: 'Approve',           endpoint: 'approve',  color: 'bg-emerald-600 hover:bg-emerald-700' },
  Approved:    { label: 'Disburse',          endpoint: 'disburse', color: 'bg-primary-700 hover:bg-primary-800' },
}

const STATUS_COLORS: Record<RunStatus, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  UnderReview: 'bg-amber-100 text-amber-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Disbursed: 'bg-blue-100 text-blue-700',
}

export default function PayrollProcessingPage() {
  const qc = useQueryClient()
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [newPeriod, setNewPeriod] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [creating, setCreating] = useState(false)

  const runsQuery = useQuery({
    queryKey: ['payroll-runs'],
    queryFn: async () => {
      const res = await axiosClient.get<PayrollRun[] | { items: PayrollRun[] }>('/payroll/runs')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const selectedRun = runsQuery.data?.find((r) => r.id === selectedRunId) ?? runsQuery.data?.[0] ?? null

  const payLinesQuery = useQuery({
    queryKey: ['payroll-lines', selectedRun?.id],
    enabled: !!selectedRun?.id,
    queryFn: async () => {
      const res = await axiosClient.get<EmployeePayLine[] | { items: EmployeePayLine[] }>(
        `/payroll/runs/${selectedRun!.id}/lines`,
      )
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const transitionMutation = useMutation({
    mutationFn: async ({ runId, endpoint }: { runId: string; endpoint: string }) => {
      await axiosClient.patch(`/payroll/runs/${runId}/${endpoint}`)
    },
    onSuccess: () => {
      toast.success('Payroll run updated.')
      qc.invalidateQueries({ queryKey: ['payroll-runs'] })
      qc.invalidateQueries({ queryKey: ['payroll-dashboard'] })
    },
    onError: () => toast.error('Could not update payroll run.'),
  })

  const handleCreate = async () => {
    if (!newPeriod) return
    setCreating(true)
    try {
      const { data } = await axiosClient.post<{ id: string }>('/payroll/runs', { period: newPeriod })
      toast.success(`Payroll run created for ${newPeriod}.`)
      qc.invalidateQueries({ queryKey: ['payroll-runs'] })
      setSelectedRunId(data.id)
    } catch {
      // interceptor handles error toast
    } finally {
      setCreating(false)
    }
  }

  const payLines = payLinesQuery.data ?? []
  const runs = runsQuery.data ?? []

  const runColumns: Column<PayrollRun>[] = [
    {
      key: 'period',
      header: 'Period',
      render: (r) => <span className="font-medium font-mono">{r.period}</span>,
    },
    { key: 'employeeCount', header: 'Employees', width: '100px' },
    { key: 'totalGross', header: 'Gross Pay', render: (r) => formatCurrency(r.totalGross) },
    { key: 'totalNet',   header: 'Net Pay',   render: (r) => formatCurrency(r.totalNet) },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>
          {WORKFLOW_LABELS[r.status]}
        </span>
      ),
    },
    {
      key: 'id',
      header: '',
      width: '80px',
      render: (r) => (
        <button
          onClick={() => setSelectedRunId(r.id)}
          className={`text-xs font-medium px-2 py-1 rounded ${
            selectedRun?.id === r.id
              ? 'bg-primary-700 text-white'
              : 'text-primary-700 hover:underline'
          }`}
        >
          {selectedRun?.id === r.id ? 'Viewing' : 'View'}
        </button>
      ),
    },
  ]

  const lineColumns: Column<EmployeePayLine>[] = [
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
    { key: 'basicSalary', header: 'Basic',      render: (r) => formatCurrency(r.basicSalary) },
    { key: 'allowances',  header: 'Allowances', render: (r) => formatCurrency(r.allowances)  },
    { key: 'deductions',  header: 'Deductions', render: (r) => <span className="text-red-600">–{formatCurrency(r.deductions)}</span> },
    { key: 'netPay',      header: 'Net Pay',    render: (r) => <span className="font-semibold">{formatCurrency(r.netPay)}</span> },
    {
      key: 'status',
      header: 'Status',
      width: '90px',
      render: (r) => {
        const cls =
          r.status === 'Included' ? 'bg-emerald-100 text-emerald-700'
          : r.status === 'Held'   ? 'bg-amber-100 text-amber-700'
          :                         'bg-red-100 text-red-700'
        return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{r.status}</span>
      },
    },
  ]

  const action = selectedRun ? NEXT_ACTION[selectedRun.status] : null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payroll Processing</h1>
          <p className="text-sm text-muted-foreground">Generate, review, approve and disburse monthly payroll.</p>
        </div>
      </div>

      {/* Create new run */}
      <div className="bg-white rounded-xl border border-border p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">New Payroll Run</h2>
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Pay Period (YYYY-MM)</label>
            <input
              type="month"
              value={newPeriod}
              onChange={(e) => setNewPeriod(e.target.value)}
              className="border border-input rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create Run'}
          </button>
        </div>
      </div>

      {/* Payroll runs list */}
      <div className="bg-white rounded-xl border border-border p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Payroll Runs</h2>
        {runsQuery.isLoading && <p className="text-muted-foreground">Loading runs…</p>}
        {runsQuery.isError && (
          <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
            Payroll runs API not yet available. Will appear once the Payroll backend module is deployed.
          </p>
        )}
        {!runsQuery.isLoading && !runsQuery.isError && (
          <DataTable<PayrollRun>
            columns={runColumns}
            data={runs}
            rowKey={(r) => r.id}
            searchableFields={['period']}
            pageSize={10}
            emptyMessage="No payroll runs yet. Create one above."
          />
        )}
      </div>

      {/* Selected run detail */}
      {selectedRun && (
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">
                Run: {selectedRun.period}
                <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selectedRun.status]}`}>
                  {WORKFLOW_LABELS[selectedRun.status]}
                </span>
              </h2>
            </div>
            {action && (
              <button
                onClick={() => transitionMutation.mutate({ runId: selectedRun.id, endpoint: action.endpoint })}
                disabled={transitionMutation.isPending}
                className={`${action.color} text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50`}
              >
                {transitionMutation.isPending ? 'Processing…' : action.label}
              </button>
            )}
            {selectedRun.status === 'Disbursed' && (
              <span className="text-sm text-emerald-700 font-medium">✓ Disbursed</span>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KpiCard label="Employees" value={selectedRun.employeeCount} icon="👥" />
            <KpiCard label="Gross Pay" value={formatCurrency(selectedRun.totalGross)} icon="💰" />
            <KpiCard label="Deductions" value={formatCurrency(selectedRun.totalDeductions)} icon="➖" />
            <KpiCard label="Net Pay" value={formatCurrency(selectedRun.totalNet)} icon="💵" />
          </div>

          {payLinesQuery.isLoading && <p className="text-muted-foreground">Loading pay lines…</p>}
          {payLinesQuery.isError && (
            <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
              Pay lines not available for this run.
            </p>
          )}
          {!payLinesQuery.isLoading && !payLinesQuery.isError && (
            <DataTable<EmployeePayLine>
              columns={lineColumns}
              data={payLines}
              rowKey={(r) => r.id}
              searchableFields={['employeeName', 'employeeNumber', 'department']}
              pageSize={20}
              emptyMessage="No pay lines for this run."
            />
          )}
        </div>
      )}
    </div>
  )
}
