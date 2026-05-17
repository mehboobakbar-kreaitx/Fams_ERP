import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatCurrency, formatDate } from '../../lib/utils'

type DepreciationRecord = {
  id: string
  assetCode: string
  assetName: string
  category: string
  purchaseDate: string
  purchaseCost: number
  usefulLifeYears: number
  depreciationMethod: 'StraightLine' | 'DecliningBalance'
  annualDepreciation: number
  accumulatedDepreciation: number
  currentBookValue: number
  residualValue: number
  fullyDepreciatedDate?: string
  lastDepreciationDate?: string
  ageYears: number
}

type DepreciationSummary = {
  totalAssets: number
  totalPurchaseCost: number
  totalBookValue: number
  totalAccumulatedDepreciation: number
  fullyDepreciatedCount: number
  depreciationThisYear: number
}

const FISCAL_YEARS = ['2025-26', '2024-25', '2023-24']

export default function DepreciationPage() {
  const [fiscalYear, setFiscalYear] = useState(FISCAL_YEARS[0])
  const [method, setMethod] = useState<'All' | 'StraightLine' | 'DecliningBalance'>('All')

  const summaryQuery = useQuery({
    queryKey: ['depreciation-summary', fiscalYear],
    queryFn: async () => {
      const res = await axiosClient.get<DepreciationSummary>('/assets/depreciation/summary', { params: { fiscalYear } })
      return res.data
    },
    retry: false,
  })

  const depreciationQuery = useQuery({
    queryKey: ['depreciation', fiscalYear, method],
    queryFn: async () => {
      const params: Record<string, string> = { fiscalYear }
      if (method !== 'All') params.method = method
      const res = await axiosClient.get<DepreciationRecord[] | { items: DepreciationRecord[] }>('/assets/depreciation', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const s = summaryQuery.data
  const records = depreciationQuery.data ?? []

  const columns: Column<DepreciationRecord>[] = [
    {
      key: 'assetCode',
      header: 'Asset',
      render: (r) => (
        <div>
          <p className="font-mono text-xs font-semibold text-primary-700">{r.assetCode}</p>
          <p className="font-medium text-gray-900">{r.assetName}</p>
          <p className="text-xs text-muted-foreground">{r.category}</p>
        </div>
      ),
    },
    {
      key: 'depreciationMethod',
      header: 'Method',
      width: '130px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${r.depreciationMethod === 'StraightLine' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
          {r.depreciationMethod === 'StraightLine' ? 'Straight Line' : 'Declining Bal.'}
        </span>
      ),
    },
    {
      key: 'purchaseCost',
      header: 'Purchase Cost',
      width: '130px',
      render: (r) => formatCurrency(r.purchaseCost),
    },
    {
      key: 'annualDepreciation',
      header: 'Annual Dep.',
      width: '120px',
      render: (r) => <span className="text-red-600">{formatCurrency(r.annualDepreciation)}</span>,
    },
    {
      key: 'accumulatedDepreciation',
      header: 'Accumulated',
      width: '120px',
      render: (r) => <span className="text-red-700 font-medium">{formatCurrency(r.accumulatedDepreciation)}</span>,
    },
    {
      key: 'currentBookValue',
      header: 'Book Value',
      width: '120px',
      render: (r) => {
        const pct = r.purchaseCost > 0 ? (r.currentBookValue / r.purchaseCost) * 100 : 0
        return (
          <div>
            <p className={`font-semibold ${pct < 20 ? 'text-red-600' : pct < 50 ? 'text-amber-600' : 'text-emerald-700'}`}>
              {formatCurrency(r.currentBookValue)}
            </p>
            <p className="text-xs text-muted-foreground">{pct.toFixed(0)}% of cost</p>
          </div>
        )
      },
    },
    {
      key: 'ageYears',
      header: 'Age / Life',
      width: '100px',
      render: (r) => (
        <div>
          <div className="flex-1 bg-gray-100 rounded-full h-1.5 mb-1">
            <div
              className={`h-1.5 rounded-full ${r.ageYears >= r.usefulLifeYears ? 'bg-red-500' : 'bg-primary-500'}`}
              style={{ width: `${Math.min((r.ageYears / r.usefulLifeYears) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{r.ageYears.toFixed(1)} / {r.usefulLifeYears} yrs</p>
        </div>
      ),
    },
    {
      key: 'fullyDepreciatedDate',
      header: 'Fully Dep.',
      width: '105px',
      render: (r) => r.fullyDepreciatedDate
        ? <span className="font-mono text-xs text-amber-700">{formatDate(r.fullyDepreciatedDate)}</span>
        : <span className="text-muted-foreground text-xs">—</span>,
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Depreciation</h1>
          <p className="text-sm text-muted-foreground">Asset depreciation schedules, book values and accumulated depreciation.</p>
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-xs font-medium text-gray-700">Fiscal Year:</label>
          <select value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm">
            {FISCAL_YEARS.map((y) => <option key={y}>{y}</option>)}
          </select>
          <button className="border border-border hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium">
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Assets"        value={s?.totalAssets ?? '—'}                               icon="🗂️" />
        <KpiCard label="Total Book Value"    value={s ? formatCurrency(s.totalBookValue) : '—'}          icon="💰" />
        <KpiCard label="Accumulated Dep."   value={s ? formatCurrency(s.totalAccumulatedDepreciation) : '—'} icon="📉" trend="down" />
        <KpiCard label="Dep. This Year"     value={s ? formatCurrency(s.depreciationThisYear) : '—'}    icon="📊" />
      </div>

      {/* Method filter */}
      <div className="flex gap-2 mb-4">
        {(['All', 'StraightLine', 'DecliningBalance'] as const).map((m) => (
          <button key={m} onClick={() => setMethod(m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${method === m ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-border hover:bg-gray-50'}`}>
            {m === 'All' ? 'All Methods' : m === 'StraightLine' ? 'Straight Line' : 'Declining Balance'}
          </button>
        ))}
      </div>

      {depreciationQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Depreciation API not yet available. Will appear once the Asset backend module is deployed.
        </p>
      )}

      {!depreciationQuery.isLoading && !depreciationQuery.isError && (
        <DataTable<DepreciationRecord>
          columns={columns}
          data={records}
          rowKey={(r) => r.id}
          searchableFields={['assetCode', 'assetName', 'category']}
          pageSize={15}
          emptyMessage="No depreciation records found."
        />
      )}
    </div>
  )
}
