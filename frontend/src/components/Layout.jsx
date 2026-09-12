import { Brain as BrainCircuit, Compass, Heart, House as Home, SignIn as LogIn, Sparkle as Sparkles, Star, UserCircle as UserRound } from '@phosphor-icons/react'
import { COPY, NAV_ITEMS } from '../constants/copy'

const ICONS = { home: Home, concierge: BrainCircuit, discover: Compass, recommendations: Heart, ratings: Star }
const FOOTER_ITEMS = []
for (const item of NAV_ITEMS) {
  if (!item.auth) FOOTER_ITEMS.push(item)
}

function BrandGlyph() {
  return (
    <svg viewBox="0 0 40 40" role="img" aria-hidden="true">
      <path d="M8 32V18C8 10.8 13.4 5 20 5s12 5.8 12 13v14" />
      <path d="M14.5 32V19.5c0-3.7 2.5-6.5 5.5-6.5s5.5 2.8 5.5 6.5V32" />
      <path className="brand-glyph-play" d="m18 20 7 4-7 4Z" />
    </svg>
  )
}

function Navigation({ page, navigate, user }) {
  const visibleItems = NAV_ITEMS.filter((item) => !item.auth || user)
  return (
    <nav className="nav" aria-label={COPY.layout.navLabel}>
      {visibleItems.map((item) => {
        const Icon = ICONS[item.id]
        return (
          <a
            key={item.id}
            href={`/#${item.id}`}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={(event) => navigate(item.id, event)}
            aria-current={page === item.id ? 'page' : undefined}
          >
            <Icon size={19} aria-hidden="true" />
            <span>{item.label}</span>
          </a>
        )
      })}
    </nav>
  )
}

export default function Layout({ children, page, navigate, user, logout }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">{COPY.app.skipLink}</a>
      <header className="mobile-header">
        <a className="mobile-brand" href="/#home" onClick={(event) => navigate('home', event)} aria-label={COPY.layout.brandLabel}>
          <span className="brand-mark"><BrandGlyph /></span>
          <span><b>{COPY.layout.brandStart}</b>{COPY.layout.brandEnd}</span>
        </a>
        {user ? (
          <button className="mobile-account" type="button" onClick={logout} aria-label={`${COPY.layout.logout}، ${user.username}`}>
            <UserRound size={21} aria-hidden="true" /><span>{COPY.layout.logout}</span>
          </button>
        ) : (
          <a className="mobile-account" href="/#auth" onClick={(event) => navigate('auth', event)}>
            <LogIn size={21} aria-hidden="true" /><span>{COPY.layout.login}</span>
          </a>
        )}
      </header>
      <aside className="sidebar" style={{ viewTransitionName: 'persistent-nav' }}>
        <a className="brand" href="/#home" onClick={(event) => navigate('home', event)} aria-label={COPY.layout.brandLabel}>
          <span className="brand-mark"><BrandGlyph /></span>
          <span><b>{COPY.layout.brandStart}</b>{COPY.layout.brandEnd}<small>{COPY.layout.tagline}</small></span>
        </a>
        <Navigation page={page} navigate={navigate} user={user} />
        <div className="sidebar-footer">
          {user ? (
            <>
              <div className="user-chip">
                <span><UserRound size={18} aria-hidden="true" /></span>
                <div><small>{COPY.layout.welcome}</small><strong>{user.username}</strong></div>
              </div>
              <button className="text-button" type="button" onClick={logout}>{COPY.layout.logout}</button>
            </>
          ) : (
            <a className="login-cta" href="/#auth" onClick={(event) => navigate('auth', event)}>
              <LogIn size={18} aria-hidden="true" /> {COPY.layout.login}
            </a>
          )}
        </div>
      </aside>
      <main id="main-content" className="main-content" tabIndex="-1">
        {children}
      </main>
      <div className="mobile-nav" style={{ viewTransitionName: 'persistent-mobile-nav' }}>
        <Navigation page={page} navigate={navigate} user={user} />
      </div>
    </div>
  )
}

export function SiteFooter({ navigate }) {
  return (
    <footer className="site-footer">
      <div className="footer-lead">
        <span className="eyebrow">{COPY.layout.footerEyebrow}</span>
        <h2>{COPY.layout.footerTitle}</h2>
        <p>{COPY.layout.footerText}</p>
      </div>
      <div className="footer-data">
        <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" aria-label="وب‌سایت TMDB">
          <span className="tmdb-wordmark" lang="en" dir="ltr" translate="no">TMDB</span>
        </a>
        <p>{COPY.layout.footerData}</p>
      </div>
      <nav className="footer-nav" aria-label={COPY.layout.footerNavLabel}>
        {FOOTER_ITEMS.map((item) => (
          <a key={item.id} href={`/#${item.id}`} onClick={(event) => navigate(item.id, event)}>{item.label}</a>
        ))}
      </nav>
      <Sparkles className="footer-spark" aria-hidden="true" />
    </footer>
  )
}
