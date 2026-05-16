import { useEffect, useState } from 'react'
import { pendingCount, flushQueue } from '../../lib/offlineQueue'

export default function OfflineBanner() {
  const [online, setOnline] = useState<boolean>(navigator.onLine)
  const [pending, setPending] = useState<number>(0)

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    const tick = setInterval(async () => setPending(await pendingCount()), 5000)
    pendingCount().then(setPending)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      clearInterval(tick)
    }
  }, [])

  if (online && pending === 0) return null

  return (
    <div className={`fixed top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow text-sm font-medium ${
      !online ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
    }`}>
      {!online && <>📴 Offline — attendance is being queued locally.</>}
      {online && pending > 0 && (
        <button onClick={() => flushQueue().then(async () => setPending(await pendingCount()))}>
          📤 {pending} attendance batch(es) pending — click to sync now
        </button>
      )}
    </div>
  )
}
