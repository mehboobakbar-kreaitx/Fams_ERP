import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { axiosClient } from '../../api/axiosClient'
import { authenticatedLandingPath } from '../../components/auth/rolePortal'
import { authStore, type AuthSessionPayload, type PendingMfaState } from '../../store/authStore'

type LoginResponse = AuthSessionPayload & {
  mfaRequired: boolean
  mfaEnrollmentRequired: boolean
}

export default function MfaVerifyPage() {
  const navigate = useNavigate()
  const [pending, setPending] = useState<PendingMfaState | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const current = authStore.getPendingMfa()
    if (!current) {
      navigate('/login', { replace: true })
      return
    }

    if (current.mfaEnrollmentRequired) {
      navigate('/mfa/setup', { replace: true })
      return
    }

    setPending(current)
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pending) return

    setError('')
    setSubmitting(true)
    try {
      const { data } = await axiosClient.post<LoginResponse>('/auth/validate-mfa-login', {
        mfaChallengeToken: pending.mfaChallengeToken,
        code,
      })

      authStore.setSessionFromLogin(data, pending.email)
      navigate(authenticatedLandingPath(data.roles, data.campusId), { replace: true })
    } catch {
      setError('Invalid MFA code.')
    } finally {
      setSubmitting(false)
    }
  }

  const returnToLogin = () => {
    authStore.clearPendingMfa()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-primary-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-700">Verify MFA</h1>
          <p className="text-sm text-muted-foreground mt-1">{pending?.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="mfa-code" className="block text-sm font-medium text-foreground mb-1">
              Authenticator code
            </label>
            <input
              id="mfa-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="123456"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !pending}
            className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {submitting ? 'Verifying...' : 'Continue'}
          </button>
        </form>

        <button
          type="button"
          onClick={returnToLogin}
          className="mt-5 w-full text-sm text-muted-foreground hover:text-primary-700"
        >
          Use a different account
        </button>
      </div>
    </div>
  )
}
