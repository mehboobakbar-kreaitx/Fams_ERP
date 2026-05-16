import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { axiosClient } from '../api/axiosClient'
import { authStore } from '../store/authStore'
import { landingPath, resolvePortal } from '../components/auth/rolePortal'

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000'

// Campus-portal roles that require a campus to be assigned before the dashboard is usable.
const CAMPUS_SETUP_ROLES = new Set([
  'Principal', 'AcademicCoordinator', 'Accountant', 'HrOfficer', 'ProcurementOfficer',
])

type LoginResponse = {
  accessToken: string
  refreshToken: string
  expiresAt: string
  userId: string
  roles: string[]
  campusId: string
  schoolId: string | null
  fullName: string
  mfaRequired: boolean
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await axiosClient.post<LoginResponse>('/auth/login', { email, password })

      if (data.mfaRequired) {
        setError('MFA is required for this account. MFA flow not yet implemented.')
        return
      }

      const [firstName, ...rest] = (data.fullName ?? '').split(' ')
      authStore.setState({
        user: {
          id:       data.userId,
          email,
          firstName: firstName ?? '',
          lastName:  rest.join(' '),
          campusId:  data.campusId,
          schoolId:  data.schoolId ?? null,
          roles:     data.roles ?? [],
        },
        token:        data.accessToken,
        refreshToken: data.refreshToken,
      })

      // School admin with no campus yet → first-time setup flow
      const needsSetup =
        data.roles.some((r) => CAMPUS_SETUP_ROLES.has(r)) &&
        (!data.campusId || data.campusId === EMPTY_GUID)

      if (needsSetup) {
        navigate('/campus/setup')
        return
      }

      navigate(landingPath(resolvePortal(data.roles)))
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-700">FAMS</h1>
          <p className="text-muted-foreground mt-1">Falcon Academic Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="superadmin@fams.io"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 Falcon College Network. All rights reserved.
        </p>
      </div>
    </div>
  )
}
