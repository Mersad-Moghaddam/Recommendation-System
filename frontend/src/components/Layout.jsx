import { Brain as BrainCircuit, ClockCounterClockwise, Compass, House as Home, SignIn as LogIn, SignOut, Sparkle as Sparkles, Translate, UserCircle as UserRound } from '@phosphor-icons/react'
import { COPY, NAV_ITEMS } from '../constants/copy'
import PwaStatus from './PwaStatus'
import ThemeToggle from './ThemeToggle'

const ICONS = { home: Home, concierge: BrainCircuit, discover: Compass, recommendations: Sparkles, tracker: ClockCounterClockwise, profile: UserRound }

function BrandGlyph() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <path d="M7 9.5h26v21H7z" />
      <path d="M13 9.5v21M27 9.5v21M7 16.5h26M7 23.5h26" />
      <path className="brand-glyph-play" d="m18 16 7 4-7 4Z" />
    </svg>
  )
}

function Navigation({ page, navigate, mobile = false }) {
  const visibleItems = NAV_ITEMS
  return (
    <nav className={mobile ? 'dock-nav' : 'masthead-nav'} aria-label={COPY.layout.navLabel}>
      {visibleItems.map((item) => {
        const Icon = ICONS[item.id]
        const active = page === item.id
        return (
          <a key={item.id} href={`/#${item.id}`} className={`nav-item ${active ? 'active' : ''}`} onClick={(event) => navigate(item.id, event)} aria-current={active ? 'page' : undefined}>
            <Icon size={mobile ? 21 : 18} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
            <span>{item.label}</span>
          </a>
        )
      })}
    </nav>
  )
}

function LanguageSwitcher({ locale, setLocale }) {
  const nextLocale = locale === 'en' ? 'fa' : 'en'
  const label = nextLocale === 'en' ? COPY.layout.switchToEnglish : COPY.layout.switchToPersian
  return (
    <button className="theme-toggle" type="button" onClick={() => setLocale(nextLocale)} aria-label={label} title={label}>
      <Translate size={19} aria-hidden="true" />
      <span lang={nextLocale} dir={nextLocale === 'fa' ? 'rtl' : 'ltr'}>{nextLocale === 'en' ? 'EN' : 'فا'}</span>
    </button>
  )
}

export default function Layout({ children, page, navigate, user, logout, locale, setLocale }) {
  const pageLabels = Object.fromEntries(NAV_ITEMS.map((item) => [item.id, item.label]))
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">{COPY.app.skipLink}</a>
      <header className="masthead" style={{ viewTransitionName: 'persistent-nav' }}>
        <div className="marquee-rail" aria-hidden="true"><i /><span /></div>
        <a className="brand" href="/#home" onClick={(event) => navigate('home', event)} aria-label={COPY.layout.brandLabel}>
          <span className="brand-mark"><BrandGlyph /></span>
          <span className="brand-copy"><b>{COPY.layout.brandStart}<em>{COPY.layout.brandEnd}</em></b><small>{COPY.layout.tagline}</small></span>
        </a>
        <div className="route-title" aria-hidden="true"><span>{COPY.layout.nowShowing}</span><b>{pageLabels[page] || `${COPY.layout.brandStart}${COPY.layout.brandEnd}`}</b></div>
        <Navigation page={page} navigate={navigate} user={user} />
        <div className="masthead-actions">
          <PwaStatus />
          <LanguageSwitcher locale={locale} setLocale={setLocale} />
          <ThemeToggle />
          {user ? (
            <><a className="account-action" href="/#profile" onClick={(event) => navigate('profile', event)} aria-label={`${COPY.layout.account}: ${user.username}`}><UserRound size={19} aria-hidden="true" /><span>{user.username}</span></a><button className="logout-action" type="button" onClick={logout} aria-label={COPY.layout.logout}><SignOut size={18} aria-hidden="true" /></button></>
          ) : (
            <a className="account-action" href="/#auth" onClick={(event) => navigate('auth', event)}><LogIn size={19} aria-hidden="true" /><span>{COPY.layout.login}</span></a>
          )}
        </div>
      </header>
      <main id="main-content" className="main-content" tabIndex="-1">{children}</main>
      <div className="mobile-dock" style={{ viewTransitionName: 'persistent-mobile-nav' }}><Navigation page={page} navigate={navigate} user={user} mobile /></div>
    </div>
  )
}

export function SiteFooter({ navigate }) {
  const footerItems = NAV_ITEMS.filter((item) => !item.auth)
  return (
    <footer className="site-footer">
      <div className="footer-lead"><span>{COPY.layout.footerEyebrow}</span><h2>{COPY.layout.footerTitle}</h2><p>{COPY.layout.footerText}</p></div>
      <div className="footer-data"><a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" aria-label={COPY.layout.tmdbLabel}><span className="tmdb-wordmark" lang="en" dir="ltr" translate="no">TMDB</span></a><p>{COPY.layout.footerData}</p></div>
      <nav className="footer-nav" aria-label={COPY.layout.footerNavLabel}>{footerItems.map((item) => <a key={item.id} href={`/#${item.id}`} onClick={(event) => navigate(item.id, event)}>{item.label}</a>)}</nav>
      <Sparkles className="footer-spark" aria-hidden="true" />
    </footer>
  )
}
