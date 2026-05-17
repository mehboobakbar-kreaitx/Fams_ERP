import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { axiosClient } from '../../api/axiosClient'
import Modal from '../../components/ui/Modal'

type Props = { open: boolean; onClose: () => void }

type School = { id: string; name: string; code: string }

type FormState = {
  schoolId: string
  name: string
  code: string
  city: string
  address: string
  phone: string
  email: string
  principalName: string
  maxCapacity: number
  isMainCampus: boolean
}

const empty: FormState = {
  schoolId: '',
  name: '',
  code: '',
  city: '',
  address: '',
  phone: '',
  email: '',
  principalName: '',
  maxCapacity: 1000,
  isMainCampus: false,
}

export default function AddCampusDialog({ open, onClose }: Props) {
  const qc = useQueryClient()
  const [form, setForm] = useState<FormState>(empty)

  const schools = useQuery({
    queryKey: ['schools-list-for-campus'],
    queryFn: async () => {
      const res = await axiosClient.get<{ items: School[] } | School[]>('/schools', {
        params: { pageSize: 500 },
      })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    staleTime: 60_000,
  })

  const create = useMutation({
    mutationFn: async () => {
      const payload = {
        schoolId: form.schoolId,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        city: form.city.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        principalName: form.principalName.trim(),
        maxCapacity: Number(form.maxCapacity) || 0,
        isMainCampus: form.isMainCampus,
      }
      const { data } = await axiosClient.post<{ id: string }>('/campuses', payload, {
        headers: { 'x-skip-error-toast': '1' },
      })
      return data
    },
    onSuccess: () => {
      toast.success('Campus added.')
      setForm(empty)
      qc.invalidateQueries({ queryKey: ['campuses'] })
      qc.invalidateQueries({ queryKey: ['dashboard-executive'] })
      qc.invalidateQueries({ queryKey: ['dashboard-executive-campuses'] })
      onClose()
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string; title?: string } }; message?: string }
      toast.error(e.response?.data?.error ?? e.response?.data?.title ?? e.message ?? 'Failed to add campus.')
    },
  })

  const canSubmit =
    form.schoolId &&
    form.name.trim() &&
    form.code.trim() &&
    form.city.trim() &&
    form.address.trim() &&
    form.phone.trim() &&
    form.email.trim() &&
    form.principalName.trim() &&
    Number(form.maxCapacity) > 0 &&
    !create.isPending

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!create.isPending) { setForm(empty); onClose() }
      }}
      title="Add Campus"
      description="Register a new campus in the FAMS network. Codes must be unique."
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => { setForm(empty); onClose() }}
            disabled={create.isPending}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => create.mutate()}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm bg-primary-700 hover:bg-primary-800 text-white rounded-lg disabled:opacity-50"
          >
            {create.isPending ? 'Saving…' : 'Save Campus'}
          </button>
        </div>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (canSubmit) create.mutate()
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">School *</label>
          <select
            value={form.schoolId}
            onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">— select a school —</option>
            {(schools.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>
        <Field label="Campus Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Falcon College — …" className="md:col-span-2" />
        <Field label="Code *" value={form.code} onChange={(v) => setForm({ ...form, code: v.toUpperCase() })} placeholder="FC-32" />
        <Field label="City *" value={form.city} onChange={(v) => setForm({ ...form, city: v })} placeholder="e.g. Karachi" />
        <Field label="Address *" value={form.address} onChange={(v) => setForm({ ...form, address: v })} className="md:col-span-2" />
        <Field label="Phone *" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="021-xxxxxxx" />
        <Field label="Email *" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="campus@falcon.edu.pk" />
        <Field label="Principal Name *" value={form.principalName} onChange={(v) => setForm({ ...form, principalName: v })} />
        <Field
          label="Max Capacity *"
          type="number"
          value={String(form.maxCapacity)}
          onChange={(v) => setForm({ ...form, maxCapacity: Number(v) || 0 })}
        />
        <label className="md:col-span-2 flex items-center gap-2 text-sm text-gray-700 mt-1">
          <input
            type="checkbox"
            checked={form.isMainCampus}
            onChange={(e) => setForm({ ...form, isMainCampus: e.target.checked })}
            className="w-4 h-4"
          />
          Mark this as the Main HQ Campus
        </label>
      </form>
    </Modal>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  className = '',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  className?: string
}) {
  return (
    <div className={className}>
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
