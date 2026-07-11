import { create } from 'zustand'
import type { User } from '@/lib/types'
import { db } from '@/lib/db'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  checkSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('ttm_token'),
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true })
    await new Promise(r => setTimeout(r, 0))
    try {
      const session = await db.authenticate(username, password)
      if (!session) {
        set({ isLoading: false })
        return false
      }
      localStorage.setItem('ttm_token', session.token)
      set({ user: session.user, token: session.token, isLoading: false })
      return true
    } catch (e: any) {
      set({ isLoading: false })
      throw e
    }
  },

  logout: () => {
    const token = localStorage.getItem('ttm_token')
    if (token) db.deleteSession(token)
    localStorage.removeItem('ttm_token')
    set({ user: null, token: null })
  },

  checkSession: async () => {
    const token = localStorage.getItem('ttm_token')
    if (!token) {
      set({ user: null, token: null, isLoading: false })
      return
    }
    set({ isLoading: true })
    await new Promise(r => setTimeout(r, 0))
    const user = db.validateSession(token)
    if (user) {
      set({ user, token, isLoading: false })
    } else {
      localStorage.removeItem('ttm_token')
      set({ user: null, token: null, isLoading: false })
    }
  },
}))
