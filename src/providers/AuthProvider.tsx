import { useEffect, ReactNode } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'

/**
 * AuthProvider — initialises the Firebase auth listener EXACTLY ONCE for the
 * entire app. This avoids the race condition where multiple `useAuth()` callers
 * each set up their own listener, causing `loading` to never reach `false` if
 * one listener's component unmounts mid-fetch.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setProfile, setLoading } = useAuthStore()

  useEffect(() => {
    let cancelled = false

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true)
      setUser(firebaseUser)

      if (firebaseUser) {
        try {
          // Token is already in auth.currentUser — axios interceptor attaches it
          const { data } = await api.get('/api/auth/me')
          if (!cancelled) setProfile(data)
        } catch {
          // 403 = unprovisioned user; 401 = bad token — treat both as no access
          if (!cancelled) setProfile(null)
        }
      } else {
        if (!cancelled) setProfile(null)
      }

      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  return <>{children}</>
}
