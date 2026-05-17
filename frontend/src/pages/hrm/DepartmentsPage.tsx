import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'

type Department = {
  id: string
  name: string
  code: string
  headName?: string
  staffCount: number
  activeStaff: number
  isActive: boolean
}

type Summary = {
  totalDepartments: number
  activeDepartments: number
  totalStaff: number
}

export default function DepartmentsPage() {
  const [addOpen, setAddOpen] = useState(false)

  const summaryQuery = useQuery({
    queryKey: ['hrm-depts-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<Summary>('/hrm/departments/summary')
      return res.data
    },
    retry: false,
  })

  const deptsQuery = useQuery({
    queryKey: ['hrm-departments'],
    queryFn: async () => {
      const res = await axiosClient.get<Department[] | { items: Department[] }>('/hrm/departments')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const summary = summaryQuery.data
  const depts = deptsQuery.data ?? []

  const columns: Column<Department>[] = [
    {
      key: 'name',
      header: 'Department',
      render: (r) => <span className="font-medium text-gray-900">{r.name}</span>,
    },
    { key: 'code', header: 'Code', width: '90px' },
    { key: 'headName', header: 'Head of Dept', render: (r) => r.headName ?? '—' },
    { key: 'staffCount', header: 'Total Staff', width: '100px' },
    { key: 'activeStaff', header: 'Active', width: '80px' },
    {
      key: 'isActive',
      header: 'Status',
      width: '90px',
      render: (r) => (
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
            r.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {r.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Departments</h1>
          <p className="text-sm text-muted-foreground">Manage campus departments and department heads.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + New Department
        </button>
      </div>

      {addOpen && (
        <NewDepartmentForm onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); deptsQuery.refetch() }} />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Total Departments" value={summary?.totalDepartments ?? depts.length} icon="🏛️" />
        <KpiCard label="Active" value={summary?.activeDepartments ?? depts.filter((d) => d.isActive).length} icon="✅" />
        <KpiCard label="Total Staff" value={summary?.totalStaff ?? '—'} icon="👥" />
      </div>

      {deptsQuery.isLoading && <p className="text-muted-foreground">Loading departments…</p>}
      {deptsQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
          Departments API not yet available. Data will appear once the HRM backend module is deployed.
        </p>
      )}
      {!deptsQuery.isLoading && !deptsQuery.isError && (
        <DataTable<Department>
          columns={columns}
          data={depts}
          rowKey={(r) => r.id}
          searchableFields={['name', 'code', 'headName']}
          pageSize={15}
          emptyMessage="No departments configured yet."
        />
      )}
    </div>
  )
}

function NewDepartmentForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim()) return
    setSaving(true)
    try {
      await axiosClient.post('/hrm/departments', { name: name.trim(), code: code.trim() })
      onSaved()
    } catch {
      // error toast handled by interceptor
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5 mb-6">
      <h2 className="font-semibold text-gray-900 mb-3">New Department</h2>
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          placeholder="Department name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-input rounded-lg px-3 py-2 text-sm"
          required
        />
        <input
          placeholder="Code (e.g. CS)"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="border border-input rounded-lg px-3 py-2 text-sm"
          required
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-primary-700 hover:bg-primary-800 text-white rounded-lg px-3 py-2 text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 border border-border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
