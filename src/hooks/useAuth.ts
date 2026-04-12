import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut, signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'

/**
 * useAuth — reads from the global Zustand store.
 * Auth state is managed by AuthProvider; this hook only reads + provides
 * helper methods. It does NOT set up any listeners (that caused the race).
 */
export function useAuth() {
  const { user, profile, loading } = useAuthStore()

  const login = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password)

  const loginWithGoogle = () =>
    signInWithPopup(auth, googleProvider)

  const registerUser = async (email: string, password: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    return cred.user
  }

  const logout = async () => {
    // Clear local state immediately so UI reacts before onAuthStateChanged fires
    useAuthStore.getState().setProfile(null)
    useAuthStore.getState().setUser(null)
    useAuthStore.getState().setLoading(false)
    await signOut(auth)
  }

  return { user, profile, loading, login, logout, registerUser, loginWithGoogle }
}
