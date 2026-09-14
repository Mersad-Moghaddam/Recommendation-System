import { useEffect, useState } from 'react'
import { api } from '../api'

const EMPTY_SESSION = { user: null, onboarding_required: false }

export function useSession(onError) {
  const [session, setSession] = useState(EMPTY_SESSION)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try { localStorage.removeItem('cinematch-session-v1') } catch { /* Cookie auth remains authoritative. */ }
    api.me()
      .then(setSession)
      .catch((error) => { if (error.status && error.status !== 401) onError(error) })
      .finally(() => setLoading(false))
  }, [onError])

  return { session, setSession, clearSession: () => setSession(EMPTY_SESSION), loading }
}
