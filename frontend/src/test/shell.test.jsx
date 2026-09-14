import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PwaStatus from '../components/PwaStatus'
import { Dialog } from '../components/UI'

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}))

afterEach(() => {
  cleanup()
  Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'Mozilla/5.0' })
})

describe('app shell behavior', () => {
  it('restores focus to the dialog opener after close', () => {
    function DialogProbe() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Open dialog</button>
          {open ? <Dialog title="Rate this title" onClose={() => setOpen(false)}>Dialog content</Dialog> : null}
        </>
      )
    }

    render(<DialogProbe />)
    const opener = screen.getByRole('button', { name: 'Open dialog' })
    opener.focus()
    fireEvent.click(opener)
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(opener).toHaveFocus()
  })

  it('shows iOS installation guidance only after the install action', () => {
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' })
    window.matchMedia = (query) => ({
      matches: query === '(display-mode: standalone)' ? false : false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
    })

    render(<PwaStatus />)

    expect(screen.queryByText('To install on iOS, use Share, then Add to Home Screen.')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Install Cinematch' }))
    expect(screen.getByText('To install on iOS, use Share, then Add to Home Screen.')).toBeVisible()
  })
})
