import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatCurrency, formatDate } from '../../lib/utils'

type Bonus = {
  id: string
  employeeName: string
  employeeNumber: string
  department: string
  bonusType: string
  amount: number
  period: string
  declaredDate: string
  paidDate?: string
  status: 'Pending' | 'Approved' | 'Paid' | 'Cancelled'
}

type Summary = {
  totalBonusesDeclared: number
  totalAmountPending: number
  totalAmountPaid: number
  bonusTypesCount: number
}

const BONUS_TYPES = ['All', 'Eid Bonus', 'Merit Bonus', 'Performance', 'Annual', 'Special']

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Approved: 'bg-blue-100 text-blue-700',
  Paid: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-700',
}

export default function BonusesPage() {
  const [typeFilter, setTypeFilter] = useState('All')

  const summaryQuery = useQuery({
    queryKey: ['bonuses-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<Summary>('/payroll/bonuses/summary')
      return res.data
    },
    retry: false,
  })

  const bonusesQuery = useQuery({
    queryKey: ['payroll-bonuses', typeFilter],
    queryFn: async () => {
      const params = typeFilter !== 'All' ? { bonusType: typeFilter } : {}
      const res = await axiosClient.get<Bonus[] | { items: Bonus[] }>('/payroll/bonuses', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const s = summaryQuery.data
  const bonuses = bonusesQuery.data ?? []

  const columns: Column<Bonus>[] = [
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
    {
      key: 'bonusType',
      header: 'Type',
      render: (r) => (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
          {r.bonusType}
        </span>
      ),
    },
    { key: 'amount',   header: 'Amount', render: (r) => <span className="font-medium">{formatCurrency(r.amount)}</span> },
    { key: 'period',   header: 'Period',  width: '110px' },
    { key: 'declaredDate', header: 'Declared', width: '110px', render: (r) => formatDate(r.declaredDate) },
    { key: 'paidDate', header: 'Paid On', width: '110px', render: (r) => (r.paidDate ? formatDate(r.paidDate) : '—') },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] ?? ''}`}>
          {r.status}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bonuses</h1>
          <p className="text-sm text-muted-foreground">Declare and track Eid, merit and performance bonuses.</p>
        </div>
        <button className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Declare Bonus
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Declared" value={s?.totalBonusesDeclared ?? '—'} icon="🎁" />
        <KpiCard label="Pending Amount" value={s ? formatCurrency(s.totalAmountPending) : '—'} icon="⏳" />
        <KpiCard label="Total Paid" value={s ? formatCurrency(s.totalAmountPaid) : '—'} icon="💵" trend="up" />
        <KpiCard label="Bonus Types" value={s?.bonusTypesCount ?? BONUS_TYPES.length - 1} icon="📊" />
      </div>

      <div className="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-2 items-center">
        <span className="text-xs font-medium text-gray-600 mr-1">Filter by type:</span>
        {BONUS_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border ${
              typeFilter === t
                ? 'bg-primary-700 text-white border-primary-700'
                : 'bg-white text-gray-700 border-border hover:bg-gray-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {bonusesQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
          Bonuses API not yet available. Will appear once the Payroll backend module is deployed.
        </p>
      )}
      {!bonusesQuery.isError && (
        <DataTable<Bonus>
          columns={columns}
          data={bonuses}
          rowKey={(r) => r.id}
          searchableFields={['employeeName', 'employeeNumber', 'department', 'bonusType']}
          pageSize={15}
          emptyMessage="No bonuses declared yet."
        />
      )}
    </div>
  )
}
