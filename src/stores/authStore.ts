import { create } from 'zustand'
import type { User } from '@/lib/types'
import { db } from '@/lib/db'
import { yieldToUI } from '@/lib/utils'

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
  isLoading: !!localStorage.getItem('ttm_token'),

  login: async (username: string, password: string) => {
    set({ isLoading: true })
    await yieldToUI()
    try {
      const session = await db.authenticate(username, password)
      if (!session) {
        set({ isLoading: false })
        return false
      }
      localStorage.setItem('ttm_token', session.token)
      set({ user: session.user, token: session.token, isLoading: false })
      return true
    } catch (e) {
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
    try {
      await yieldToUI()
      const user = db.validateSession(token)
      if (user) {
        set({ user, token })
      } else {
        localStorage.removeItem('ttm_token')
        set({ user: null, token: null })
      }
    } catch (e) {
      console.error('checkSession failed', e)
      localStorage.removeItem('ttm_token')
      set({ user: null, token: null })
    } finally {
      set({ isLoading: false })
    }
  },
}))
