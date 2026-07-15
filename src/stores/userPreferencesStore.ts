import { create } from 'zustand'
import type { UserPreferences } from '@/lib/types'
import { db } from '@/lib/db'
import { useAuthStore } from './authStore'
import { yieldToUI } from '@/lib/utils'

interface UserPreferencesState {
  preferences: UserPreferences | null
  isLoading: boolean
  saved: boolean
  fetchPreferences: () => Promise<void>
  updatePreferences: (data: Partial<UserPreferences>) => Promise<void>
}

export const useUserPreferencesStore = create<UserPreferencesState>((set) => ({
  preferences: null,
  isLoading: false,
  saved: false,

  fetchPreferences: async () => {
    set({ isLoading: true })
    await yieldToUI()
    const user = useAuthStore.getState().user
    if (!user) { set({ isLoading: false }); return }
    const preferences = db.getUserPreferences(user.id)
    set({ preferences, isLoading: false })
  },

  updatePreferences: async (data) => {
    set({ isLoading: true, saved: false })
    await yieldToUI()
    const user = useAuthStore.getState().user
    if (!user) { set({ isLoading: false }); return }
    db.updateUserPreferences(user.id, data)
    const preferences = db.getUserPreferences(user.id)
    set({ preferences, isLoading: false, saved: true })
  },
}))
