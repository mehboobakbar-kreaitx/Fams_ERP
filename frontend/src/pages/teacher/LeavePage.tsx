import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { axiosClient } from '../../api/axiosClient'
import { authStore } from '../../store/authStore'
import { formatDate } from '../../lib/utils'

type LeaveRequest = {
  id: string
  leaveType: string
  fromDate: string
  toDate: string
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
  appliedAt: string
}

export default function LeavePage() {
  const qc = useQueryClient()
  const { user } = authStore.getState()
  const [form, setForm] = useState({ leaveType: 'Casual', fromDate: '', toDate: '', reason: '' })

  const history = useQuery({
    queryKey: ['leave-history', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await axiosClient.get<LeaveRequest[] | { items: LeaveRequest[] }>(`/hrm/leaves`, {
        params: { staffId: user!.id },
        headers: { 'x-skip-error-toast': '1' },
      })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: 0,
  })

  const apply = useMutation({
    mutationFn: async () => {
      if (!form.fromDate || !form.toDate || !form.reason.trim()) {
        throw new Error('Fill in dates and a reason.')
      }
      const { data } = await axiosClient.post<{ id: string }>('/hrm/leaves', {
        employeeId: user?.id,
        leaveType: form.leaveType,
        fromDate: form.fromDate,
        toDate: form.toDate,
        reason: form.reason.trim(),
      }, { headers: { 'x-skip-error-toast': '1' } })
      return data
    },
    onSuccess: () => {
      toast.success('Leave request submitted.')
      setForm({ leaveType: 'Casual', fromDate: '', toDate: '', reason: '' })
      qc.invalidateQueries({ queryKey: ['leave-history'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string; title?: string } }; message?: string }
      toast.error(e.response?.data?.error ?? e.response?.data?.title ?? e.message ?? 'Could not submit request.')
    },
  })

  const canSubmit = form.fromDate && form.toDate && form.reason.trim() && !apply.isPending

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Apply for Leave</h1>
      <p className="text-sm text-muted-foreground mb-6">Submit a leave request and track its status.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={(e) => { e.preventDefault(); if (canSubmit) apply.mutate() }}
          className="bg-white rounded-xl border border-border p-5 space-y-4"
        >
          <h2 className="font-semibold text-gray-900">New Request</h2>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Leave Type</label>
            <select
              value={form.leaveType}
              onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm"
            >
              <option>Casual</option>
              <option>Sick</option>
              <option>Earned</option>
              <option>Unpaid</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
              <input
                type="date"
                value={form.fromDate}
                onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
              <input
                type="date"
                value={form.toDate}
                onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={4}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm"
              placeholder="Briefly describe the reason for leave"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-primary-700 hover:bg-primary-800 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            {apply.isPending ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>

        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-gray-900 mb-3">My Requests</h2>
          {history.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {history.isError && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              Leave history endpoint not yet available.
            </div>
          )}
          {!history.isLoading && !history.isError && (
            <div className="space-y-2">
              {(history.data ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No leave requests yet.</p>
              )}
              {(history.data ?? []).map((r) => (
                <div key={r.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{r.leaveType}</span>
                    <StatusPill status={r.status} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(r.fromDate)} → {formatDate(r.toDate)}
                  </div>
                  <p className="text-sm mt-1">{r.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: LeaveRequest['status'] }) {
  const cls =
    status === 'Approved'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'Rejected'
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700'
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>
}
