import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { axiosClient } from '../../api/axiosClient'
import Modal from '../../components/ui/Modal'

type SchoolDetail = {
  id: string
  name: string
  code: string
  city: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logoUrl?: string
  isActive: boolean
}

type Props = { schoolId: string | null; onClose: () => void }

type FormState = {
  name: string
  city: string
  address: string
  phone: string
  email: string
  website: string
  logoUrl: string
}

const blank: FormState = {
  name: '', city: '', address: '', phone: '', email: '', website: '', logoUrl: '',
}

export default function EditSchoolDialog({ schoolId, onClose }: Props) {
  const qc = useQueryClient()
  const [form, setForm] = useState<FormState>(blank)

  const detailQuery = useQuery({
    queryKey: ['school-detail', schoolId],
    queryFn: async () => {
      const res = await axiosClient.get<SchoolDetail>(`/schools/${schoolId}`)
      return res.data
    },
    enabled: !!schoolId,
    staleTime: 0,
  })

  useEffect(() => {
    if (detailQuery.data) {
      const d = detailQuery.data
      setForm({
        name: d.name,
        city: d.city,
        address: d.address ?? '',
        phone: d.phone ?? '',
        email: d.email ?? '',
        website: d.website ?? '',
        logoUrl: d.logoUrl ?? '',
      })
    }
  }, [detailQuery.data])

  const update = useMutation({
    mutationFn: async () => {
      await axiosClient.put(
        `/schools/${schoolId}`,
        {
          name: form.name.trim(),
          city: form.city.trim(),
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          website: form.website.trim() || null,
          logoUrl: form.logoUrl.trim() || null,
        },
        { headers: { 'x-skip-error-toast': '1' } },
      )
    },
    onSuccess: () => {
      toast.success('School updated.')
      qc.invalidateQueries({ queryKey: ['schools'] })
      qc.invalidateQueries({ queryKey: ['schools-stats'] })
      qc.invalidateQueries({ queryKey: ['school-detail', schoolId] })
      onClose()
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string; title?: string } }; message?: string }
      toast.error(
        e.response?.data?.error ?? e.response?.data?.title ?? e.message ?? 'Failed to update school.',
      )
    },
  })

  const canSubmit = !!schoolId && !!form.name.trim() && !!form.city.trim() && !update.isPending

  const description = detailQuery.data
    ? `Editing: ${detailQuery.data.name} (${detailQuery.data.code})`
    : 'Loading…'

  return (
    <Modal
      open={!!schoolId}
      onClose={() => { if (!update.isPending) onClose() }}
      title="Edit School"
      description={description}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={update.isPending}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => update.mutate()}
            disabled={!canSubmit || detailQuery.isLoading}
            className="px-4 py-2 text-sm bg-primary-700 hover:bg-primary-800 text-white rounded-lg disabled:opacity-50"
          >
            {update.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      }
    >
      {detailQuery.isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          Loading school details…
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); if (canSubmit) update.mutate() }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <Field
            label="School Name *"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            className="md:col-span-2"
          />
          <Field
            label="City *"
            value={form.city}
            onChange={(v) => setForm({ ...form, city: v })}
          />
          <Field
            label="Address"
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
            className="md:col-span-2"
          />
          <Field
            label="Phone"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
            placeholder="021-xxxxxxx"
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
          />
          <Field
            label="Website"
            value={form.website}
            onChange={(v) => setForm({ ...form, website: v })}
            placeholder="https://…"
          />
          <Field
            label="Logo URL"
            value={form.logoUrl}
            onChange={(v) => setForm({ ...form, logoUrl: v })}
            placeholder="https://cdn…/logo.png"
          />
        </form>
      )}
    </Modal>
  )
}

function Field({
  label, value, onChange, type = 'text', placeholder, className = '',
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
