import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import { formatCurrency } from '../../lib/utils'
import { authStore } from '../../store/authStore'

type PayrollSummary = {
  currentPeriod: string
  runStatus: 'Draft' | 'UnderReview' | 'Approved' | 'Disbursed' | null
  totalGrossPay: number
  totalNetPay: number
  totalDeductions: number
  employeeCount: number
  pendingRuns: number
  disbursedThisYear: number
}

const WORKFLOW_STEPS = ['Draft', 'UnderReview', 'Approved', 'Disbursed'] as const
type WorkflowStep = (typeof WORKFLOW_STEPS)[number]

const STEP_LABELS: Record<WorkflowStep, string> = {
  Draft: 'Draft',
  UnderReview: 'Under Review',
  Approved: 'Approved',
  Disbursed: 'Disbursed',
}

const MODULES = [
  { to: '/campus/payroll/processing', label: 'Payroll Processing', icon: '⚙️', desc: 'Run payroll for the current period', roles: ['Accountant', 'Principal'] },
  { to: '/campus/payroll/structures', label: 'Salary Structures',  icon: '🏗️', desc: 'Allowances, components & pay rules' },
  { to: '/campus/payroll/grades',     label: 'Salary Grades',      icon: '📊', desc: 'Grade bands and salary ranges' },
  { to: '/campus/payroll/payslips',   label: 'Payslips',           icon: '🧾', desc: 'View and print employee payslips' },
  { to: '/campus/payroll/bonuses',    label: 'Bonuses',            icon: '🎁', desc: 'Eid, merit and performance bonuses', roles: ['Accountant', 'Principal'] },
  { to: '/campus/payroll/deductions', label: 'Deductions',         icon: '➖', desc: 'Statutory and voluntary deductions' },
  { to: '/campus/payroll/overtime',   label: 'Overtime',           icon: '⏰', desc: 'Attendance-integrated overtime entries' },
  { to: '/campus/payroll/taxes',      label: 'Taxes',              icon: '🏛️', desc: 'Tax slabs and withholding computation', roles: ['Accountant', 'Principal'] },
  { to: '/campus/payroll/reports',    label: 'Payroll Reports',    icon: '📈', desc: 'Cost analytics and YTD summaries' },
  { to: '/campus/payroll/audit',      label: 'Audit Logs',         icon: '🔒', desc: 'Immutable payroll action history', roles: ['Accountant', 'Principal'] },
]

export default function PayrollDashboard() {
  const { user } = authStore.getState()
  const userRoles = user?.roles ?? []

  const summaryQuery = useQuery({
    queryKey: ['payroll-dashboard'],
    queryFn: async () => {
      const res = await axiosClient.get<PayrollSummary>('/payroll/summary', {
        headers: { 'x-skip-error-toast': '1' },
        timeout: 15_000,
      })
      return res.data
    },
    retry: false,
  })

  const s = summaryQuery.data
  const currentStep: WorkflowStep | null = (s?.runStatus as WorkflowStep) ?? null
  const currentStepIdx = currentStep ? WORKFLOW_STEPS.indexOf(currentStep) : -1

  const visibleModules = MODULES.filter(
    (m) => !m.roles || m.roles.some((r) => userRoles.includes(r)),
  )

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Payroll & Salaries</h1>
      <p className="text-sm text-muted-foreground mb-6">
        End-to-end payroll processing — from salary structures to disbursement.
      </p>

      {summaryQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          Payroll summary API not yet available. KPI figures will appear once the backend module is deployed.
        </p>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Gross Pay (Current)"
          value={s ? formatCurrency(s.totalGrossPay) : '—'}
          icon="💰"
        />
        <KpiCard
          label="Net Pay (Current)"
          value={s ? formatCurrency(s.totalNetPay) : '—'}
          icon="💵"
          trend="up"
        />
        <KpiCard
          label="Total Deductions"
          value={s ? formatCurrency(s.totalDeductions) : '—'}
          icon="➖"
        />
        <KpiCard
          label="Disbursed YTD"
          value={s ? formatCurrency(s.disbursedThisYear) : '—'}
          icon="📊"
          trend="up"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Employees on Payroll" value={s?.employeeCount ?? '—'} icon="👤" />
        <KpiCard label="Pending Runs" value={s?.pendingRuns ?? '—'} icon="⏳" />
        <KpiCard label="Current Period" value={s?.currentPeriod ?? '—'} icon="📅" />
        <KpiCard label="Run Status" value={s?.runStatus ?? 'No active run'} icon="🔄" />
      </div>

      {/* Workflow progress bar */}
      <div className="bg-white rounded-xl border border-border p-5 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">
          Current Payroll Run
          {s?.currentPeriod && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">— {s.currentPeriod}</span>
          )}
        </h2>
        {currentStep === null ? (
          <p className="text-sm text-muted-foreground">
            No active payroll run.{' '}
            {userRoles.some((r) => ['Accountant', 'Principal'].includes(r)) && (
              <Link to="/campus/payroll/processing" className="text-primary-700 hover:underline font-medium">
                Start a new run →
              </Link>
            )}
          </p>
        ) : (
          <div className="flex items-center gap-0">
            {WORKFLOW_STEPS.map((step, idx) => {
              const done = idx < currentStepIdx
              const active = idx === currentStepIdx
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                        done
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : active
                          ? 'bg-primary-700 border-primary-700 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}
                    >
                      {done ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`text-xs mt-1 font-medium ${
                        active ? 'text-primary-700' : done ? 'text-emerald-700' : 'text-gray-400'
                      }`}
                    >
                      {STEP_LABELS[step]}
                    </span>
                  </div>
                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 mb-5 ${
                        done ? 'bg-emerald-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Module quick-access grid */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Payroll Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleModules.map((m) => (
            <Link
              key={m.to}
              to={m.to}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary-300 hover:bg-primary-50 transition-colors group"
            >
              <span className="text-2xl mt-0.5">{m.icon}</span>
              <div>
                <p className="font-medium text-gray-900 group-hover:text-primary-700 text-sm">{m.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
