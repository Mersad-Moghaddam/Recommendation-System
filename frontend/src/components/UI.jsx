import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, Film, LoaderCircle, X } from 'lucide-react'
import { COPY } from '../constants/copy'

export function Hero({ eyebrow, title, description, children, visual, className = '' }) {
  return (
    <section className={`hero ${className}`}>
      {visual}
      <div className="hero-film-strip" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <div className="hero-content">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {children ? <div className="hero-actions">{children}</div> : null}
      </div>
    </section>
  )
}

export function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="section-heading">
      <div><span>{eyebrow}</span><h2>{title}</h2></div>
      {action}
    </div>
  )
}

export function Empty({ title = COPY.common.emptyTitle, text = COPY.common.emptyText }) {
  return <div className="empty"><Film size={34} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></div>
}

export function Loading({ count = 6 }) {
  return (
    <div className="movie-grid" aria-label={COPY.app.loadingPage} aria-busy="true">
      {Array.from({ length: count }, (_, index) => <div className="skeleton" key={index}><i /><b /><span /><span /></div>)}
    </div>
  )
}

export function PageLoading() {
  return <div className="page-loading"><span className="projector-loader"><i /></span><p>{COPY.app.loadingPage}</p></div>
}

export function ErrorMessage({ children }) {
  return <div className="error-message" role="alert"><AlertCircle size={20} aria-hidden="true" /><span>{children}</span></div>
}

export function Dialog({ title, children, onClose, className = '' }) {
  const dialogRef = useRef(null)
  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return createPortal(
    <dialog
      ref={dialogRef}
      className={`dialog ${className}`}
      aria-label={title}
      onCancel={(event) => { event.preventDefault(); onClose() }}
    >
      <section className="dialog-panel">
        <header><h2>{title}</h2><button type="button" onClick={onClose} aria-label={COPY.common.close}><X aria-hidden="true" /></button></header>
        {children}
      </section>
    </dialog>,
    document.body,
  )
}

export function SpinnerLabel({ children }) {
  return <span className="spinner-label"><LoaderCircle size={18} aria-hidden="true" />{children}</span>
}
