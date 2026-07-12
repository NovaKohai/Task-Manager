import { create } from 'zustand'
import { i18n } from '@/lib/i18n'

interface LocaleState {
  lang: 'en' | 'ar'
  toggle: () => void
  setLang: (l: 'en' | 'ar') => void
}

function getInitialLang(): 'en' | 'ar' {
  const stored = localStorage.getItem('ttm_lang')
  return stored === 'ar' ? 'ar' : 'en'
}

function applyLocale(l: 'en' | 'ar') {
  document.documentElement.lang = l
  document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.classList.toggle('rtl', l === 'ar')
}

function getNextLang(l: 'en' | 'ar'): 'en' | 'ar' {
  return l === 'en' ? 'ar' : 'en'
}

export const useLocaleStore = create<LocaleState>((set, get) => ({
  lang: getInitialLang(),

  toggle: () => {
    const next = getNextLang(get().lang)
    localStorage.setItem('ttm_lang', next)
    applyLocale(next)
    // Push through the legacy i18n singleton so non-React call sites (db.ts
    // audit/error messages) and the subscribe-based useI18n hook stay in sync.
    i18n.lang = next
    set({ lang: next })
  },

  setLang: (l) => {
    localStorage.setItem('ttm_lang', l)
    applyLocale(l)
    i18n.lang = l
    set({ lang: l })
  },
}))

// Apply initial DOM locale at module load so the singleton's saved state and
// the document attributes do not drift apart on first paint.
applyLocale(getInitialLang())
