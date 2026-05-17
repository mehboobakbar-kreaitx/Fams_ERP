import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatCurrency } from '../../lib/utils'

type SalaryComponent = {
  id: string
  name: string
  code: string
  type: 'Earning' | 'Deduction' | 'Employer'
  calculationMethod: 'Fixed' | 'PercentageOfBasic' | 'PercentageOfGross'
  defaultValue: number
  isTaxable: boolean
  isActive: boolean
}

type SalaryStructure = {
  id: string
  name: string
  code: string
  applicableTo: string
  components: string[]
  totalEmployees: number
  isActive: boolean
}

export default function SalaryStructuresPage() {
  const [activeTab, setActiveTab] = useState<'structures' | 'components'>('structures')

  const structuresQuery = useQuery({
    queryKey: ['salary-structures'],
    queryFn: async () => {
      const res = await axiosClient.get<SalaryStructure[] | { items: SalaryStructure[] }>('/payroll/salary-structures')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const componentsQuery = useQuery({
    queryKey: ['salary-components'],
    queryFn: async () => {
      const res = await axiosClient.get<SalaryComponent[] | { items: SalaryComponent[] }>('/payroll/salary-components')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const structures = structuresQuery.data ?? []
  const components = componentsQuery.data ?? []
  const earnings = components.filter((c) => c.type === 'Earning')
  const deductions = components.filter((c) => c.type === 'Deduction')

  const structureColumns: Column<SalaryStructure>[] = [
    {
      key: 'name',
      header: 'Structure Name',
      render: (r) => <span className="font-medium text-gray-900">{r.name}</span>,
    },
    { key: 'code', header: 'Code', width: '90px' },
    { key: 'applicableTo', header: 'Applicable To' },
    {
      key: 'components',
      header: 'Components',
      render: (r) => (
        <span className="text-sm text-muted-foreground">{r.components.length} component{r.components.length !== 1 ? 's' : ''}</span>
      ),
    },
    { key: 'totalEmployees', header: 'Employees', width: '100px' },
    {
      key: 'isActive',
      header: 'Status',
      width: '90px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${r.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          {r.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  const componentColumns: Column<SalaryComponent>[] = [
    {
      key: 'name',
      header: 'Component',
      render: (r) => <span className="font-medium text-gray-900">{r.name}</span>,
    },
    { key: 'code', header: 'Code', width: '90px' },
    {
      key: 'type',
      header: 'Type',
      width: '100px',
      render: (r) => {
        const cls =
          r.type === 'Earning'
            ? 'bg-emerald-100 text-emerald-700'
            : r.type === 'Deduction'
            ? 'bg-red-100 text-red-700'
            : 'bg-blue-100 text-blue-700'
        return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{r.type}</span>
      },
    },
    { key: 'calculationMethod', header: 'Calculation', render: (r) => r.calculationMethod.replace(/([A-Z])/g, ' $1').trim() },
    {
      key: 'defaultValue',
      header: 'Default Value',
      width: '130px',
      render: (r) =>
        r.calculationMethod === 'Fixed'
          ? formatCurrency(r.defaultValue)
          : `${r.defaultValue}%`,
    },
    {
      key: 'isTaxable',
      header: 'Taxable',
      width: '80px',
      render: (r) => (r.isTaxable ? <span className="text-amber-700 text-xs font-medium">Yes</span> : <span className="text-gray-400 text-xs">No</span>),
    },
    {
      key: 'isActive',
      header: 'Status',
      width: '80px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${r.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          {r.isActive ? 'Active' : 'Off'}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Salary Structures</h1>
          <p className="text-sm text-muted-foreground">Define pay structures, allowances and deduction components.</p>
        </div>
        <button className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + New Structure
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Structures" value={structures.length} icon="🏗️" />
        <KpiCard label="Earning Components" value={earnings.length} icon="💵" />
        <KpiCard label="Deduction Components" value={deductions.length} icon="➖" />
        <KpiCard label="Active Structures" value={structures.filter((s) => s.isActive).length} icon="✅" />
      </div>

      <div className="flex gap-1 mb-4">
        {(['structures', 'components'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              activeTab === tab
                ? 'bg-primary-700 text-white'
                : 'bg-white border border-border text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab === 'structures' ? 'Pay Structures' : 'Salary Components'}
          </button>
        ))}
      </div>

      {activeTab === 'structures' && (
        <>
          {structuresQuery.isError && (
            <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
              Salary structures API not yet available. Will appear once the Payroll backend module is deployed.
            </p>
          )}
          {!structuresQuery.isError && (
            <DataTable<SalaryStructure>
              columns={structureColumns}
              data={structures}
              rowKey={(r) => r.id}
              searchableFields={['name', 'code', 'applicableTo']}
              pageSize={15}
              emptyMessage="No salary structures defined yet."
            />
          )}
        </>
      )}

      {activeTab === 'components' && (
        <>
          {componentsQuery.isError && (
            <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
              Salary components API not yet available.
            </p>
          )}
          {!componentsQuery.isError && (
            <DataTable<SalaryComponent>
              columns={componentColumns}
              data={components}
              rowKey={(r) => r.id}
              searchableFields={['name', 'code']}
              pageSize={15}
              emptyMessage="No salary components defined yet."
            />
          )}
        </>
      )}
    </div>
  )
}
