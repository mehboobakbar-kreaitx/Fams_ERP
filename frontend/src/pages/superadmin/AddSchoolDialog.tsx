import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { axiosClient } from '../../api/axiosClient'
import Modal from '../../components/ui/Modal'

type Props = { open: boolean; onClose: () => void }

type FormState = {
  name: string
  code: string
  city: string
  address: string
  phone: string
  email: string
  website: string
  logoUrl: string
}

type CreatedCreds = {
  id: string
  adminEmail: string
  adminPassword: string
}

const empty: FormState = {
  name: '', code: '', city: '', address: '',
  phone: '', email: '', website: '', logoUrl: '',
}

export default function AddSchoolDialog({ open, onClose }: Props) {
  const qc = useQueryClient()
  const [form, setForm] = useState<FormState>(empty)
  const [creds, setCreds] = useState<CreatedCreds | null>(null)

  const create = useMutation({
    mutationFn: async () => {
      const { data } = await axiosClient.post<CreatedCreds>(
        '/schools',
        {
          name:    form.name.trim(),
          code:    form.code.trim().toUpperCase(),
          city:    form.city.trim(),
          address: form.address.trim() || null,
          phone:   form.phone.trim() || null,
          email:   form.email.trim() || null,
          website: form.website.trim() || null,
          logoUrl: form.logoUrl.trim() || null,
        },
        { headers: { 'x-skip-error-toast': '1' } },
      )
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['schools'] })
      qc.invalidateQueries({ queryKey: ['schools-stats'] })
      setCreds(data)
      setForm(empty)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string; title?: string } }; message?: string }
      toast.error(
        e.response?.data?.error ?? e.response?.data?.title ?? e.message ?? 'Failed to create school.',
      )
    },
  })

  const handleClose = () => {
    if (create.isPending) return
    setCreds(null)
    setForm(empty)
    onClose()
  }

  // ── Credentials panel (shown after successful creation) ───────────────────
  if (creds) {
    return (
      <Modal
        open={open}
        onClose={handleClose}
        title="School Created"
        description="Save these credentials now — the password will not be shown again."
        size="md"
        footer={
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm bg-primary-700 hover:bg-primary-800 text-white rounded-lg"
            >
              Done
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            This password is shown <strong>once</strong>. Copy it before closing this dialog.
          </div>
          <CredField label="Admin Email" value={creds.adminEmail} />
          <CredField label="Temporary Password" value={creds.adminPassword} secret />
        </div>
      </Modal>
    )
  }

  // ── Creation form ─────────────────────────────────────────────────────────
  const canSubmit =
    !!form.name.trim() && !!form.code.trim() && !!form.city.trim() && !create.isPending

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add School"
      description="Register a new school. A School Admin account will be generated automatically."
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
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
            {create.isPending ? 'Creating…' : 'Create School'}
          </button>
        </div>
      }
    >
      <form
        onSubmit={(e) => { e.preventDefault(); if (canSubmit) create.mutate() }}
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        <Field
          label="School Name *"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          placeholder="Falcon Academy…"
          className="md:col-span-2"
        />
        <Field
          label="Code *"
          value={form.code}
          onChange={(v) => setForm({ ...form, code: v.toUpperCase() })}
          placeholder="FA-001"
        />
        <Field
          label="City *"
          value={form.city}
          onChange={(v) => setForm({ ...form, city: v })}
          placeholder="e.g. Karachi"
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
          placeholder="info@school.edu.pk"
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
    </Modal>
  )
}

// ── Credential display field with copy button ─────────────────────────────────

function CredField({ label, value, secret = false }: { label: string; value: string; secret?: boolean }) {
  const [revealed, setRevealed] = useState(!secret)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-gray-100 border border-border rounded-lg px-3 py-2 text-sm font-mono tracking-wide select-all">
          {revealed ? value : '•'.repeat(value.length)}
        </code>
        {secret && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="px-2.5 py-2 text-xs border border-border rounded-lg hover:bg-gray-50 text-gray-600"
          >
            {revealed ? 'Hide' : 'Show'}
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          className="px-2.5 py-2 text-xs border border-border rounded-lg hover:bg-gray-50 text-gray-600"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

// ── Generic form field ────────────────────────────────────────────────────────

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
