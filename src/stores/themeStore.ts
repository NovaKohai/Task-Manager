import { create } from 'zustand'

interface ThemeState {
  isDark: boolean
  toggle: () => void
  setDark: (val: boolean) => void
}

function getInitialDark(): boolean {
  const stored = localStorage.getItem('ttm_theme')
  if (stored) return stored === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: getInitialDark(),

  toggle: () =>
    set((state) => {
      const next = !state.isDark
      localStorage.setItem('ttm_theme', next ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', next)
      return { isDark: next }
    }),

  setDark: (val) => {
    localStorage.setItem('ttm_theme', val ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', val)
    set({ isDark: val })
  },
}))
