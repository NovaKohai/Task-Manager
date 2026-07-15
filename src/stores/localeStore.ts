import { create } from 'zustand'
import { i18n, LOCALE_CONFIGS } from '@/lib/i18n'
import type { Language } from '@/lib/types'

interface LocaleState {
  lang: Language
  toggle: () => void
  setLang: (l: Language) => void
}

function getInitialLang(): Language {
  const stored = localStorage.getItem('ttm_lang') as Language
  return stored in LOCALE_CONFIGS ? stored : 'en'
}

export const useLocaleStore = create<LocaleState>((set) => ({
  lang: getInitialLang(),

  toggle: () => {
    i18n.toggle()
    set({ lang: i18n.lang as Language })
  },

  setLang: (l) => {
    i18n.lang = l
    set({ lang: l })
  },
}))
