import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatCurrency } from '../../lib/utils'

type DeductionType = {
  id: string
  name: string
  code: string
  category: 'Statutory' | 'Voluntary' | 'Disciplinary'
  calculationMethod: 'Fixed' | 'PercentageOfBasic' | 'PercentageOfGross'
  defaultValue: number
  isMandatory: boolean
  isActive: boolean
}

type EmployeeDeduction = {
  id: string
  employeeName: string
  employeeNumber: string
  department: string
  deductionName: string
  amount: number
  frequency: 'Monthly' | 'OneTime' | 'Annual'
  effectiveFrom: string
  effectiveTo?: string
  isActive: boolean
}

const CAT_COLORS: Record<string, string> = {
  Statutory: 'bg-red-100 text-red-700',
  Voluntary: 'bg-blue-100 text-blue-700',
  Disciplinary: 'bg-amber-100 text-amber-700',
}

export default function DeductionsPage() {
  const [activeTab, setActiveTab] = useState<'types' | 'employee'>('types')

  const typesQuery = useQuery({
    queryKey: ['deduction-types'],
    queryFn: async () => {
      const res = await axiosClient.get<DeductionType[] | { items: DeductionType[] }>('/payroll/deduction-types')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const employeeDeductionsQuery = useQuery({
    queryKey: ['employee-deductions'],
    enabled: activeTab === 'employee',
    queryFn: async () => {
      const res = await axiosClient.get<EmployeeDeduction[] | { items: EmployeeDeduction[] }>('/payroll/deductions')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const types = typesQuery.data ?? []
  const empDeductions = employeeDeductionsQuery.data ?? []
  const statutory = types.filter((t) => t.category === 'Statutory').length
  const voluntary = types.filter((t) => t.category === 'Voluntary').length

  const typeColumns: Column<DeductionType>[] = [
    {
      key: 'name',
      header: 'Deduction Name',
      render: (r) => <span className="font-medium text-gray-900">{r.name}</span>,
    },
    { key: 'code', header: 'Code', width: '80px' },
    {
      key: 'category',
      header: 'Category',
      width: '110px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${CAT_COLORS[r.category] ?? ''}`}>
          {r.category}
        </span>
      ),
    },
    {
      key: 'calculationMethod',
      header: 'Calculation',
      render: (r) => r.calculationMethod.replace(/([A-Z])/g, ' $1').trim(),
    },
    {
      key: 'defaultValue',
      header: 'Value',
      width: '120px',
      render: (r) => r.calculationMethod === 'Fixed' ? formatCurrency(r.defaultValue) : `${r.defaultValue}%`,
    },
    {
      key: 'isMandatory',
      header: 'Mandatory',
      width: '95px',
      render: (r) => r.isMandatory ? <span className="text-red-600 text-xs font-medium">Yes</span> : <span className="text-gray-400 text-xs">No</span>,
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

  const empColumns: Column<EmployeeDeduction>[] = [
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
    { key: 'deductionName', header: 'Deduction' },
    { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.amount) },
    { key: 'frequency', header: 'Frequency', width: '100px' },
    {
      key: 'isActive',
      header: 'Active',
      width: '80px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${r.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          {r.isActive ? 'Yes' : 'No'}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Deductions</h1>
          <p className="text-sm text-muted-foreground">Statutory deductions (EOBI, income tax) and voluntary deductions.</p>
        </div>
        <button className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Add Deduction Type
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Types" value={types.length} icon="➖" />
        <KpiCard label="Statutory" value={statutory} icon="🏛️" />
        <KpiCard label="Voluntary" value={voluntary} icon="✋" />
        <KpiCard label="Active Types" value={types.filter((t) => t.isActive).length} icon="✅" />
      </div>

      <div className="flex gap-1 mb-4">
        {(['types', 'employee'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              activeTab === tab
                ? 'bg-primary-700 text-white'
                : 'bg-white border border-border text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab === 'types' ? 'Deduction Types' : 'Employee Deductions'}
          </button>
        ))}
      </div>

      {activeTab === 'types' && (
        <>
          {typesQuery.isError && (
            <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
              Deduction types API not yet available.
            </p>
          )}
          {!typesQuery.isError && (
            <DataTable<DeductionType>
              columns={typeColumns}
              data={types}
              rowKey={(r) => r.id}
              searchableFields={['name', 'code', 'category']}
              pageSize={15}
              emptyMessage="No deduction types defined yet."
            />
          )}
        </>
      )}

      {activeTab === 'employee' && (
        <>
          {employeeDeductionsQuery.isError && (
            <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
              Employee deductions API not yet available.
            </p>
          )}
          {!employeeDeductionsQuery.isError && (
            <DataTable<EmployeeDeduction>
              columns={empColumns}
              data={empDeductions}
              rowKey={(r) => r.id}
              searchableFields={['employeeName', 'employeeNumber', 'deductionName']}
              pageSize={15}
              emptyMessage="No employee deductions on record."
            />
          )}
        </>
      )}
    </div>
  )
}
