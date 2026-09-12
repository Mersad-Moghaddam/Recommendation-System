import { Moon, Sun } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'cinematch-theme-v1'

function preferredTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#070811' : '#F5F1E8')
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(preferredTheme)
  useEffect(() => {
    applyTheme(theme)
  }, [theme])
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return undefined
    const preference = window.matchMedia('(prefers-color-scheme: dark)')
    const followSystem = (event) => setTheme(event.matches ? 'dark' : 'light')
    preference.addEventListener('change', followSystem)
    return () => preference.removeEventListener('change', followSystem)
  }, [])
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  const label = nextTheme === 'dark' ? 'فعال‌کردن نمای تاریک' : 'فعال‌کردن نمای روشن'
  return (
    <button className="theme-toggle" type="button" onClick={() => { localStorage.setItem(STORAGE_KEY, nextTheme); setTheme(nextTheme) }} aria-label={label} title={label}>
      {theme === 'dark' ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
      <span>{theme === 'dark' ? 'روشن' : 'تاریک'}</span>
    </button>
  )
}
