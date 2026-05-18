import axios, { type AxiosError } from 'axios'
import toast from 'react-hot-toast'
import { authStore } from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

// Per-call opt-out: pass `{ headers: { 'x-skip-error-toast': '1' } }` to silence the auto-toast.
const SKIP_HEADER = 'x-skip-error-toast'

function pickDetail(err: AxiosError): string {
  const raw = err.response?.data
  if (typeof raw === 'string') return raw
  const data = raw as Record<string, unknown>
  if (data?.error) return String(data.error)
  if (data?.detail) return String(data.detail)
  if (data?.title) return String(data.title)
  if (Array.isArray(data?.errors)) return (data.errors as unknown[]).join(', ')
  if (data?.errors && typeof data.errors === 'object') {
    const flat: string[] = []
    const errMap = data.errors as Record<string, unknown>
    for (const k of Object.keys(errMap)) {
      const v = errMap[k]
      if (Array.isArray(v)) flat.push(...v.map((m) => `${k}: ${m}`))
    }
    if (flat.length) return flat.join(' • ')
  }
  return err.message || 'Request failed.'
}

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

// Public auth endpoints that authenticate via mfaChallengeToken or their own
// credential scheme — never via the JWT Bearer token. The 401 refresh logic
// must not run for these; doing so would wipe pending MFA state and cause
// redirect/setup loops.
const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/setup-mfa',
  '/auth/validate-mfa-login',
  '/auth/verify-mfa',
  '/auth/password/',
]

function isPublicAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false
  return PUBLIC_AUTH_PATHS.some((p) => url.includes(p))
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // 429 Too Many Requests — honour Retry-After (or default 5 s) then replay once.
    if (error.response?.status === 429 && !originalRequest._retried429) {
      originalRequest._retried429 = true
      const retryAfterHeader = error.response.headers['retry-after']
      const delayMs = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : 5000
      await new Promise((res) => setTimeout(res, delayMs))
      return axiosClient(originalRequest)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Public auth endpoints use their own credential scheme (mfaChallengeToken,
      // password). Running JWT refresh here would: (a) always fail (no tokens in
      // localStorage during MFA pending state), and (b) call authStore.clear()
      // which destroys fams_pending_mfa, causing the MFA redirect/setup loop.
      if (isPublicAuthEndpoint(originalRequest.url as string | undefined)) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axiosClient(originalRequest)
        })
      }

      originalRequest._retry = true

      const phase = authStore.getAuthPhase()
      const accessToken = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')

      if (!accessToken || !refreshToken || phase === 'mfa_pending') {
        // Drain the queue before redirecting so callers don't hang.
        processQueue(error, null)
        // Use clearSession() — not clear() — so that a pending MFA challenge
        // token is preserved if the 401 originated from a non-auth API call
        // while the user was mid-MFA-flow. clear() calls clearPendingMfa()
        // which would destroy the challenge token and cause a redirect loop.
        if (phase === 'mfa_pending') {
          authStore.clearSession()
        } else {
          authStore.clear()
        }
        window.location.href = '/login'
        return Promise.reject(error)
      }

      isRefreshing = true
      try {
        // Backend RefreshTokenCommand requires both tokens:
        // accessToken — to validate the expired JWT and extract userId
        // refreshToken — to verify against the stored DB value
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          accessToken,
          refreshToken,
        })
        const newAccessToken: string = data.accessToken
        const newRefreshToken: string = data.refreshToken
        authStore.updateTokens(newAccessToken, newRefreshToken)
        axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`
        processQueue(null, newAccessToken)
        return axiosClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        authStore.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Auto-surface 4xx (except 401, which is handled above) and 5xx as toasts.
    const skip = originalRequest?.headers?.[SKIP_HEADER]
    const status = error.response?.status
    if (!skip && status && status !== 401) {
      const detail = pickDetail(error as AxiosError)
      if (status >= 500) {
        toast.error(`Server error (${status}): ${detail}`)
      } else if (status >= 400) {
        toast.error(detail)
      }
    }

    return Promise.reject(error)
  },
)

// When another tab silently refreshes the access token, localStorage fires a
// 'storage' event in every *other* tab. Sync the default Authorization header
// here so that the next request from this tab uses the new token without
// triggering its own redundant refresh (which would fail — RT already rotated).
window.addEventListener('storage', (event) => {
  if (event.key !== 'access_token') return
  if (event.newValue) {
    axiosClient.defaults.headers.common.Authorization = `Bearer ${event.newValue}`
  } else {
    // Another tab cleared the token (logout) — mirror that state immediately.
    delete axiosClient.defaults.headers.common.Authorization
  }
})
