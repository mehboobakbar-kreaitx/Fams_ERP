import { Navigate } from 'react-router-dom'
import { authStore } from '../../store/authStore'

type Props = {
  children: React.ReactNode
  roles?: string[]
}

export default function ProtectedRoute({ children, roles }: Props) {
  const phase = authStore.getAuthPhase()

  if (phase === 'mfa_pending') {
    const p = authStore.getPendingMfa()!
    return <Navigate to={p.mfaEnrollmentRequired ? '/mfa/setup' : '/mfa/verify'} replace />
  }

  if (phase === 'anonymous') return <Navigate to="/login" replace />

  if (roles && roles.length > 0 && !roles.some((r) => authStore.hasRole(r))) {
    return <Navigate to="/unauthorized" replace />
  }
  return <>{children}</>
}
