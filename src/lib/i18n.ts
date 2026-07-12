import { en } from './locales/en'
import { ar } from './locales/ar'

type Translations = Record<string, Record<string, string>>

const translations: Translations = {
  en,
  ar
}

class I18n {
  private currentLang: string
  private langListeners: Set<() => void> = new Set()

  constructor() {
    const saved = localStorage.getItem('ttm_lang') || 'en'
    this.currentLang = saved

    // Initialize DOM language and direction attributes on load
    document.documentElement.lang = saved
    document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.classList.toggle('rtl', saved === 'ar')
  }

  get lang() { return this.currentLang }
  set lang(l: string) {
    this.currentLang = l
    localStorage.setItem('ttm_lang', l)
    document.documentElement.lang = l
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.classList.toggle('rtl', l === 'ar')
    this.langListeners.forEach((cb) => cb())
  }

  t(key: string): string {
    return translations[this.currentLang]?.[key] || translations['en']?.[key] || key
  }

  // Subscribe any consumer (typically a small useI18n hook) to language flips so
  // the underlying React tree re-renders without a window.location.reload().
  subscribe(cb: () => void): () => void {
    this.langListeners.add(cb)
    return () => { this.langListeners.delete(cb) }
  }

  toggle() {
    // Mutate `lang` synchronously (which fans out to subscribers) instead of
    // calling window.location.reload() — preserves in-memory component state.
    this.lang = this.currentLang === 'en' ? 'ar' : 'en'
  }
}

export const i18n = new I18n()
