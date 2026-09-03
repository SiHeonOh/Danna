import { useEffect, useRef } from 'react'

// Cross-device sync fallback for users whose networks block the Supabase
// realtime websocket: re-pull data whenever the tab/PWA returns to the
// foreground (or the connection comes back). Throttled so rapid alt-tabbing
// doesn't spam queries. With working realtime this is harmless — the refetch
// returns the same rows the echoes already applied.
export function useRefetchOnFocus(refetch: () => void, minIntervalMs = 15000) {
  const lastRunRef = useRef(Date.now())
  useEffect(() => {
    const maybeRefetch = () => {
      if (document.visibilityState !== 'visible') return
      const now = Date.now()
      if (now - lastRunRef.current < minIntervalMs) return
      lastRunRef.current = now
      refetch()
    }
    window.addEventListener('focus', maybeRefetch)
    document.addEventListener('visibilitychange', maybeRefetch)
    window.addEventListener('online', maybeRefetch)
    return () => {
      window.removeEventListener('focus', maybeRefetch)
      document.removeEventListener('visibilitychange', maybeRefetch)
      window.removeEventListener('online', maybeRefetch)
    }
  }, [refetch, minIntervalMs])
}
