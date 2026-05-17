import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Login from '../pages/Login'

// ── module mocks ──────────────────────────────────────────────────────────────

vi.mock('../api/axiosClient', () => ({
  axiosClient: { post: vi.fn() },
}))

vi.mock('../store/authStore', () => ({
  authStore: {
    setSessionFromLogin: vi.fn(),
    setPendingMfa: vi.fn(),
    isAuthenticated: vi.fn(() => false),
    hasRole: vi.fn(() => false),
    getState: vi.fn(() => ({ user: null, token: null })),
    clear: vi.fn(),
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ── imports after mocks ───────────────────────────────────────────────────────

import { axiosClient } from '../api/axiosClient'
import { authStore } from '../store/authStore'

// ── helpers ───────────────────────────────────────────────────────────────────

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  )
}

function fillAndSubmit(email = 'test@fams.io', password = 'Test@2026!') {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } })
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
}

const baseLoginResponse = {
  accessToken: 'at-123',
  refreshToken: 'rt-456',
  expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  userId: 'user-id',
  roles: ['Teacher'],
  campusId: 'some-campus-id',
  schoolId: null,
  fullName: 'Test Teacher',
  mfaRequired: false,
  mfaEnrollmentRequired: false,
  mfaChallengeToken: null,
}

// ── tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Login page', () => {
  it('renders email and password inputs', () => {
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows error message when API call fails', async () => {
    vi.mocked(axiosClient.post).mockRejectedValue(new Error('Unauthorized'))

    renderLogin()
    fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password.')).toBeInTheDocument()
    })
  })

  it('disables submit button and shows loading text while request is in flight', async () => {
    // never-resolving promise simulates a slow server
    vi.mocked(axiosClient.post).mockReturnValue(new Promise(() => {}))

    renderLogin()
    fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
    })
  })

  it('calls setSessionFromLogin and navigates to landing path on successful login', async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({ data: baseLoginResponse })

    renderLogin()
    fillAndSubmit('teacher@fams.io')

    await waitFor(() => {
      expect(authStore.setSessionFromLogin).toHaveBeenCalledWith(
        baseLoginResponse,
        'teacher@fams.io',
      )
    })
    // Teacher → /teacher/dashboard
    expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard')
  })

  it('navigates to /mfa/verify when mfaRequired is true', async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({
      data: {
        ...baseLoginResponse,
        accessToken: '',
        refreshToken: '',
        mfaRequired: true,
        mfaEnrollmentRequired: false,
        mfaChallengeToken: 'challenge-token',
      },
    })

    renderLogin()
    fillAndSubmit()

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/mfa/verify', { replace: true })
    })
    expect(authStore.setPendingMfa).toHaveBeenCalled()
  })

  it('navigates to /mfa/setup when mfaEnrollmentRequired is true', async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({
      data: {
        ...baseLoginResponse,
        accessToken: '',
        refreshToken: '',
        mfaRequired: true,
        mfaEnrollmentRequired: true,
        mfaChallengeToken: 'enroll-token',
      },
    })

    renderLogin()
    fillAndSubmit()

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/mfa/setup', { replace: true })
    })
  })

  it('shows error when mfaRequired but no challenge token returned', async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({
      data: {
        ...baseLoginResponse,
        mfaRequired: true,
        mfaEnrollmentRequired: false,
        mfaChallengeToken: null,
      },
    })

    renderLogin()
    fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByText('MFA challenge could not be started.')).toBeInTheDocument()
    })
  })
})
