import { create } from 'zustand'
import { User } from 'firebase/auth'

interface AuthState {
  user: User | null
  profile: Record<string, any> | null
  loading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Record<string, any> | null) => void
  setLoading: (v: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
}))
