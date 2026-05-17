import { describe, it, expect, vi, beforeEach } from 'vitest'
import { enqueueAttendance, pendingCount, flushQueue } from '../lib/offlineQueue'

// Mock axiosClient so flushQueue does not make real HTTP calls
vi.mock('../api/axiosClient', () => ({
  axiosClient: {
    post: vi.fn(),
  },
}))

import { axiosClient } from '../api/axiosClient'

const makePayload = (sectionId = 'sec-1') => ({
  sectionId,
  date: '2026-05-17',
  entries: [
    { studentId: 'stu-1', isPresent: false, isLate: false, isLeave: false },
  ],
})

beforeEach(async () => {
  // Drain pending table between tests by flushing (items are deleted on success)
  vi.mocked(axiosClient.post).mockResolvedValue({ status: 200 })
  await flushQueue()
  vi.clearAllMocks()
})

describe('enqueueAttendance', () => {
  it('adds one entry to pending table', async () => {
    await enqueueAttendance(makePayload())

    expect(await pendingCount()).toBe(1)
  })

  it('adds multiple entries independently', async () => {
    await enqueueAttendance(makePayload('sec-a'))
    await enqueueAttendance(makePayload('sec-b'))

    expect(await pendingCount()).toBe(2)
  })
})

describe('pendingCount', () => {
  it('returns 0 when queue is empty', async () => {
    expect(await pendingCount()).toBe(0)
  })
})

describe('flushQueue', () => {
  it('posts each queued item and removes it', async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({ status: 200 })
    await enqueueAttendance(makePayload())

    const result = await flushQueue()

    expect(result.sent).toBe(1)
    expect(result.failed).toBe(0)
    expect(await pendingCount()).toBe(0)
  })

  it('includes isOfflineEntry flag in POST payload', async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({ status: 200 })
    await enqueueAttendance(makePayload())

    await flushQueue()

    expect(axiosClient.post).toHaveBeenCalledWith(
      '/academic/attendance',
      expect.objectContaining({ isOfflineEntry: true }),
    )
  })

  it('counts failed items and leaves them in queue', async () => {
    vi.mocked(axiosClient.post).mockRejectedValue(new Error('Network error'))
    await enqueueAttendance(makePayload())

    const result = await flushQueue()

    expect(result.sent).toBe(0)
    expect(result.failed).toBe(1)
    expect(await pendingCount()).toBe(1)
  })

  it('returns 0/0 for empty queue', async () => {
    const result = await flushQueue()

    expect(result.sent).toBe(0)
    expect(result.failed).toBe(0)
  })
})
