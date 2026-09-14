import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { CheckCircle as CheckCircle2, WarningCircle as AlertCircle } from '@phosphor-icons/react'
import { api } from './api'
import Layout, { SiteFooter } from './components/Layout'
import PageTransition from './components/PageTransition'
import { PageLoading } from './components/UI'
import RatingDialog from './components/RatingDialog'
import { COPY } from './constants/copy'
import { useLocale } from './locale'
import { movieId } from './utils'
import { isModifiedClick, PROTECTED_PAGES, readRoute, routeUrl } from './app/routing'
import { useFeedback } from './app/useFeedback'
import { useSession } from './app/useSession'
import { useMediaActions } from './app/useMediaActions'

const Auth = lazy(() => import('./pages/Auth'))
const Concierge = lazy(() => import('./pages/Concierge'))
const Discover = lazy(() => import('./pages/Discover'))
const Home = lazy(() => import('./pages/Home'))
const MovieDetails = lazy(() => import('./pages/MovieDetails'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Ratings = lazy(() => import('./pages/Ratings'))
const Recommendations = lazy(() => import('./pages/Recommendations'))
const Tracker = lazy(() => import('./pages/Tracker'))
const Profile = lazy(() => import('./pages/Profile'))
const PAGE_TITLES = {
  auth: 'auth', concierge: 'concierge', detail: 'detail', discover: 'discover', home: 'home', onboarding: 'onboarding', ratings: 'ratings', recommendations: 'recommendations', tracker: 'tracker', profile: 'profile',
}

function AppPage({ route, user, detailSeed, navigate, changeRoute, changeRawRoute, replaceParams, openDetails, openRate, saveToLibrary, showError, authenticate, logout }) {
  const common = { user, onRate: openRate, onDetails: openDetails, onTrack: saveToLibrary }
  if (route.page === 'detail' && route.params.get('id')) {
    const from = route.params.get('from') || 'home'
    return <MovieDetails {...common} id={route.params.get('id')} seed={detailSeed} goBack={() => changeRawRoute(from, true)} />
  }
  if (route.page === 'auth') {
    return <Auth onAuthenticated={authenticate} />
  }
  if (PROTECTED_PAGES.has(route.page) && !user) {
    return <Auth onAuthenticated={authenticate} />
  }
  if (route.page === 'onboarding') {
    return <Onboarding navigate={(page) => changeRoute(page)} next={route.params.get('next') || 'concierge'} />
  }
  if (route.page === 'concierge') return <Concierge {...common} />
  if (route.page === 'discover') return <Discover key={route.params.toString()} {...common} params={route.params} replaceParams={replaceParams} />
  if (route.page === 'recommendations') return <Recommendations {...common} params={route.params} changeRoute={changeRoute} />
  if (route.page === 'ratings') return <Ratings navigate={navigate} onDetails={openDetails} />
  if (route.page === 'tracker') return <Tracker {...common} navigate={navigate} showError={showError} />
  if (route.page === 'profile') return <Profile user={user} navigate={navigate} logout={logout} />
  return <Home {...common} navigate={navigate} showError={showError} />
}

export default function App() {
  const { locale, setLocale } = useLocale()
  const [route, setRoute] = useState(readRoute)
  const [detailSeed, setDetailSeed] = useState(null)
  const { toast, showError, showSuccess } = useFeedback()
  const { session, setSession, clearSession, loading: sessionLoading } = useSession(showError)
  const user = session.user

  useEffect(() => {
    document.title = COPY.app.documentTitle
    const syncRoute = () => setRoute(readRoute())
    window.addEventListener('popstate', syncRoute)
    window.addEventListener('hashchange', syncRoute)
    return () => {
      window.removeEventListener('popstate', syncRoute)
      window.removeEventListener('hashchange', syncRoute)
    }
  }, [])

  useEffect(() => {
    if (!sessionLoading && !user && PROTECTED_PAGES.has(route.page)) {
      const timer = window.setTimeout(() => {
        window.history.replaceState(null, '', routeUrl('auth', { next: route.page }))
        setRoute(readRoute())
      }, 0)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [route.page, sessionLoading, user])
  const detailId = route.params.get('id')
  useEffect(() => {
    window.scrollTo({ top: 0 })
    const frame = window.requestAnimationFrame(() => {
      const main = document.getElementById('main-content')
      main?.focus({ preventScroll: true })
      const title = COPY.pageTitles[PAGE_TITLES[route.page]]
      document.title = title ? `${title} | ${COPY.layout.brandStart}${COPY.layout.brandEnd}` : COPY.app.documentTitle
    })
    return () => window.cancelAnimationFrame(frame)
  }, [detailId, locale, route.page])
  const changeRoute = useCallback((page, params = {}, replace = false) => {
    const update = () => {
      window.history[replace ? 'replaceState' : 'pushState'](null, '', routeUrl(page, params))
      setRoute(readRoute())
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduced && typeof document.startViewTransition === 'function') {
      document.startViewTransition(update)
    } else {
      update()
    }
  }, [])
  const { ratingMovie, rating, ratingBusy, setRating, closeRating, openRate, saveRating, saveToLibrary } = useMediaActions({ user, route, changeRoute, showError, showSuccess })

  const changeRawRoute = useCallback((raw, replace = false) => {
    const [page, query = ''] = raw.split('?')
    changeRoute(page || 'home', Object.fromEntries(new URLSearchParams(query)), replace)
  }, [changeRoute])

  const navigate = useCallback((page, event, params = {}) => {
    if (isModifiedClick(event)) return
    event?.preventDefault()
    if (!user && PROTECTED_PAGES.has(page)) {
      changeRoute('auth', { next: page })
      return
    }
    changeRoute(page, params)
  }, [changeRoute, user])

  const replaceParams = useCallback((params) => changeRoute('discover', params, true), [changeRoute])
  const authenticate = (result) => {
    setSession(result)
    const destination = route.params.get('next') || 'recommendations'
    changeRoute(result.onboarding_required ? 'onboarding' : destination, result.onboarding_required ? { next: destination } : {})
    showSuccess(COPY.app.welcome)
  }
  const logout = async () => {
    try {
      await api.logout()
      clearSession()
      changeRoute('home')
      showSuccess(COPY.app.loggedOut)
    } catch (error) {
      showError(error)
    }
  }
  const openDetails = useCallback((movie, event) => {
    if (isModifiedClick(event)) return
    event?.preventDefault()
    setDetailSeed(movie)
    const from = route.page === 'detail'
      ? route.params.get('from') || 'home'
      : `${route.page}${route.params.size ? `?${route.params}` : ''}`
    changeRoute('detail', { id: movieId(movie), from })
  }, [changeRoute, route])
  if (sessionLoading) return <PageLoading />
  const activePage = route.page === 'detail' ? (route.params.get('from') || 'home').split('?')[0] : route.page
  return (
    <Layout page={activePage} navigate={navigate} user={user} logout={logout} locale={locale} setLocale={setLocale}>
      <Suspense fallback={<PageLoading />}>
        <PageTransition key={`${route.page}-${route.params.get('id') || ''}`}>
          <AppPage route={route} user={user} detailSeed={detailSeed} navigate={navigate} changeRoute={changeRoute} changeRawRoute={changeRawRoute} replaceParams={replaceParams} openDetails={openDetails} openRate={openRate} saveToLibrary={saveToLibrary} showError={showError} authenticate={authenticate} logout={logout} />
          <SiteFooter navigate={navigate} />
        </PageTransition>
      </Suspense>
      <RatingDialog movie={ratingMovie} rating={rating} busy={ratingBusy} onRatingChange={setRating} onSave={saveRating} onClose={closeRating} />
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toast ? <div className={`toast ${toast.type}`}>{toast.type === 'error' ? <AlertCircle size={19} aria-hidden="true" /> : <CheckCircle2 size={19} aria-hidden="true" />}{toast.message}</div> : null}
      </div>
    </Layout>
  )
}
