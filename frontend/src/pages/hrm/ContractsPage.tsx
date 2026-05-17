import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatDate } from '../../lib/utils'

type Contract = {
  id: string
  employeeName: string
  employeeNumber: string
  department: string
  contractType: string
  startDate: string
  endDate?: string
  salary?: number
  status: 'Active' | 'Expired' | 'Terminated' | 'PendingSignature'
}

type Summary = {
  activeContracts: number
  expiringIn30Days: number
  expired: number
  pendingSignature: number
}

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Expired: 'bg-red-100 text-red-700',
  Terminated: 'bg-gray-200 text-gray-600',
  PendingSignature: 'bg-amber-100 text-amber-700',
}

const STATUS_LABELS: Record<string, string> = {
  PendingSignature: 'Pending Signature',
}

export default function ContractsPage() {
  const summaryQuery = useQuery({
    queryKey: ['contracts-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<Summary>('/hrm/contracts/summary')
      return res.data
    },
    retry: false,
  })

  const contractsQuery = useQuery({
    queryKey: ['hrm-contracts'],
    queryFn: async () => {
      const res = await axiosClient.get<Contract[] | { items: Contract[] }>('/hrm/contracts')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const summary = summaryQuery.data
  const contracts = contractsQuery.data ?? []

  const columns: Column<Contract>[] = [
    {
      key: 'employeeName',
      header: 'Employee',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.employeeName}</p>
          <p className="text-xs text-muted-foreground">{r.employeeNumber}</p>
        </div>
      ),
    },
    { key: 'department', header: 'Department' },
    {
      key: 'contractType',
      header: 'Type',
      width: '120px',
      render: (r) => (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
          {r.contractType}
        </span>
      ),
    },
    { key: 'startDate', header: 'Start', width: '105px', render: (r) => formatDate(r.startDate) },
    {
      key: 'endDate',
      header: 'End / Expiry',
      width: '105px',
      render: (r) => {
        if (!r.endDate) return <span className="text-muted-foreground">Permanent</span>
        const isExpiring = new Date(r.endDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
        return (
          <span className={isExpiring && r.status === 'Active' ? 'text-amber-600 font-medium' : ''}>
            {formatDate(r.endDate)}
          </span>
        )
      },
    },
    {
      key: 'salary',
      header: 'Salary',
      width: '110px',
      render: (r) =>
        r.salary != null
          ? new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(r.salary)
          : '—',
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] ?? ''}`}>
          {STATUS_LABELS[r.status] ?? r.status}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Contracts</h1>
          <p className="text-sm text-muted-foreground">Employment contract lifecycle and renewal tracking.</p>
        </div>
        <button className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + New Contract
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Active Contracts" value={summary?.activeContracts ?? contracts.filter((c) => c.status === 'Active').length} icon="📄" />
        <KpiCard
          label="Expiring in 30 Days"
          value={summary?.expiringIn30Days ?? '—'}
          icon="⚠️"
          trend={summary && summary.expiringIn30Days > 0 ? 'down' : 'neutral'}
        />
        <KpiCard label="Expired" value={summary?.expired ?? '—'} icon="❌" />
        <KpiCard label="Pending Signature" value={summary?.pendingSignature ?? '—'} icon="✍️" />
      </div>

      {contractsQuery.isLoading && <p className="text-muted-foreground">Loading contracts…</p>}
      {contractsQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
          Contracts API not yet available. Data will appear once the HRM backend module is deployed.
        </p>
      )}
      {!contractsQuery.isLoading && !contractsQuery.isError && (
        <DataTable<Contract>
          columns={columns}
          data={contracts}
          rowKey={(r) => r.id}
          searchableFields={['employeeName', 'employeeNumber', 'department', 'contractType']}
          pageSize={15}
          emptyMessage="No contracts on record yet."
        />
      )}
    </div>
  )
}
