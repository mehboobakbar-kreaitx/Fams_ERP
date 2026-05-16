import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { axiosClient } from '../../api/axiosClient'
import { cn } from '../../lib/utils'

type Tab = 'academic' | 'fees' | 'grading' | 'notifications'

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'academic',      label: 'Academic Terms',    icon: '🗓️' },
  { id: 'fees',          label: 'Fee Templates',     icon: '💰' },
  { id: 'grading',       label: 'Grading Scales',    icon: '📊' },
  { id: 'notifications', label: 'Notifications',     icon: '🔔' },
]

export default function SystemConfigPage() {
  const [tab, setTab] = useState<Tab>('academic')

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">System Configuration</h1>
      <p className="text-sm text-muted-foreground mb-6">Institution-wide settings applied across all campuses.</p>

      <div className="border-b border-border mb-4 flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2 text-sm border-b-2 -mb-px transition-colors',
              tab === t.id
                ? 'border-primary-700 text-primary-700 font-semibold'
                : 'border-transparent text-gray-600 hover:text-primary-700',
            )}
          >
            <span className="mr-2">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        {tab === 'academic'      && <AcademicTab />}
        {tab === 'fees'          && <FeeTemplatesTab />}
        {tab === 'grading'       && <GradingScalesTab />}
        {tab === 'notifications' && <NotificationsTab />}
      </div>
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

