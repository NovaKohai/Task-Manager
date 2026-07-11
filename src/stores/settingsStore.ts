import { create } from 'zustand'
import type { AppSettings } from '@/lib/types'
import { db } from '@/lib/db'
import { useAuthStore } from './authStore'

interface SettingsState {
  settings: AppSettings | null
  isLoading: boolean
  saved: boolean
  fetchSettings: () => Promise<void>
  updateSettings: (data: Partial<AppSettings>) => Promise<void>
  resetSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: false,
  saved: false,

  fetchSettings: async () => {
    set({ isLoading: true })
    await new Promise(r => setTimeout(r, 0))
    const settings = db.getSettings()
    set({ settings, isLoading: false })
  },

  updateSettings: async (data) => {
    set({ isLoading: true, saved: false })
    await new Promise(r => setTimeout(r, 0))
    const user = useAuthStore.getState().user
    db.updateSettings(data, user?.id, user?.username)
    const settings = db.getSettings()
    set({ settings, isLoading: false, saved: true })
  },

  resetSettings: async () => {
    set({ isLoading: true, saved: false })
    await new Promise(r => setTimeout(r, 0))
    const user = useAuthStore.getState().user
    db.resetSettings(user?.id, user?.username)
    const settings = db.getSettings()
    set({ settings, isLoading: false, saved: true })
  },
}))
