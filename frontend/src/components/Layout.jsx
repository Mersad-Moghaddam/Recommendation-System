import { BrainCircuit, Clapperboard, Compass, Heart, Home, LogIn, Star, UserRound } from 'lucide-react'
import { COPY, NAV_ITEMS } from '../constants/copy'

const ICONS = { home: Home, concierge: BrainCircuit, discover: Compass, recommendations: Heart, ratings: Star }

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
      <main id="main-content" className="main-content">{children}</main>
      <div className="mobile-nav" style={{ viewTransitionName: 'persistent-mobile-nav' }}>
        <Navigation page={page} navigate={navigate} user={user} />
      </div>
    </div>
  )
}
