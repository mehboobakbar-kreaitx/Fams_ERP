import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { axiosClient } from '../api/axiosClient'
import Modal from '../components/ui/Modal'

type Student = {
  id: string
  programId: string
  programName?: string | null
  classId: string
  className?: string | null
  sectionId: string
  sectionName?: string | null
}

type SectionOption = {
  sectionId: string
  classId: string
  programId: string
  label: string
}

type Props = {
  open: boolean
  onClose: () => void
}

type FormState = {
  firstName: string
  lastName: string
  fatherName: string
  dateOfBirth: string
  gender: 'Male' | 'Female'
  address: string
  phone: string
  email: string
  rollNumber: string
  emergencyContactName: string
  emergencyContactPhone: string
  sectionId: string
}

const empty: FormState = {
  firstName: '',
  lastName: '',
  fatherName: '',
  dateOfBirth: '2010-01-01',
  gender: 'Male',
  address: '',
  phone: '',
  email: '',
  rollNumber: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  sectionId: '',
}

export default function AddStudentDialog({ open, onClose }: Props) {
  const qc = useQueryClient()
  const [form, setForm] = useState<FormState>(empty)

  // Pull students to derive section options (sectionId/classId/programId via join).
  const sectionsQuery = useQuery({
    queryKey: ['students-for-sections'],
    enabled: open,
    queryFn: async () => {
      const res = await axiosClient.get<{ items: Student[] } | Student[]>('/students', { params: { pageSize: 200 } })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
  })

  const sectionOptions: SectionOption[] = useMemo(() => {
    const seen = new Map<string, SectionOption>()
    for (const s of sectionsQuery.data ?? []) {
      if (!s.sectionId || seen.has(s.sectionId)) continue
      const label = s.className && s.sectionName ? `${s.className} — ${s.sectionName}` : s.sectionName ?? s.sectionId
      seen.set(s.sectionId, { sectionId: s.sectionId, classId: s.classId, programId: s.programId, label })
    }
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label))
  }, [sectionsQuery.data])

  const create = useMutation({
    mutationFn: async () => {
      const sec = sectionOptions.find((s) => s.sectionId === form.sectionId)
      if (!sec) throw new Error('Select a section before saving.')
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        fatherName: form.fatherName.trim(),
        dateOfBirth: new Date(form.dateOfBirth).toISOString(),
        gender: form.gender === 'Male' ? 1 : 2,
        address: form.address.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        programId: sec.programId,
        classId: sec.classId,
        sectionId: sec.sectionId,
        rollNumber: form.rollNumber.trim(),
        emergencyContactName: form.emergencyContactName.trim() || form.fatherName.trim(),
        emergencyContactPhone: form.emergencyContactPhone.trim() || form.phone.trim(),
        campusId: '00000000-0000-0000-0000-000000000000',
      }
      const { data } = await axiosClient.post<string>('/students', payload, {
        headers: { 'x-skip-error-toast': '1' },
      })
      return data
    },
    onSuccess: () => {
      toast.success('Student added.')
      setForm(empty)
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['students-for-attendance'] })
      qc.invalidateQueries({ queryKey: ['dashboard-principal'] })
      onClose()
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string; title?: string } }; message?: string }
      const msg = e.response?.data?.error ?? e.response?.data?.title ?? e.message ?? 'Failed to add student.'
      toast.error(msg)
    },
  })

  const canSubmit =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.fatherName.trim() &&
    form.phone.trim() &&
    form.address.trim() &&
    form.rollNumber.trim() &&
    form.sectionId &&
    !create.isPending

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!create.isPending) {
          setForm(empty)
          onClose()
        }
      }}
      title="Add Student"
      description="Create a new student record. Roll number must be unique within the campus."
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setForm(empty)
              onClose()
            }}
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
            {create.isPending ? 'Saving…' : 'Save Student'}
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
        <Field label="First Name *" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
        <Field label="Last Name *"  value={form.lastName}  onChange={(v) => setForm({ ...form, lastName: v })} />
        <Field label="Father's Name *" value={form.fatherName} onChange={(v) => setForm({ ...form, fatherName: v })} />
        <Field label="Roll Number *" value={form.rollNumber} onChange={(v) => setForm({ ...form, rollNumber: v })} placeholder="e.g. 26-0025" />
        <Field label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(v) => setForm({ ...form, dateOfBirth: v })} />
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value as 'Male' | 'Female' })}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <Field label="Phone *" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="0321-xxxxxxx" />
        <Field label="Email"   value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
        <Field label="Address *" value={form.address} onChange={(v) => setForm({ ...form, address: v })} className="md:col-span-2" />
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Section *</label>
          <select
            value={form.sectionId}
            onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm"
            disabled={sectionsQuery.isLoading}
          >
            <option value="">— Select a section —</option>
            {sectionOptions.map((s) => (
              <option key={s.sectionId} value={s.sectionId}>{s.label}</option>
            ))}
          </select>
          {sectionsQuery.isLoading && <p className="text-xs text-muted-foreground mt-1">Loading sections…</p>}
        </div>
        <Field
          label="Emergency Contact Name"
          value={form.emergencyContactName}
          onChange={(v) => setForm({ ...form, emergencyContactName: v })}
          placeholder="Defaults to father's name"
        />
        <Field
          label="Emergency Contact Phone"
          value={form.emergencyContactPhone}
          onChange={(v) => setForm({ ...form, emergencyContactPhone: v })}
          placeholder="Defaults to student's phone"
        />
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
