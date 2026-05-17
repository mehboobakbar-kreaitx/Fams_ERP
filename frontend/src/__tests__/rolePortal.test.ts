import { describe, it, expect } from 'vitest'
import { resolvePortal, landingPath, needsCampusSetup, authenticatedLandingPath } from '../components/auth/rolePortal'

describe('resolvePortal', () => {
  it('returns super-admin for SystemAdmin', () => {
    expect(resolvePortal(['SystemAdmin'])).toBe('super-admin')
  })

  it('returns campus for Principal', () => {
    expect(resolvePortal(['Principal'])).toBe('campus')
  })

  it('returns teacher for Teacher', () => {
    expect(resolvePortal(['Teacher'])).toBe('teacher')
  })

  it('returns student for Student', () => {
    expect(resolvePortal(['Student'])).toBe('student')
  })

  it('returns parent for Parent', () => {
    expect(resolvePortal(['Parent'])).toBe('parent')
  })

  it('returns highest-priority portal for multi-role user', () => {
    // SystemAdmin beats Teacher
    expect(resolvePortal(['Teacher', 'SystemAdmin'])).toBe('super-admin')
  })

  it('returns student for empty roles', () => {
    expect(resolvePortal([])).toBe('student')
  })

  it('returns student for null roles', () => {
    expect(resolvePortal(null)).toBe('student')
  })

  it('returns student for unknown role', () => {
    expect(resolvePortal(['UnknownRole'])).toBe('student')
  })
})

describe('landingPath', () => {
  it('maps super-admin to /super-admin/dashboard', () => {
    expect(landingPath('super-admin')).toBe('/super-admin/dashboard')
  })

  it('maps teacher to /teacher/dashboard', () => {
    expect(landingPath('teacher')).toBe('/teacher/dashboard')
  })

  it('maps student to /student/dashboard', () => {
    expect(landingPath('student')).toBe('/student/dashboard')
  })

  it('maps campus to /campus/dashboard', () => {
    expect(landingPath('campus')).toBe('/campus/dashboard')
  })
})

describe('needsCampusSetup', () => {
  it('returns true for campus-scoped role with empty GUID', () => {
    expect(needsCampusSetup(['Principal'], '00000000-0000-0000-0000-000000000000')).toBe(true)
  })

  it('returns true for campus-scoped role with null campusId', () => {
    expect(needsCampusSetup(['Accountant'], null)).toBe(true)
  })

  it('returns false for campus-scoped role with real campusId', () => {
    expect(needsCampusSetup(['Principal'], 'some-real-guid')).toBe(false)
  })

  it('returns false for non-campus role', () => {
    expect(needsCampusSetup(['Teacher'], '00000000-0000-0000-0000-000000000000')).toBe(false)
  })
})

describe('authenticatedLandingPath', () => {
  it('returns /campus/setup when setup is needed', () => {
    expect(authenticatedLandingPath(['Principal'], '00000000-0000-0000-0000-000000000000')).toBe('/campus/setup')
  })

  it('returns normal landing path when campus is set', () => {
    expect(authenticatedLandingPath(['Principal'], 'a-real-campus-id')).toBe('/campus/dashboard')
  })

  it('returns student dashboard for Student', () => {
    expect(authenticatedLandingPath(['Student'], 'campus-id')).toBe('/student/dashboard')
  })
})
