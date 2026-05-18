import { Navigate } from 'react-router-dom'
import { authStore } from '../../store/authStore'

type Props = {
  children: React.ReactNode
  roles?: string[]
}

export default function ProtectedRoute({ children, roles }: Props) {
  const phase = authStore.getAuthPhase()

  // A silent token refresh is in progress. Show a neutral loading state rather
  // than redirecting to /login — the interceptor will replay the original request
  // and resolve normally once the new tokens are written to localStorage.
  if (phase === 'refreshing') {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500 text-sm">
        Refreshing session…
      </div>
    )
  }

  if (phase === 'mfa_pending') {
    const p = authStore.getPendingMfa()
    // Safety: phase is mfa_pending but localStorage entry is missing/corrupted.
    // Send to /login rather than crashing on a null dereference.
    if (!p) return <Navigate to="/login" replace />
    return <Navigate to={p.mfaEnrollmentRequired ? '/mfa/setup' : '/mfa/verify'} replace />
  }

  if (phase === 'anonymous') return <Navigate to="/login" replace />

  // 'authenticated' or 'expired':
  // Expired tokens are handled by the Axios 401 interceptor on the first API
  // call — it silently refreshes and replays. Blocking navigation here and
  // redirecting to /login would race against the interceptor (which might
  // succeed) and would reset any in-progress form state.
  if (roles?.length && !roles.some((r) => authStore.hasRole(r))) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
