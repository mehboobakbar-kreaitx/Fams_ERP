import { Navigate } from 'react-router-dom'
import { authStore } from '../../store/authStore'

type Props = {
  children: React.ReactNode
  roles?: string[]
}

export default function ProtectedRoute({ children, roles }: Props) {
  if (!authStore.isAuthenticated()) return <Navigate to="/login" replace />
  if (roles && roles.length > 0 && !roles.some((r) => authStore.hasRole(r))) {
    return <Navigate to="/unauthorized" replace />
  }
  return <>{children}</>
}
