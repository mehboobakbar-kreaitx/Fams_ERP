import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { axiosClient } from '../api/axiosClient'
import { authStore } from '../store/authStore'
import { authenticatedLandingPath } from '../components/auth/rolePortal'

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
  mfaEnrollmentRequired: boolean
  mfaChallengeToken?: string | null
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

      if (data.mfaEnrollmentRequired || data.mfaRequired) {
        if (!data.mfaChallengeToken) {
          setError('MFA challenge could not be started.')
          return
        }

        authStore.setPendingMfa(data, email)
        navigate(data.mfaEnrollmentRequired ? '/mfa/setup' : '/mfa/verify', { replace: true })
        return
      }

      authStore.setSessionFromLogin(data, email)
      navigate(authenticatedLandingPath(data.roles, data.campusId))
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 401 || status === 400) {
        setError('Invalid email or password.')
      } else if (!status) {
        setError('Cannot reach the server. Check your connection and try again.')
      } else {
        setError('Sign-in failed. Please try again or contact support.')
      }
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
              placeholder="********"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          (c) 2026 Falcon College Network. All rights reserved.
        </p>
      </div>
    </div>
  )
}
