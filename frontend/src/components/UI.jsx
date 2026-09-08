import { AlertCircle, Film, LoaderCircle, X } from 'lucide-react'

export function Hero({ eyebrow, title, description, children, variant = '' }) {
  return <section className={`hero ${variant}`}>
    <div className="hero-reel" aria-hidden="true"><i /><i /><i /></div>
    <div className="hero-content"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p>{children && <div className="hero-actions">{children}</div>}</div>
  </section>
}

export function SectionTitle({ eyebrow, title, action }) {
  return <div className="section-heading"><div><span>{eyebrow}</span><h2>{title}</h2></div>{action}</div>
}

export function Empty({ title = 'چیزی پیدا نشد', text = 'فیلترها را تغییر بده و دوباره امتحان کن.' }) {
  return <div className="empty"><Film size={34} /><h3>{title}</h3><p>{text}</p></div>
}

export function Loading({ count = 6 }) {
  return <div className="movie-grid">{Array.from({ length: count }, (_, i) => <div className="skeleton" key={i}><i /><b /><span /><span /></div>)}</div>
}

export function ErrorMessage({ children }) {
  return <div className="error-message" role="alert"><AlertCircle size={20} /><span>{children}</span></div>
}

export function Modal({ title, children, onClose, wide = false }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
      <header><h2>{title}</h2><button onClick={onClose} aria-label="بستن"><X /></button></header>{children}
    </section>
  </div>
}

export function SpinnerLabel({ children }) { return <span className="spinner-label"><LoaderCircle size={18} />{children}</span> }