type AcademicTerm = {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

type FeeStructure = {
  id: string
  termName: string
  programName: string
  totalAmount: number
  isActive: boolean
  heads: { id: string; name: string; amount: number; dueDayOfMonth: number }[]
}

type GradingRule = {
  id?: string
  grade: string
  minPercent: number
  maxPercent: number
  gpaPoint: number
}

type GradingScaleData = { scaleId?: string; rules: GradingRule[] }

type NotificationTemplate = {
  event: string
  channel: string
  status: string
}

// ── Tab 1: Academic Terms ─────────────────────────────────────────────────────

function AcademicTab() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '' })

  const { data: terms = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['config-terms'],
    queryFn: async () => {
      const res = await axiosClient.get<AcademicTerm[]>('/config/terms')
      return res.data
    },
  })

  const create = useMutation({
    mutationFn: async () => {
      await axiosClient.post('/config/terms', {
        name: form.name.trim(),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      }, { headers: { 'x-skip-error-toast': '1' } })
    },
    onSuccess: () => {
      toast.success('Term created.')
      setForm({ name: '', startDate: '', endDate: '' })
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ['config-terms'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error(e.response?.data?.error ?? e.message ?? 'Failed to create term.')
    },
  })

  const canSubmit = form.name.trim() && form.startDate && form.endDate && !create.isPending

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">Academic Terms</h2>
          <p className="text-sm text-muted-foreground">Define academic terms applied across campuses.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 text-sm border border-input rounded-lg hover:bg-gray-50"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary-700 hover:bg-primary-800 text-white px-3 py-1.5 text-sm rounded-lg"
          >
            {showForm ? 'Cancel' : '+ Add Term'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-4 p-4 border border-border rounded-lg bg-gray-50 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            className="border border-input rounded-lg px-3 py-2 text-sm sm:col-span-2"
            placeholder="Term name (e.g. Spring 2027)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="date"
            className="border border-input rounded-lg px-3 py-2 text-sm"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <input
            type="date"
            className="border border-input rounded-lg px-3 py-2 text-sm"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
          <button
            onClick={() => create.mutate()}
            disabled={!canSubmit}
            className="sm:col-span-4 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 text-sm rounded-lg disabled:opacity-50 w-fit ml-auto"
          >
            {create.isPending ? 'Saving…' : 'Save Term'}
          </button>
        </div>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading terms…</p>}
      {isError && <p className="text-sm text-red-600">Failed to load terms. <button onClick={() => refetch()} className="underline">Retry</button></p>}

      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Term</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Start</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">End</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          {terms.length === 0 && !isLoading && (
            <tr><td colSpan={4} className="px-3 py-8 text-center text-gray-500 text-sm">No terms defined yet.</td></tr>
          )}
          {terms.map((t) => (
            <tr key={t.id} className="border-b border-border">
              <td className="px-3 py-2 font-medium">{t.name}</td>
              <td className="px-3 py-2">{t.startDate.slice(0, 10)}</td>
              <td className="px-3 py-2">{t.endDate.slice(0, 10)}</td>
              <td className="px-3 py-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                  {t.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Tab 2: Fee Templates ──────────────────────────────────────────────────────

function FeeTemplatesTab() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ programId: '', termName: '', feeHeadName: '', amount: '', dueDayOfMonth: '10' })
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: structures = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['config-fee-templates'],
    queryFn: async () => {
      const res = await axiosClient.get<FeeStructure[]>('/config/fee-templates')
      return res.data
    },
  })

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const res = await axiosClient.get<{ id: string; name: string }[]>('/programs')
      return res.data
    },
  })

  const create = useMutation({
    mutationFn: async () => {
      await axiosClient.post('/config/fee-templates', {
        programId: form.programId,
        termName: form.termName.trim(),
        feeHeadName: form.feeHeadName.trim(),
        amount: parseFloat(form.amount) || 0,
        dueDayOfMonth: parseInt(form.dueDayOfMonth) || 10,
      }, { headers: { 'x-skip-error-toast': '1' } })
    },
    onSuccess: () => {
      toast.success('Fee template created.')
      setForm({ programId: '', termName: '', feeHeadName: '', amount: '', dueDayOfMonth: '10' })
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ['config-fee-templates'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error(e.response?.data?.error ?? e.message ?? 'Failed to create fee template.')
    },
  })

  const canSubmit = form.programId && form.termName.trim() && form.feeHeadName.trim() && parseFloat(form.amount) > 0 && !create.isPending

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">Fee Structure Templates</h2>
          <p className="text-sm text-muted-foreground">Per-program fee heads applied when invoices are generated.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="px-3 py-1.5 text-sm border border-input rounded-lg hover:bg-gray-50">Refresh</button>
          <button onClick={() => setShowForm(!showForm)} className="bg-primary-700 hover:bg-primary-800 text-white px-3 py-1.5 text-sm rounded-lg">
            {showForm ? 'Cancel' : '+ Add Template'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-4 p-4 border border-border rounded-lg bg-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Program *</label>
            <select
              className="w-full border border-input rounded-lg px-3 py-2 text-sm"
              value={form.programId}
              onChange={(e) => setForm({ ...form, programId: e.target.value })}
            >
              <option value="">— Select program —</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <InlineField label="Term Name *" value={form.termName} onChange={(v) => setForm({ ...form, termName: v })} placeholder="e.g. Spring 2027" />
          <InlineField label="Fee Head Name *" value={form.feeHeadName} onChange={(v) => setForm({ ...form, feeHeadName: v })} placeholder="e.g. Tuition Fee" />
          <InlineField label="Amount (PKR) *" type="number" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} placeholder="12000" />
          <InlineField label="Due Day of Month" type="number" value={form.dueDayOfMonth} onChange={(v) => setForm({ ...form, dueDayOfMonth: v })} placeholder="10" />
          <div className="sm:col-span-2 flex justify-end">
            <button onClick={() => create.mutate()} disabled={!canSubmit} className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 text-sm rounded-lg disabled:opacity-50">
              {create.isPending ? 'Saving…' : 'Save Template'}
            </button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading fee templates…</p>}
      {isError && <p className="text-sm text-red-600">Failed to load fee templates. <button onClick={() => refetch()} className="underline">Retry</button></p>}

      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Program</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Term</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Total (PKR)</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Status</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Details</th>
          </tr>
        </thead>
        <tbody>
          {structures.length === 0 && !isLoading && (
            <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-500 text-sm">No fee templates defined yet.</td></tr>
          )}
          {structures.map((s) => (
            <>
              <tr key={s.id} className="border-b border-border hover:bg-gray-50/50">
                <td className="px-3 py-2 font-medium">{s.programName}</td>
                <td className="px-3 py-2">{s.termName}</td>
                <td className="px-3 py-2">PKR {s.totalAmount.toLocaleString()}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                    className="text-xs text-primary-700 hover:underline"
                  >
                    {expanded === s.id ? 'Hide' : `${s.heads.length} head${s.heads.length !== 1 ? 's' : ''}`}
                  </button>
                </td>
              </tr>
              {expanded === s.id && s.heads.map((h) => (
                <tr key={h.id} className="bg-gray-50 text-xs border-b border-border">
                  <td className="px-3 py-1.5 pl-8 text-gray-600" colSpan={2}>{h.name}</td>
                  <td className="px-3 py-1.5 text-gray-600">PKR {h.amount.toLocaleString()}</td>
                  <td className="px-3 py-1.5 text-gray-500">Due day {h.dueDayOfMonth}</td>
                  <td />
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Tab 3: Grading Scales ─────────────────────────────────────────────────────

function GradingScalesTab() {
  const qc = useQueryClient()
  const [rules, setRules] = useState<GradingRule[]>([])
  const [dirty, setDirty] = useState(false)

  const { data: scaleData, isLoading, isError, refetch } = useQuery({
    queryKey: ['config-grading-scale'],
    queryFn: async () => {
      const res = await axiosClient.get<GradingScaleData>('/config/grading-scales')
      return res.data
    },
    staleTime: 0,
  })

  useEffect(() => {
    if (scaleData) {
      setRules(scaleData.rules)
      setDirty(false)
    }
  }, [scaleData])

  const save = useMutation({
    mutationFn: async () => {
      await axiosClient.put('/config/grading-scales', {
        rules: rules.map((r) => ({
          grade: r.grade,
          minPercent: Number(r.minPercent),
          maxPercent: Number(r.maxPercent),
          gpaPoint: Number(r.gpaPoint),
        })),
      }, { headers: { 'x-skip-error-toast': '1' } })
    },
    onSuccess: () => {
      toast.success('Grading scale saved.')
      setDirty(false)
      qc.invalidateQueries({ queryKey: ['config-grading-scale'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      toast.error(e.response?.data?.error ?? e.message ?? 'Failed to save grading scale.')
    },
  })

  const updateRule = (idx: number, field: keyof GradingRule, value: string) => {
    setRules((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
    setDirty(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">Grading Scale</h2>
          <p className="text-sm text-muted-foreground">Percentage-to-grade rules applied when marks are saved.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { refetch(); setDirty(false) }} className="px-3 py-1.5 text-sm border border-input rounded-lg hover:bg-gray-50">Refresh</button>
          <button
            onClick={() => save.mutate()}
            disabled={!dirty || save.isPending}
            className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-1.5 text-sm rounded-lg disabled:opacity-50"
          >
            {save.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading grading scale…</p>}
      {isError && <p className="text-sm text-red-600">Failed to load grading scale. <button onClick={() => refetch()} className="underline">Retry</button></p>}

      {!isLoading && (
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-gray-700 w-24">Grade</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-700 w-28">Min %</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-700 w-28">Max %</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-700 w-28">GPA</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r, i) => (
              <tr key={i} className="border-b border-border">
                <td className="px-3 py-1.5">
                  <input
                    className="w-full border border-input rounded px-2 py-1 text-sm font-semibold"
                    value={r.grade}
                    onChange={(e) => updateRule(i, 'grade', e.target.value)}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    className="w-full border border-input rounded px-2 py-1 text-sm"
                    value={r.minPercent}
                    onChange={(e) => updateRule(i, 'minPercent', e.target.value)}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    className="w-full border border-input rounded px-2 py-1 text-sm"
                    value={r.maxPercent}
                    onChange={(e) => updateRule(i, 'maxPercent', e.target.value)}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border border-input rounded px-2 py-1 text-sm"
                    value={r.gpaPoint}
                    onChange={(e) => updateRule(i, 'gpaPoint', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {dirty && <p className="text-xs text-amber-600 mt-2">Unsaved changes — click Save Changes to persist.</p>}
    </div>
  )
}

// ── Tab 4: Notification Templates ────────────────────────────────────────────

function NotificationsTab() {
  const { data: templates = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['config-notification-templates'],
    queryFn: async () => {
      const res = await axiosClient.get<NotificationTemplate[]>('/config/notification-templates')
      return res.data
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">Notification Templates</h2>
          <p className="text-sm text-muted-foreground">Channels and events fired by the dispatcher when system events occur.</p>
        </div>
        <button onClick={() => refetch()} className="px-3 py-1.5 text-sm border border-input rounded-lg hover:bg-gray-50">Refresh</button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && <p className="text-sm text-red-600">Failed to load. <button onClick={() => refetch()} className="underline">Retry</button></p>}

      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Event</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Channels</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.event} className="border-b border-border">
              <td className="px-3 py-2 font-medium">{t.event.replace(/([A-Z])/g, ' $1').trim()}</td>
              <td className="px-3 py-2 text-gray-600">{t.channel}</td>
              <td className="px-3 py-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.status === 'Live' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                  {t.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Shared ────────────────────────────────────────────────────────────────────

function InlineField({
  label, value, onChange, type = 'text', placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  )
}
