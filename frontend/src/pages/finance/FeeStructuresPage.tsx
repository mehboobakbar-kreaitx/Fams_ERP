import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatCurrency } from '../../lib/utils'

type FeeComponent = {
  id: string
  name: string
  code: string
  category: string
  frequency: 'Monthly' | 'Quarterly' | 'Annual' | 'OneTime'
  isMandatory: boolean
  isActive: boolean
}

type FeeStructure = {
  id: string
  name: string
  programName: string
  className?: string
  academicYear: string
  components: Array<{ componentName: string; amount: number }>
  totalAmount: number
  applicableStudents: number
  isActive: boolean
}

export default function FeeStructuresPage() {
  const [activeTab, setActiveTab] = useState<'structures' | 'components'>('structures')

  const structuresQuery = useQuery({
    queryKey: ['fee-structures'],
    queryFn: async () => {
      const res = await axiosClient.get<FeeStructure[] | { items: FeeStructure[] }>('/finance/fee-structures')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const componentsQuery = useQuery({
    queryKey: ['fee-components'],
    queryFn: async () => {
      const res = await axiosClient.get<FeeComponent[] | { items: FeeComponent[] }>('/finance/fee-components')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const structures = structuresQuery.data ?? []
  const components = componentsQuery.data ?? []

  const structureColumns: Column<FeeStructure>[] = [
    {
      key: 'name',
      header: 'Structure Name',
      render: (r) => <span className="font-medium text-gray-900">{r.name}</span>,
    },
    { key: 'programName', header: 'Program' },
    { key: 'className', header: 'Class', render: (r) => r.className ?? 'All Classes' },
    { key: 'academicYear', header: 'Academic Year', width: '130px' },
    {
      key: 'components',
      header: 'Components',
      width: '110px',
      render: (r) => (
        <span className="text-sm text-muted-foreground">
          {r.components.length} item{r.components.length !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total / Period',
      render: (r) => <span className="font-medium">{formatCurrency(r.totalAmount)}</span>,
    },
    { key: 'applicableStudents', header: 'Students', width: '90px' },
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

  const componentColumns: Column<FeeComponent>[] = [
    {
      key: 'name',
      header: 'Component',
      render: (r) => <span className="font-medium text-gray-900">{r.name}</span>,
    },
    { key: 'code', header: 'Code', width: '80px' },
    {
      key: 'category',
      header: 'Category',
      render: (r) => (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
          {r.category}
        </span>
      ),
    },
    { key: 'frequency', header: 'Frequency', width: '110px' },
    {
      key: 'isMandatory',
      header: 'Mandatory',
      width: '95px',
      render: (r) => r.isMandatory
        ? <span className="text-red-600 text-xs font-medium">Yes</span>
        : <span className="text-gray-400 text-xs">No</span>,
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
          <h1 className="text-2xl font-semibold text-gray-900">Fee Structures</h1>
          <p className="text-sm text-muted-foreground">Define fee structures for programs, classes and academic years.</p>
        </div>
        <button className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + New Structure
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Fee Structures" value={structures.length} icon="🏗️" />
        <KpiCard label="Fee Components" value={components.length} icon="📋" />
        <KpiCard label="Active Structures" value={structures.filter((s) => s.isActive).length} icon="✅" />
        <KpiCard label="Students Covered" value={structures.reduce((a, s) => a + (s.applicableStudents ?? 0), 0)} icon="👥" />
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
            {tab === 'structures' ? 'Fee Structures' : 'Fee Components'}
          </button>
        ))}
      </div>

      {activeTab === 'structures' && (
        <>
          {structuresQuery.isError && (
            <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
              Fee structures API not yet available. Will appear once the Finance backend module is deployed.
            </p>
          )}
          {!structuresQuery.isError && (
            <DataTable<FeeStructure>
              columns={structureColumns}
              data={structures}
              rowKey={(r) => r.id}
              searchableFields={['name', 'programName', 'className', 'academicYear']}
              pageSize={15}
              emptyMessage="No fee structures defined yet."
            />
          )}
        </>
      )}

      {activeTab === 'components' && (
        <>
          {componentsQuery.isError && (
            <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
              Fee components API not yet available.
            </p>
          )}
          {!componentsQuery.isError && (
            <DataTable<FeeComponent>
              columns={componentColumns}
              data={components}
              rowKey={(r) => r.id}
              searchableFields={['name', 'code', 'category']}
              pageSize={15}
              emptyMessage="No fee components defined yet."
            />
          )}
        </>
      )}
    </div>
  )
}
