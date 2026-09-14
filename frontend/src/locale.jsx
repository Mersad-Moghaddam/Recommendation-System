/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { COPY, setCopyLocale } from './constants/copy'
import { setFormattingLocale } from './utils'

export const LOCALE_STORAGE_KEY = 'cinematch-locale-v1'
const LocaleContext = createContext(null)

const LOCALE_DETAILS = {
  en: { dir: 'ltr', documentTitle: 'Cinematch | Movie and series recommendations', lang: 'en' },
  fa: { dir: 'rtl', documentTitle: 'سینمچ | پیشنهاد و پیگیری فیلم و سریال', lang: 'fa' },
}

function readLocale() {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY) === 'fa' ? 'fa' : 'en'
  } catch {
    return 'en'
  }
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(readLocale)
  setCopyLocale(locale)
  setFormattingLocale(locale)

  useEffect(() => {
    const details = LOCALE_DETAILS[locale]
    document.documentElement.lang = details.lang
    document.documentElement.dir = details.dir
    document.title = details.documentTitle
  }, [locale])

  const setLocale = (nextLocale) => {
    const next = nextLocale === 'fa' ? 'fa' : 'en'
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next)
    } catch {
      // Keep the language usable for this visit when persistent storage is unavailable.
    }
    setLocaleState(next)
  }

  const value = {
    copy: COPY,
    formatNumber: (number) => new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US').format(number),
    locale,
    setLocale,
  }
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const locale = useContext(LocaleContext)
  if (!locale) throw new Error('useLocale must be used within LocaleProvider')
  return locale
}

export function localeDirection(locale) {
  return locale === 'fa' ? 'rtl' : 'ltr'
}
