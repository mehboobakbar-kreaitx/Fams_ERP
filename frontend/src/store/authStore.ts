export type AuthPhase = 'anonymous' | 'mfa_pending' | 'authenticated' | 'refreshing' | 'expired'

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

// Module-level flag — not persisted to localStorage, resets on page reload.
// Set by the Axios 401 interceptor while a token refresh is in flight so that
// getAuthPhase() can return 'refreshing'. Route guards read this to avoid
// redirecting to /login during what is actually a normal silent refresh.
let _refreshing = false

function splitName(fullName: string | undefined | null) {
  const [firstName, ...rest] = (fullName ?? '').split(' ')
  return { firstName: firstName ?? '', lastName: rest.join(' ') }
}

// Decodes the JWT `exp` claim without an external library.
// Returns true when the token has passed its expiry minus a 30-second buffer
// that matches the backend ClockSkew setting in JwtTokenService.
function isTokenExpired(token: string): boolean {
  try {
    // JWT payload is base64url-encoded — convert to standard base64 before atob.
    const b64 = token.split('.')[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    const payload = JSON.parse(atob(b64)) as { exp?: number }
    if (!payload.exp) return false
    return Date.now() >= payload.exp * 1000 - 30_000
  } catch {
    // If the token is malformed we can't determine expiry — let the backend 401
    // interceptor discover it on the next API call.
    return false
  }
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

  // Called when setup-mfa returns 400 "already enabled" — enrollment completed in
  // a previous attempt but the page was stuck. Switch pending state so that
  // /mfa/verify doesn't redirect back to /mfa/setup.
  transitionToMfaVerify() {
    const pending = this.getPendingMfa()
    if (!pending) return
    const updated: PendingMfaState = { ...pending, mfaEnrollmentRequired: false }
    localStorage.setItem(PENDING_MFA_KEY, JSON.stringify(updated))
  },

  // Clears only the JWT session tokens — does NOT touch fams_pending_mfa.
  // Used by the Axios interceptor when a 401 occurs while the user is
  // mid-MFA-flow; clearing the challenge token here would cause a redirect loop.
  clearSession() {
    _refreshing = false
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },

  clear() {
    _refreshing = false
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    this.clearPendingMfa()
  },

  // Called by the Axios interceptor while a silent token refresh is in flight.
  // Setting this to true causes getAuthPhase() to return 'refreshing' so that
  // route guards can display a loading state instead of redirecting to /login.
  setRefreshing(val: boolean) {
    _refreshing = val
  },

  // Called by the Axios interceptor after a silent token refresh succeeds.
  // Updates tokens in both the flat keys and the fams_auth composite so all
  // readers stay consistent without requiring a full re-login.
  updateTokens(accessToken: string, refreshToken: string) {
    const state = this.getState()
    this.setState({ ...state, token: accessToken, refreshToken })
  },

  // Returns the canonical auth phase. Reading order matters:
  //   1. refreshing — mid-refresh, don't redirect anywhere yet
  //   2. expired    — token exists but is past exp; interceptor handles on next call
  //   3. authenticated — valid token present
  //   4. mfa_pending   — challenge token in localStorage, no access token
  //   5. anonymous     — no session at all
  getAuthPhase(): AuthPhase {
    if (_refreshing) return 'refreshing'
    const { token } = this.getState()
    if (token) {
      return isTokenExpired(token) ? 'expired' : 'authenticated'
    }
    if (this.getPendingMfa() !== null) return 'mfa_pending'
    return 'anonymous'
  },

  // Simple token-presence check for code that doesn't need full phase resolution
  // (e.g. deciding whether to attach an Authorization header).
  isAuthenticated(): boolean {
    return !!this.getState().token
  },

  hasRole(role: string): boolean {
    return this.getState().user?.roles.includes(role) ?? false
  },
}
