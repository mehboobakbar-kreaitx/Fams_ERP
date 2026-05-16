import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import { formatCurrency } from '../../lib/utils'
import AddSchoolDialog from './AddSchoolDialog'
import EditSchoolDialog from './EditSchoolDialog'

// ── Types ────────────────────────────────────────────────────────────────────

type School = {
  id: string
  name: string
  code: string
  city: string
  isActive: boolean
  campusCount: number
  studentCount: number
  staffCount: number
  logoUrl?: string
}

type PaginatedSchools = {
  items: School[]
  totalCount: number
  totalPages: number
  pageNumber: number
  pageSize: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border animate-pulse">
      {[80, 180, 110, 70, 70, 60, 80, 140].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-gray-200" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SchoolsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null)
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  // 300 ms debounce on search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [debouncedSearch, activeFilter])

  // ── Stats query (no filters — always full picture for KPI cards) ──────────
  const statsQuery = useQuery({
    queryKey: ['schools-stats'],
    queryFn: async () => {
      const res = await axiosClient.get<PaginatedSchools>('/schools', {
        params: { pageSize: 500 },
      })
      return res.data
    },
    staleTime: 30_000,
  })

  // ── Table query (respects search + activeFilter) ──────────────────────────
  const tableQuery = useQuery({
    queryKey: ['schools', debouncedSearch, activeFilter, page],
    queryFn: async () => {
      const params: Record<string, unknown> = { pageNumber: page, pageSize: 20 }
      if (debouncedSearch) params.search = debouncedSearch
      if (activeFilter !== null) params.isActive = activeFilter
      const res = await axiosClient.get<PaginatedSchools>('/schools', { params })
      return res.data
    },
  })

  // ── Revenue (reuse existing executive dashboard query) ───────────────────
  const revenueQuery = useQuery({
    queryKey: ['dashboard-executive'],
    queryFn: async () => {
      const res = await axiosClient.get<{ totalMonthlyRevenue: number }>('/dashboard/executive')
      return res.data
    },
    staleTime: 5 * 60_000,
  })

  // ── Toggle status ─────────────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: async (school: School) => {
      // PATCH /schools/{id}/status — backend endpoint to be wired to
      // School.Activate() / School.Deactivate() commands.
      await axiosClient.patch(
        `/schools/${school.id}/status`,
        { isActive: !school.isActive },
        { headers: { 'x-skip-error-toast': '1' } },
      )
    },
    onSuccess: (_data, school) => {
      toast.success(`${school.name} ${school.isActive ? 'deactivated' : 'activated'}.`)
      qc.invalidateQueries({ queryKey: ['schools'] })
      qc.invalidateQueries({ queryKey: ['schools-stats'] })
    },
    onError: (_err, school) => {
      toast.error(`Failed to update status for ${school.name}.`)
    },
  })

  const confirmToggle = useCallback(
    (school: School) => {
      const action = school.isActive ? 'Deactivate' : 'Activate'
      toast.custom(
        (t) => (
          <div className="bg-white border border-border rounded-xl shadow-lg px-5 py-4 flex flex-col gap-3 min-w-[280px]">
            <p className="text-sm text-gray-900">
              {action}{' '}
              <span className="font-semibold">{school.name}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id)
                  toggleMutation.mutate(school)
                }}
                className={`px-3 py-1.5 text-sm rounded-lg text-white ${
                  school.isActive
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {action}
              </button>
            </div>
          </div>
        ),
        { duration: Infinity },
      )
    },
    [toggleMutation],
  )

  // ── Derived stats ─────────────────────────────────────────────────────────
  const statsItems = statsQuery.data?.items ?? []
  const totalSchools = statsQuery.data?.totalCount ?? 0
  const activeSchools = statsItems.filter((s) => s.isActive).length
  const totalStudents = statsItems.reduce((sum, s) => sum + (s.studentCount ?? 0), 0)
  const monthlyRevenue = revenueQuery.data?.totalMonthlyRevenue ?? 0

  const schools = tableQuery.data?.items ?? []
  const totalPages = tableQuery.data?.totalPages ?? 1
  const totalCount = tableQuery.data?.totalCount ?? 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Schools</h1>
          <p className="text-sm text-muted-foreground">
            {statsQuery.isLoading
              ? 'Loading…'
              : `${totalSchools} school${totalSchools !== 1 ? 's' : ''} in the network.`}
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add School
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Schools"
          value={statsQuery.isLoading ? '…' : totalSchools.toLocaleString()}
          icon="🏛️"
        />
        <KpiCard
          label="Active Schools"
          value={statsQuery.isLoading ? '…' : activeSchools.toLocaleString()}
          hint={
            totalSchools > 0
              ? `${Math.round((activeSchools / totalSchools) * 100)}% of network`
              : undefined
          }
          icon="✅"
        />
        <KpiCard
          label="Total Students"
          value={statsQuery.isLoading ? '…' : totalStudents.toLocaleString()}
          hint="across all schools"
          icon="👥"
        />
        <KpiCard
          label="Monthly Revenue"
          value={revenueQuery.isLoading ? '…' : formatCurrency(monthlyRevenue)}
          icon="💰"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, code or city…"
          className="border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-72"
        />

        <div className="flex gap-1">
          {([null, true, false] as (boolean | null)[]).map((v) => (
            <button
              key={String(v)}
              onClick={() => setActiveFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                activeFilter === v
                  ? 'bg-primary-700 text-white border-primary-700'
                  : 'border-border text-gray-600 hover:bg-gray-50'
              }`}
            >
              {v === null ? 'All' : v ? 'Active' : 'Inactive'}
            </button>
          ))}
        </div>

        {tableQuery.isFetching && !tableQuery.isLoading && (
          <span className="text-xs text-muted-foreground">Updating…</span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-24">Code</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">School Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">City</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-24">Campuses</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-24">Students</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-20">Staff</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-24">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-44">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Loading skeleton */}
              {tableQuery.isLoading &&
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

              {/* Error state */}
              {tableQuery.isError && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-red-600 text-sm">
                    Failed to load schools. Please try again.
                  </td>
                </tr>
              )}

              {/* Empty state */}
              {!tableQuery.isLoading && !tableQuery.isError && schools.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-5xl select-none">🏛️</span>
                      <p className="text-gray-500 font-medium">
                        {debouncedSearch || activeFilter !== null
                          ? 'No schools match your filters.'
                          : 'No schools yet. Add your first school.'}
                      </p>
                      {!debouncedSearch && activeFilter === null && (
                        <button
                          onClick={() => setAddOpen(true)}
                          className="mt-1 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          + Add School
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {schools.map((school) => (
                <tr
                  key={school.id}
                  className="border-b border-border last:border-b-0 hover:bg-gray-50/50"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {school.code}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{school.name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{school.city}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {(school.campusCount ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {(school.studentCount ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {(school.staffCount ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        school.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {school.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => navigate(`/super-admin/schools/${school.id}`)}
                        className="px-2.5 py-1 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-md"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setEditId(school.id)}
                        className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmToggle(school)}
                        disabled={toggleMutation.isPending}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md disabled:opacity-50 transition-colors ${
                          school.isActive
                            ? 'text-red-700 bg-red-50 hover:bg-red-100'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {school.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
            <span className="text-muted-foreground">
              Page {page} of {totalPages} · {totalCount} schools
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-input rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 border border-input rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddSchoolDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <EditSchoolDialog schoolId={editId} onClose={() => setEditId(null)} />
    </div>
  )
}
