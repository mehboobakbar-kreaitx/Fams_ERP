import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ProtectedRoute from '../components/auth/ProtectedRoute'

// ── module mock ───────────────────────────────────────────────────────────────

vi.mock('../store/authStore', () => ({
  authStore: {
    isAuthenticated: vi.fn(),
    hasRole: vi.fn(),
    getState: vi.fn(() => ({ user: null, token: null })),
  },
}))

import { authStore } from '../store/authStore'

// ── helpers ───────────────────────────────────────────────────────────────────

function renderProtected(
  isAuthenticated: boolean,
  hasRole: boolean = true,
  roles?: string[],
) {
  vi.mocked(authStore.isAuthenticated).mockReturnValue(isAuthenticated)
  vi.mocked(authStore.hasRole).mockReturnValue(hasRole)

  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute roles={roles}>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

// ── tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ProtectedRoute', () => {
  it('redirects to /login when user is not authenticated', () => {
    renderProtected(false)

    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects to /unauthorized when authenticated but missing required role', () => {
    renderProtected(true, false, ['Admin'])

    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when authenticated with a matching role', () => {
    renderProtected(true, true, ['Teacher'])

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
    expect(screen.queryByText('Unauthorized Page')).not.toBeInTheDocument()
  })

  it('renders children when authenticated and no role restriction is specified', () => {
    renderProtected(true, true, undefined)

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('renders children when authenticated and roles array is empty', () => {
    renderProtected(true, true, [])

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
