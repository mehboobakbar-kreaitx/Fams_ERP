import Dexie, { type Table } from 'dexie'
import toast from 'react-hot-toast'
import { axiosClient } from '../api/axiosClient'

export type QueuedAttendance = {
  id?: number
  sectionId: string
  date: string
  entries: Array<{ studentId: string; isPresent: boolean; isLate: boolean; isLeave: boolean; remarks?: string | null }>
  queuedAt: string
}

class AttendanceDb extends Dexie {
  pending!: Table<QueuedAttendance, number>

  constructor() {
    super('fams-attendance')
    this.version(1).stores({ pending: '++id, sectionId, date, queuedAt' })
  }
}

const db = new AttendanceDb()

export async function enqueueAttendance(payload: Omit<QueuedAttendance, 'id' | 'queuedAt'>): Promise<void> {
  await db.pending.add({ ...payload, queuedAt: new Date().toISOString() })
}

export async function pendingCount(): Promise<number> {
  return db.pending.count()
}

export async function flushQueue(): Promise<{ sent: number; failed: number }> {
  const items = await db.pending.toArray()
  let sent = 0, failed = 0
  for (const item of items) {
    try {
      await axiosClient.post('/academic/attendance', {
        sectionId: item.sectionId,
        date: item.date,
        entries: item.entries,
        isOfflineEntry: true,
      })
      if (item.id != null) await db.pending.delete(item.id)
      sent++
    } catch {
      failed++
    }
  }
  return { sent, failed }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushQueue()
      .then(({ sent, failed }) => {
        if (sent === 0 && failed === 0) return
        if (failed === 0) {
          toast.success(`Synced ${sent} queued attendance batch${sent === 1 ? '' : 'es'}.`)
        } else {
          toast(`Synced ${sent}, ${failed} batch${failed === 1 ? '' : 'es'} still pending — will retry when online.`, { icon: '⚠️' })
        }
      })
      .catch(() => undefined)
  })
}
