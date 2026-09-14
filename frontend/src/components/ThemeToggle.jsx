import { Moon, Sun } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { COPY } from '../constants/copy'

const STORAGE_KEY = 'cinematch-theme-v1'

function storedTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : null
  } catch {
    return null
  }
}

function preferredTheme() {
  const saved = storedTheme()
  if (saved) return saved
  return 'dark'
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
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  const label = nextTheme === 'dark' ? COPY.layout.themeDark : COPY.layout.themeLight
  const selectTheme = () => {
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme)
    } catch {
      // Keep the theme usable for this visit when persistent storage is unavailable.
    }
    setTheme(nextTheme)
  }
  return (
    <button className="theme-toggle" type="button" onClick={selectTheme} aria-label={label} title={label}>
      {theme === 'dark' ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
      <span>{theme === 'dark' ? COPY.layout.themeLightShort : COPY.layout.themeDarkShort}</span>
    </button>
  )
}
