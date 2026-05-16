import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { axiosClient } from '../../api/axiosClient'
import { authStore } from '../../store/authStore'

type FormState = {
  name: string
  code: string
  city: string
  address: string
  phone: string
  email: string
  principalName: string
  maxCapacity: string
}

const empty: FormState = {
  name: '', code: '', city: '', address: '',
  phone: '', email: '', principalName: '', maxCapacity: '1000',
}

export default function CampusSetupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(empty)

  const create = useMutation({
    mutationFn: async () => {
      const { data } = await axiosClient.post<{ id: string }>('/campuses', {
        name:          form.name.trim(),
        code:          form.code.trim().toUpperCase(),
        city:          form.city.trim(),
        address:       form.address.trim(),
        phone:         form.phone.trim(),
        email:         form.email.trim(),
        principalName: form.principalName.trim(),
        maxCapacity:   parseInt(form.maxCapacity) || 1000,
        isMainCampus:  true,
      }, { headers: { 'x-skip-error-toast': '1' } })
      return data
    },
    onSuccess: async () => {
      toast.success('Campus created! Refreshing your session…')

      // Refresh the JWT so the new CampusId propagates into the token.
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        const accessToken  = localStorage.getItem('access_token')
        if (refreshToken && accessToken) {
          const { data } = await axiosClient.post<{
            accessToken: string
            refreshToken: string
            campusId: string
            schoolId: string | null
            roles: string[]
            fullName: string
          }>('/auth/refresh', { accessToken, refreshToken })

          const [firstName, ...rest] = (data.fullName ?? '').split(' ')
          const current = authStore.getState()
          authStore.setState({
            user: {
              ...current.user!,
              campusId:  data.campusId,
              schoolId:  data.schoolId ?? null,
              firstName: firstName ?? current.user!.firstName,
              lastName:  rest.join(' ') || current.user!.lastName,
              roles:     data.roles,
            },
            token:        data.accessToken,
            refreshToken: data.refreshToken,
          })
        }
      } catch {
        // Token refresh failed — user will need to log in again
      }

      navigate('/campus/dashboard')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string; title?: string } }; message?: string }
      toast.error(
        e.response?.data?.error ?? e.response?.data?.title ?? e.message ?? 'Failed to create campus.',
      )
    },
  })

  const canSubmit =
    form.name.trim() &&
    form.code.trim() &&
    form.city.trim() &&
    form.address.trim() &&
    form.phone.trim() &&
    form.email.trim() &&
    form.principalName.trim() &&
    parseInt(form.maxCapacity) > 0 &&
    !create.isPending

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏫</div>
          <h1 className="text-2xl font-bold text-gray-900">Set Up Your First Campus</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Welcome to FAMS. Create your school's first campus to get started. You can add more campuses later from the dashboard.
          </p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); if (canSubmit) create.mutate() }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Field
            label="Campus Name *"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            placeholder="Falcon Academy — Main Campus"
            className="md:col-span-2"
          />
          <Field
            label="Campus Code *"
            value={form.code}
            onChange={(v) => setForm({ ...form, code: v.toUpperCase() })}
            placeholder="FA-01"
          />
          <Field
            label="City *"
            value={form.city}
            onChange={(v) => setForm({ ...form, city: v })}
            placeholder="e.g. Karachi"
          />
          <Field
            label="Address *"
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
            placeholder="House 12, Block A, …"
            className="md:col-span-2"
          />
          <Field
            label="Phone *"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
            placeholder="021-xxxxxxx"
          />
          <Field
            label="Email *"
            type="email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            placeholder="campus@school.edu.pk"
          />
          <Field
            label="Principal / Manager Name *"
            value={form.principalName}
            onChange={(v) => setForm({ ...form, principalName: v })}
            placeholder="Your full name"
          />
          <Field
            label="Max Student Capacity *"
            type="number"
            value={form.maxCapacity}
            onChange={(v) => setForm({ ...form, maxCapacity: v })}
            placeholder="1000"
          />

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {create.isPending ? 'Creating campus…' : 'Create Campus & Enter Dashboard'}
            </button>
          </div>
        </form>
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
