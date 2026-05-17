import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'

type BenefitPlan = {
  id: string
  name: string
  category: string
  enrolledCount: number
  eligibleCount: number
  monthlyCost?: number
  isActive: boolean
}

type Summary = {
  totalPlans: number
  totalEnrolled: number
  monthlyBudget: number
  pendingEnrollments: number
}

export default function BenefitsPage() {
  const summaryQuery = useQuery({
    queryKey: ['benefits-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<Summary>('/hrm/benefits/summary')
      return res.data
    },
    retry: false,
  })

  const plansQuery = useQuery({
    queryKey: ['benefit-plans'],
    queryFn: async () => {
      const res = await axiosClient.get<BenefitPlan[] | { items: BenefitPlan[] }>('/hrm/benefits/plans')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const summary = summaryQuery.data
  const plans = plansQuery.data ?? []

  const planColumns: Column<BenefitPlan>[] = [
    {
      key: 'name',
      header: 'Benefit Plan',
      render: (r) => <span className="font-medium text-gray-900">{r.name}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (r) => (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
          {r.category}
        </span>
      ),
    },
    {
      key: 'enrolledCount',
      header: 'Enrolled',
      width: '90px',
      render: (r) => (
        <span>{r.enrolledCount} / {r.eligibleCount}</span>
      ),
    },
    {
      key: 'monthlyCost',
      header: 'Monthly Cost',
      width: '130px',
      render: (r) =>
        r.monthlyCost != null
          ? new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(r.monthlyCost)
          : '—',
    },
    {
      key: 'isActive',
      header: 'Status',
      width: '80px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${r.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          {r.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Employee Benefits</h1>
          <p className="text-sm text-muted-foreground">Benefit plans, enrollments and cost tracking.</p>
        </div>
        <button className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Add Benefit Plan
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Benefit Plans" value={summary?.totalPlans ?? plans.length} icon="🎁" />
        <KpiCard label="Total Enrolled" value={summary?.totalEnrolled ?? '—'} icon="👥" />
        <KpiCard
          label="Monthly Budget"
          value={
            summary?.monthlyBudget != null
              ? new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(summary.monthlyBudget)
              : '—'
          }
          icon="💰"
        />
        <KpiCard label="Pending Enrollments" value={summary?.pendingEnrollments ?? '—'} icon="⏳" />
      </div>

      {plansQuery.isLoading && <p className="text-muted-foreground">Loading benefit plans…</p>}
      {plansQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
          Benefits API not yet available. Data will appear once the HRM backend module is deployed.
        </p>
      )}
      {!plansQuery.isLoading && !plansQuery.isError && (
        <DataTable<BenefitPlan>
          columns={planColumns}
          data={plans}
          rowKey={(r) => r.id}
          searchableFields={['name', 'category']}
          pageSize={15}
          emptyMessage="No benefit plans configured yet."
        />
      )}
    </div>
  )
}
