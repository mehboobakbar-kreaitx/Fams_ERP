import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatCurrency } from '../../lib/utils'

type TaxSlab = {
  id: string
  fiscalYear: string
  incomeFrom: number
  incomeTo?: number
  rate: number
  fixedTax: number
  isActive: boolean
}

type EmployeeTax = {
  id: string
  employeeName: string
  employeeNumber: string
  department: string
  annualIncome: number
  taxableIncome: number
  annualTax: number
  monthlyWithholding: number
  effectiveTaxRate: number
}

type TaxSummary = {
  totalWithheldMTD: number
  totalWithheldYTD: number
  employeesAboveThreshold: number
  currentFiscalYear: string
}

export default function TaxesPage() {
  const summaryQuery = useQuery({
    queryKey: ['tax-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<TaxSummary>('/payroll/taxes/summary')
      return res.data
    },
    retry: false,
  })

  const slabsQuery = useQuery({
    queryKey: ['tax-slabs'],
    queryFn: async () => {
      const res = await axiosClient.get<TaxSlab[] | { items: TaxSlab[] }>('/payroll/tax-slabs')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const employeeTaxQuery = useQuery({
    queryKey: ['employee-taxes'],
    queryFn: async () => {
      const res = await axiosClient.get<EmployeeTax[] | { items: EmployeeTax[] }>('/payroll/taxes/employees')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const s = summaryQuery.data
  const slabs = slabsQuery.data ?? []
  const employeeTaxes = employeeTaxQuery.data ?? []

  const slabColumns: Column<TaxSlab>[] = [
    { key: 'fiscalYear', header: 'FY', width: '90px' },
    {
      key: 'incomeFrom',
      header: 'Income From',
      render: (r) => formatCurrency(r.incomeFrom),
    },
    {
      key: 'incomeTo',
      header: 'Income To',
      render: (r) => (r.incomeTo != null ? formatCurrency(r.incomeTo) : 'No limit'),
    },
    {
      key: 'fixedTax',
      header: 'Fixed Tax',
      render: (r) => (r.fixedTax > 0 ? formatCurrency(r.fixedTax) : '—'),
    },
    {
      key: 'rate',
      header: 'Rate on Excess',
      width: '130px',
      render: (r) => <span className="font-medium">{r.rate}%</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      width: '80px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${r.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          {r.isActive ? 'Active' : 'Old'}
        </span>
      ),
    },
  ]

  const empTaxColumns: Column<EmployeeTax>[] = [
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
    { key: 'annualIncome',        header: 'Annual Income',       render: (r) => formatCurrency(r.annualIncome) },
    { key: 'taxableIncome',       header: 'Taxable Income',      render: (r) => formatCurrency(r.taxableIncome) },
    { key: 'annualTax',           header: 'Annual Tax',          render: (r) => <span className="text-red-600 font-medium">{formatCurrency(r.annualTax)}</span> },
    { key: 'monthlyWithholding',  header: 'Monthly Withholding', render: (r) => formatCurrency(r.monthlyWithholding) },
    {
      key: 'effectiveTaxRate',
      header: 'Effective Rate',
      width: '120px',
      render: (r) => <span className="font-medium">{r.effectiveTaxRate.toFixed(2)}%</span>,
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Taxes</h1>
          <p className="text-sm text-muted-foreground">
            Income tax slabs, per-employee withholding computation and YTD tracking.
          </p>
        </div>
        <button className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Add Tax Slab
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Withheld MTD" value={s ? formatCurrency(s.totalWithheldMTD) : '—'} icon="🏛️" />
        <KpiCard label="Withheld YTD" value={s ? formatCurrency(s.totalWithheldYTD) : '—'} icon="📊" />
        <KpiCard label="Taxable Employees" value={s?.employeesAboveThreshold ?? '—'} icon="👤" />
        <KpiCard label="Fiscal Year" value={s?.currentFiscalYear ?? '—'} icon="📅" />
      </div>

      {/* Tax Slabs */}
      <div className="mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Tax Slabs (Current FY)</h2>
        {slabsQuery.isError ? (
          <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
            Tax slabs API not yet available.
          </p>
        ) : (
          <DataTable<TaxSlab>
            columns={slabColumns}
            data={slabs}
            rowKey={(r) => r.id}
            searchableFields={['fiscalYear']}
            pageSize={15}
            emptyMessage="No tax slabs configured yet."
          />
        )}
      </div>

      {/* Per-employee tax */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Per-Employee Tax Computation</h2>
        {employeeTaxQuery.isError ? (
          <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
            Employee tax data not yet available.
          </p>
        ) : (
          <DataTable<EmployeeTax>
            columns={empTaxColumns}
            data={employeeTaxes}
            rowKey={(r) => r.id}
            searchableFields={['employeeName', 'employeeNumber', 'department']}
            pageSize={15}
            emptyMessage="No employee tax records yet."
          />
        )}
      </div>
    </div>
  )
}
