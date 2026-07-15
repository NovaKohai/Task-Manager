import type { Language, LocaleConfig } from './types'
import { en } from './locales/en'
import { ar } from './locales/ar'

type Translations = Record<string, Record<string, string>>

const translations: Translations = {
  en,
  ar
}

export const LOCALE_CONFIGS: Record<Language, LocaleConfig> = {
  en: { lang: 'en', label: 'EN', localeStr: 'en-US', dir: 'ltr' },
  ar: { lang: 'ar', label: 'AR', localeStr: 'ar-SA', dir: 'rtl' },
}

const FALLBACK_LANG: Language = 'en'

const LANGUAGES = Object.keys(LOCALE_CONFIGS) as Language[]

class I18n {
  private currentLang: Language
  private langListeners: Set<() => void> = new Set()

  constructor() {
    const saved = (localStorage.getItem('ttm_lang') as Language) || FALLBACK_LANG
    this.currentLang = saved in LOCALE_CONFIGS ? saved : FALLBACK_LANG

    this.applyDom()
  }

  private applyDom() {
    const cfg = LOCALE_CONFIGS[this.currentLang]
    document.documentElement.lang = this.currentLang
    document.documentElement.dir = cfg.dir
    document.documentElement.classList.toggle('rtl', cfg.dir === 'rtl')
  }

  get lang() { return this.currentLang }
  set lang(l: string) {
    const next = (l in LOCALE_CONFIGS ? l : FALLBACK_LANG) as Language
    this.currentLang = next
    localStorage.setItem('ttm_lang', next)
    this.applyDom()
    this.langListeners.forEach((cb) => cb())
  }

  get localeStr() { return LOCALE_CONFIGS[this.currentLang].localeStr }

  get dir() { return LOCALE_CONFIGS[this.currentLang].dir }

  t(key: string): string {
    return translations[this.currentLang]?.[key] || translations[FALLBACK_LANG]?.[key] || key
  }

  subscribe(cb: () => void): () => void {
    this.langListeners.add(cb)
    return () => { this.langListeners.delete(cb) }
  }

  toggle() {
    const langs = LANGUAGES
    const idx = langs.indexOf(this.currentLang)
    this.lang = langs[(idx + 1) % langs.length]
  }
}

export const i18n = new I18n()
