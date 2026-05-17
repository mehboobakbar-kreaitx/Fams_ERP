import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatCurrency } from '../../lib/utils'

type SalaryGrade = {
  id: string
  gradeCode: string
  gradeTitle: string
  minSalary: number
  midSalary: number
  maxSalary: number
  employeeCount: number
  department?: string
  isActive: boolean
}

export default function SalaryGradesPage() {
  const gradesQuery = useQuery({
    queryKey: ['salary-grades'],
    queryFn: async () => {
      const res = await axiosClient.get<SalaryGrade[] | { items: SalaryGrade[] }>('/payroll/salary-grades')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const grades = gradesQuery.data ?? []

  const columns: Column<SalaryGrade>[] = [
    {
      key: 'gradeCode',
      header: 'Grade',
      width: '80px',
      render: (r) => <span className="font-mono font-semibold text-primary-700">{r.gradeCode}</span>,
    },
    {
      key: 'gradeTitle',
      header: 'Title',
      render: (r) => <span className="font-medium text-gray-900">{r.gradeTitle}</span>,
    },
    {
      key: 'minSalary',
      header: 'Min',
      width: '130px',
      render: (r) => formatCurrency(r.minSalary),
    },
    {
      key: 'midSalary',
      header: 'Mid (Benchmark)',
      width: '140px',
      render: (r) => <span className="font-medium">{formatCurrency(r.midSalary)}</span>,
    },
    {
      key: 'maxSalary',
      header: 'Max',
      width: '130px',
      render: (r) => formatCurrency(r.maxSalary),
    },
    {
      key: 'minSalary',
      header: 'Salary Band',
      render: (r) => {
        const range = r.maxSalary - r.minSalary
        const midPct = range > 0 ? Math.round(((r.midSalary - r.minSalary) / range) * 100) : 50
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-2 relative min-w-[80px]">
              <div className="absolute h-2 rounded-full bg-primary-200" style={{ width: '100%' }} />
              <div
                className="absolute h-4 w-0.5 bg-primary-700 -top-1"
                style={{ left: `${midPct}%` }}
                title={`Benchmark: ${formatCurrency(r.midSalary)}`}
              />
            </div>
          </div>
        )
      },
    },
    { key: 'employeeCount', header: 'Staff', width: '70px' },
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
          <h1 className="text-2xl font-semibold text-gray-900">Salary Grades</h1>
          <p className="text-sm text-muted-foreground">Grade-based pay bands (minimum, benchmark, maximum).</p>
        </div>
        <button className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + New Grade
        </button>
      </div>

      {gradesQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
          Salary grades API not yet available. Will appear once the Payroll backend module is deployed.
        </p>
      )}
      {!gradesQuery.isError && (
        <DataTable<SalaryGrade>
          columns={columns}
          data={grades}
          rowKey={(r) => r.id}
          searchableFields={['gradeCode', 'gradeTitle']}
          pageSize={25}
          emptyMessage="No salary grades defined yet."
        />
      )}
    </div>
  )
}
