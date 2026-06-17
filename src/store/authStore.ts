import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  role: 'CLIENT' | 'COUNSELOR' | 'ADMIN'
  name: string
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  isLoggedIn: boolean
  setAuth: (auth: { accessToken: string; refreshToken?: string | null; user: User }) => void
  setTokens: (tokens: { accessToken: string; refreshToken?: string | null }) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isLoggedIn: false,
      setAuth: ({ accessToken, refreshToken = null, user }) =>
        set({ accessToken, refreshToken, user, isLoggedIn: true }),
      setTokens: ({ accessToken, refreshToken }) =>
        set((prev) => ({
          accessToken,
          refreshToken: refreshToken ?? prev.refreshToken,
        })),
      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, user: null, isLoggedIn: false }),
    }),
    {
      name: 'rapport-auth',
    }
  )
)
