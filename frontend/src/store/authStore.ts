export type AuthUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  campusId: string
  schoolId: string | null
  roles: string[]
}

export type AuthState = {
  user: AuthUser | null
  token: string | null
  refreshToken?: string | null
}

export type AuthSessionPayload = {
  accessToken: string
  refreshToken: string
  userId: string
  roles: string[]
  campusId: string
  schoolId: string | null
  fullName: string
}

export type PendingMfaState = {
  userId: string
  email: string
  fullName: string
  roles: string[]
  campusId: string
  schoolId: string | null
  mfaRequired: boolean
  mfaEnrollmentRequired: boolean
  mfaChallengeToken: string
}

export type PendingMfaPayload = AuthSessionPayload & {
  mfaRequired: boolean
  mfaEnrollmentRequired?: boolean
  mfaChallengeToken?: string | null
}

const AUTH_KEY = 'fams_auth'
const PENDING_MFA_KEY = 'fams_pending_mfa'

function splitName(fullName: string | undefined | null) {
  const [firstName, ...rest] = (fullName ?? '').split(' ')
  return { firstName: firstName ?? '', lastName: rest.join(' ') }
}

export const authStore = {
  getState(): AuthState {
    try {
      const raw = localStorage.getItem(AUTH_KEY)
      return raw ? JSON.parse(raw) : { user: null, token: null, refreshToken: null }
    } catch {
      return { user: null, token: null, refreshToken: null }
    }
  },

  setState(state: AuthState) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(state))
    if (state.token) localStorage.setItem('access_token', state.token)
    else localStorage.removeItem('access_token')
    if (state.refreshToken) localStorage.setItem('refresh_token', state.refreshToken)
    else localStorage.removeItem('refresh_token')
  },

  setSessionFromLogin(data: AuthSessionPayload, email: string) {
    const { firstName, lastName } = splitName(data.fullName)
    this.setState({
      user: {
        id: data.userId,
        email,
        firstName,
        lastName,
        campusId: data.campusId,
        schoolId: data.schoolId ?? null,
        roles: data.roles ?? [],
      },
      token: data.accessToken,
      refreshToken: data.refreshToken,
    })
    this.clearPendingMfa()
  },

  getPendingMfa(): PendingMfaState | null {
    try {
      const raw = localStorage.getItem(PENDING_MFA_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  setPendingMfa(data: PendingMfaPayload, email: string) {
    if (!data.mfaChallengeToken) return

    const pending: PendingMfaState = {
      userId: data.userId,
      email,
      fullName: data.fullName,
      roles: data.roles ?? [],
      campusId: data.campusId,
      schoolId: data.schoolId ?? null,
      mfaRequired: data.mfaRequired,
      mfaEnrollmentRequired: data.mfaEnrollmentRequired ?? false,
      mfaChallengeToken: data.mfaChallengeToken,
    }

    localStorage.setItem(PENDING_MFA_KEY, JSON.stringify(pending))
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },

  clearPendingMfa() {
    localStorage.removeItem(PENDING_MFA_KEY)
  },

  clear() {
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    this.clearPendingMfa()
  },

  isAuthenticated(): boolean {
    return !!this.getState().token
  },

  hasRole(role: string): boolean {
    return this.getState().user?.roles.includes(role) ?? false
  },
}
