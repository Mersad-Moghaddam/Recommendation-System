import { Brain as BrainCircuit, Compass, Database, FilmSlate as Clapperboard, Heart, House as Home, SignIn as LogIn, Sparkle as Sparkles, Star, UserCircle as UserRound } from '@phosphor-icons/react'
import { COPY, NAV_ITEMS } from '../constants/copy'

const ICONS = { home: Home, concierge: BrainCircuit, discover: Compass, recommendations: Heart, ratings: Star }
const FOOTER_ITEMS = []
for (const item of NAV_ITEMS) {
  if (!item.auth) FOOTER_ITEMS.push(item)
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
          <span className="brand-mark"><Clapperboard size={22} aria-hidden="true" /></span>
          <span><b>{COPY.layout.brandStart}</b>{COPY.layout.brandEnd}</span>
        </a>
        <span className="mobile-catalog"><i aria-hidden="true" />{COPY.layout.catalogBadge}</span>
      </header>
      <aside className="sidebar" style={{ viewTransitionName: 'persistent-nav' }}>
        <a className="brand" href="/#home" onClick={(event) => navigate('home', event)} aria-label={COPY.layout.brandLabel}>
          <span className="brand-mark"><Clapperboard size={25} aria-hidden="true" /></span>
          <span><b>{COPY.layout.brandStart}</b>{COPY.layout.brandEnd}<small>{COPY.layout.tagline}</small></span>
        </a>
        <span className="catalog-badge">{COPY.layout.catalogBadge}</span>
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
      <main id="main-content" className="main-content">
        {children}
        <footer className="site-footer">
          <div className="footer-lead">
            <span className="eyebrow">{COPY.layout.footerEyebrow}</span>
            <h2>{COPY.layout.footerTitle}</h2>
            <p>{COPY.layout.footerText}</p>
          </div>
          <div className="footer-data"><Database size={20} aria-hidden="true" /><p>{COPY.layout.footerData}</p></div>
          <nav className="footer-nav" aria-label={COPY.layout.footerNavLabel}>
            {FOOTER_ITEMS.map((item) => (
              <a key={item.id} href={`/#${item.id}`} onClick={(event) => navigate(item.id, event)}>{item.label}</a>
            ))}
          </nav>
          <Sparkles className="footer-spark" aria-hidden="true" />
        </footer>
      </main>
      <div className="mobile-nav" style={{ viewTransitionName: 'persistent-mobile-nav' }}>
        <Navigation page={page} navigate={navigate} user={user} />
      </div>
    </div>
  )
}
