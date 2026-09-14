import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { LocaleProvider, useLocale } from '../locale'

function LocaleProbe() {
  const { copy, formatNumber, locale, setLocale } = useLocale()
  return (
    <>
      <p>{copy.home.primaryAction}</p>
      <output>{formatNumber(12345)}</output>
      <button type="button" onClick={() => setLocale('fa')}>Persian</button>
      <span>{locale}</span>
    </>
  )
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  document.documentElement.lang = 'en'
  document.documentElement.dir = 'ltr'
  document.title = ''
})

describe('locale migration', () => {
  it('starts in English and applies English document metadata', () => {
    render(<LocaleProvider><LocaleProbe /></LocaleProvider>)

    expect(screen.getByText('Build tonight\'s picks')).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('12,345')
    expect(document.documentElement).toHaveAttribute('lang', 'en')
    expect(document.documentElement).toHaveAttribute('dir', 'ltr')
    expect(document.title).toBe('Cinematch | Movie and series recommendations')
  })

  it('switches to Persian without navigation and persists the chosen locale', () => {
    render(<LocaleProvider><LocaleProbe /></LocaleProvider>)
    const locationBeforeSwitch = window.location.href

    fireEvent.click(screen.getByRole('button', { name: 'Persian' }))

    expect(screen.getByText('ساخت پیشنهاد امشب')).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('۱۲٬۳۴۵')
    expect(document.documentElement).toHaveAttribute('lang', 'fa')
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(localStorage.getItem('cinematch-locale-v1')).toBe('fa')
    expect(window.location.href).toBe(locationBeforeSwitch)
  })
})
