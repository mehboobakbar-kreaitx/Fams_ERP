import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { axiosClient } from '../api/axiosClient'

type Campus = { id: string; name: string; code: string }
type Program = { id: string; name: string; code: string }

export default function PublicApplyPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    fatherName: '',
    dateOfBirth: '2010-01-01',
    gender: 'Male' as 'Male' | 'Female',
    phone: '',
    email: '',
    address: '',
    programId: '',
    campusId: '',
  })
  const [submittedId, setSubmittedId] = useState<string | null>(null)

  const campuses = useQuery({
    queryKey: ['public-campuses'],
    queryFn: async () => {
      const res = await axiosClient.get<Campus[] | { items: Campus[] }>('/campuses/public', {
        headers: { 'x-skip-error-toast': '1' },
      })
      const data = Array.isArray(res.data) ? res.data : res.data.items ?? []
      return data
    },
    retry: 0,
  })

  const programs = useQuery({
    queryKey: ['public-programs'],
    queryFn: async () => {
      const res = await axiosClient.get<Program[] | { items: Program[] }>('/campuses/public/programs', {
        headers: { 'x-skip-error-toast': '1' },
      })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: 0,
  })

  const submit = useMutation({
    mutationFn: async () => {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        fatherName: form.fatherName.trim(),
        dateOfBirth: new Date(form.dateOfBirth).toISOString(),
        gender: form.gender === 'Male' ? 1 : 2,
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        programId: form.programId,
        campusId: form.campusId,
      }
      const { data } = await axiosClient.post<string>('/admissions/applications', payload, {
        headers: { 'x-skip-error-toast': '1' },
      })
      return data
    },
    onSuccess: (id) => {
      setSubmittedId(typeof id === 'string' ? id : String(id))
      toast.success('Application submitted.')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string; title?: string } }; message?: string }
      toast.error(e.response?.data?.error ?? e.response?.data?.title ?? e.message ?? 'Could not submit application.')
    },
  })

  const canSubmit =
    form.firstName.trim() && form.lastName.trim() && form.fatherName.trim() &&
    form.phone.trim() && form.address.trim() &&
    form.programId && form.campusId && !submit.isPending

  if (submittedId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white border border-border rounded-2xl p-8 max-w-lg w-full text-center shadow-sm">
          <div className="text-5xl mb-3">✅</div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Application Received</h1>
          <p className="text-sm text-muted-foreground mb-1">Your application ID:</p>
          <p className="font-mono text-sm bg-gray-100 px-3 py-2 rounded-lg inline-block mb-4">{submittedId}</p>
          <p className="text-sm text-muted-foreground mb-6">
            We'll review and contact you via SMS / email. Please save your application ID for reference.
          </p>
          <Link to="/login" className="text-primary-700 hover:underline">Back to login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <div className="text-4xl mb-2">🦅</div>
          <h1 className="text-3xl font-bold text-primary-900">Falcon College — Online Application</h1>
          <p className="text-sm text-muted-foreground mt-1">No account needed. Fill the form, we'll get back to you.</p>
        </header>

        <form
          onSubmit={(e) => { e.preventDefault(); if (canSubmit) submit.mutate() }}
          className="bg-white border border-border rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Field label="First Name *" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
          <Field label="Last Name *"  value={form.lastName}  onChange={(v) => setForm({ ...form, lastName: v })} />
          <Field label="Father's Name *" value={form.fatherName} onChange={(v) => setForm({ ...form, fatherName: v })} />
          <Field label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(v) => setForm({ ...form, dateOfBirth: v })} />
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value as 'Male' | 'Female' })}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm"
            >
              <option>Male</option>
              <option>Female</option>
            </select>
          </div>
          <Field label="Phone *" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="0321-xxxxxxx" />
          <Field label="Email"   value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
          <Field label="Address *" value={form.address} onChange={(v) => setForm({ ...form, address: v })} className="md:col-span-2" />

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Campus *</label>
            <select
              value={form.campusId}
              onChange={(e) => setForm({ ...form, campusId: e.target.value })}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm"
            >
              <option value="">— Select campus —</option>
              {(campuses.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Program *</label>
            <select
              value={form.programId}
              onChange={(e) => setForm({ ...form, programId: e.target.value })}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm"
            >
              <option value="">— Select program —</option>
              {(programs.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="md:col-span-2 flex items-center justify-between pt-2">
            <Link to="/login" className="text-sm text-muted-foreground hover:underline">← Back to login</Link>
            <button
              type="submit"
              disabled={!canSubmit}
              className="bg-primary-700 hover:bg-primary-800 disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-lg"
            >
              {submit.isPending ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Your data is handled in compliance with Pakistani data protection norms (PRD §11.6).
        </p>
      </div>
    </div>
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
