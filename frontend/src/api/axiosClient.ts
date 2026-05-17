import axios, { type AxiosError } from 'axios'
import toast from 'react-hot-toast'
import { authStore } from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

// Per-call opt-out: pass `{ headers: { 'x-skip-error-toast': '1' } }` to silence the auto-toast.
const SKIP_HEADER = 'x-skip-error-toast'

function pickDetail(err: AxiosError): string {
  const data: any = err.response?.data
  if (typeof data === 'string') return data
  if (data?.error) return String(data.error)
  if (data?.detail) return String(data.detail)
  if (data?.title) return String(data.title)
  if (Array.isArray(data?.errors)) return data.errors.join(', ')
  if (data?.errors && typeof data.errors === 'object') {
    const flat: string[] = []
    for (const k of Object.keys(data.errors)) {
      const v = data.errors[k]
      if (Array.isArray(v)) flat.push(...v.map((m: string) => `${k}: ${m}`))
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

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axiosClient(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const accessToken = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')
      if (!accessToken || !refreshToken) {
        authStore.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

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
