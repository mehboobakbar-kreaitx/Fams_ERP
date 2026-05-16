type AuthUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  campusId: string
  roles: string[]
}

type AuthState = {
  user: AuthUser | null
  token: string | null
  refreshToken?: string | null
}

const AUTH_KEY = 'fams_auth'

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

  clear() {
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },

  isAuthenticated(): boolean {
    return !!this.getState().token
  },

  hasRole(role: string): boolean {
    return this.getState().user?.roles.includes(role) ?? false
  },
}
