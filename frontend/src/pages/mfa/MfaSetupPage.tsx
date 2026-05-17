import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { axiosClient } from '../../api/axiosClient'
import { authenticatedLandingPath } from '../../components/auth/rolePortal'
import { authStore, type AuthSessionPayload, type PendingMfaState } from '../../store/authStore'

function getApiError(err: unknown): string {
  const e = err as { response?: { data?: { error?: string; title?: string } } }
  return e?.response?.data?.error ?? e?.response?.data?.title ?? ''
}

type MfaSetupResponse = {
  qrCodeDataUrl: string
  manualKey: string
  secret: string
  otpAuthUri: string
}

type LoginResponse = AuthSessionPayload & {
  mfaRequired: boolean
  mfaEnrollmentRequired: boolean
}

export default function MfaSetupPage() {
  const navigate = useNavigate()
  const [pending, setPending] = useState<PendingMfaState | null>(null)
  const [setup, setSetup] = useState<MfaSetupResponse | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  // Guard against React StrictMode double-invocation and concurrent re-mounts.
  // The ref persists across the strict-mode unmount/remount cycle so the
  // single-use challenge token is only consumed once.
  const setupInitiated = useRef(false)

  useEffect(() => {
    if (setupInitiated.current) return
    setupInitiated.current = true

    const current = authStore.getPendingMfa()
    if (!current) {
      navigate('/login', { replace: true })
      return
    }

    setPending(current)

    const controller = new AbortController()
    axiosClient
      .post<MfaSetupResponse>(
        '/auth/setup-mfa',
        { mfaChallengeToken: current.mfaChallengeToken },
        { signal: controller.signal, headers: { 'x-skip-error-toast': '1' } },
      )
      .then(({ data }) => setSetup(data))
      .catch((err) => {
        if (controller.signal.aborted) return
        const apiErr = getApiError(err)
        if (apiErr.includes('already enabled')) {
          // Enrollment completed in a prior attempt but session got stuck.
          // Switch to the verify flow so the user can complete login.
          authStore.transitionToMfaVerify()
          navigate('/mfa/verify', { replace: true })
          return
        }
        if (apiErr.includes('Invalid MFA challenge')) {
          authStore.clearPendingMfa()
          navigate('/login', { replace: true })
          return
        }
        setError('MFA setup could not be started. Please log in again.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pending) return

    setError('')
    setSubmitting(true)
    try {
      // validate-mfa-login handles enrollment atomically when TwoFactorEnabled=false:
      // it calls EnableTwoFactorAsync internally so we never need a separate verify-mfa
      // round-trip. This eliminates the stuck state where verify-mfa succeeds but
      // validate-mfa-login then fails, leaving the account half-enrolled.
      const payload = { mfaChallengeToken: pending.mfaChallengeToken, code }
      const { data } = await axiosClient.post<LoginResponse>('/auth/validate-mfa-login', payload, {
        headers: { 'x-skip-error-toast': '1' },
      })
      authStore.setSessionFromLogin(data, pending.email)
      navigate(authenticatedLandingPath(data.roles, data.campusId), { replace: true })
    } catch (err) {
      const apiErr = getApiError(err)
      if (apiErr.includes('Invalid MFA challenge')) {
        authStore.clearPendingMfa()
        navigate('/login', { replace: true })
        return
      }
      setError('Invalid code. Please try again.')
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
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary-700">Set up MFA</h1>
          <p className="text-sm text-muted-foreground mt-1">{pending?.email}</p>
        </div>

        {loading ? (
          <p className="text-center text-sm text-muted-foreground">Loading...</p>
        ) : (
          <>
            {setup && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={setup.qrCodeDataUrl}
                    alt="MFA QR code"
                    className="h-48 w-48 rounded-lg border border-border bg-white p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Manual key</label>
                  <div className="break-all rounded-lg border border-input bg-muted px-3 py-2 font-mono text-sm">
                    {setup.manualKey || setup.secret}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
                disabled={submitting || !setup}
                className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {submitting ? 'Verifying...' : 'Continue'}
              </button>
            </form>
          </>
        )}

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
