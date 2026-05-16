import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authStore } from '../store/authStore'

const STAFF_ROLES = new Set([
  'SystemAdmin', 'Executive', 'Principal', 'AcademicCoordinator',
  'Teacher', 'Accountant', 'HrOfficer', 'ProcurementOfficer',
])

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const

export function useIdleLogout() {
  const navigate = useNavigate()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const { user } = authStore.getState()
    if (!user) return

    const isStaff = user.roles.some((r) => STAFF_ROLES.has(r))
    const idleMs = (isStaff ? 30 : 60) * 60_000

    const expire = () => {
      authStore.clear()
      navigate('/login?reason=idle', { replace: true })
    }

    const bump = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(expire, idleMs)
    }

    bump()
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, bump, { passive: true }))

    return () => {
      if (timer.current) clearTimeout(timer.current)
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, bump))
    }
  }, [navigate])
}
