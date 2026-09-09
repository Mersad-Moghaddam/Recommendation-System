import { useEffect, useState } from 'react'
import { ArrowClockwise, WifiSlash, X } from '@phosphor-icons/react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { COPY } from '../constants/copy'

export default function PwaStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  const [installEvent, setInstallEvent] = useState(null)
  const [dismissedIos, setDismissedIos] = useState(false)
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine)
    const captureInstall = (event) => {
      event.preventDefault()
      setInstallEvent(event)
    }
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)
    window.addEventListener('beforeinstallprompt', captureInstall)
    return () => {
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOnline)
      window.removeEventListener('beforeinstallprompt', captureInstall)
    }
  }, [])

  const install = async () => {
    await installEvent.prompt()
    await installEvent.userChoice
    setInstallEvent(null)
  }
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    && !window.matchMedia('(display-mode: standalone)').matches

  if (!online) {
    return <div className="app-status offline" role="status"><WifiSlash size={20} aria-hidden="true" />{COPY.pwa.offline}</div>
  }
  if (needRefresh) {
    return (
      <div className="app-status update" role="status">
        <span>{COPY.pwa.update}</span>
        <button type="button" onClick={() => updateServiceWorker(true)}><ArrowClockwise size={18} aria-hidden="true" />{COPY.pwa.updateAction}</button>
        <button type="button" className="status-close" onClick={() => setNeedRefresh(false)} aria-label={COPY.common.close}><X size={18} aria-hidden="true" /></button>
      </div>
    )
  }
  if (installEvent) {
    return <button type="button" className="install-prompt" onClick={install}>{COPY.pwa.install}</button>
  }
  if (isIos && !dismissedIos) {
    return (
      <div className="app-status ios" role="status">
        <span>{COPY.pwa.ios}</span>
        <button type="button" className="status-close" onClick={() => setDismissedIos(true)} aria-label={COPY.common.close}><X size={18} aria-hidden="true" /></button>
      </div>
    )
  }
  return null
}
