import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { CheckCircle as CheckCircle2, Star, WarningCircle as AlertCircle } from '@phosphor-icons/react'
import { api } from './api'
import Layout, { SiteFooter } from './components/Layout'
import PageTransition from './components/PageTransition'
import PwaStatus from './components/PwaStatus'
import { Dialog, PageLoading, SpinnerLabel } from './components/UI'
import { COPY } from './constants/copy'
import { faNumber, movieId } from './utils'

const Auth = lazy(() => import('./pages/Auth'))
const Concierge = lazy(() => import('./pages/Concierge'))
const Discover = lazy(() => import('./pages/Discover'))
const Home = lazy(() => import('./pages/Home'))
const MovieDetails = lazy(() => import('./pages/MovieDetails'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Ratings = lazy(() => import('./pages/Ratings'))
const Recommendations = lazy(() => import('./pages/Recommendations'))
const PROTECTED_PAGES = new Set(['concierge', 'recommendations', 'ratings', 'onboarding'])

function readRoute() {
  const raw = window.location.hash.slice(1) || 'home'
  const [page, query = ''] = raw.split('?')
  return { page, params: new URLSearchParams(query) }
}

function routeUrl(page, params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  })
  return `#${page}${query.size ? `?${query}` : ''}`
}

function isModifiedClick(event) {
  return event && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
}

function AppPage({ route, user, detailSeed, navigate, changeRoute, replaceParams, openDetails, openRate, showError, authenticate }) {
  const common = { user, onRate: openRate, onDetails: openDetails }
  if (route.page === 'detail' && route.params.get('id')) {
    const from = route.params.get('from') || 'home'
    return <MovieDetails {...common} id={route.params.get('id')} seed={detailSeed} goBack={() => navigate(from)} />
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
  if (route.page === 'discover') return <Discover {...common} params={route.params} replaceParams={replaceParams} />
  if (route.page === 'recommendations') return <Recommendations {...common} />
  if (route.page === 'ratings') return <Ratings navigate={navigate} onDetails={openDetails} />
  return <Home {...common} navigate={navigate} showError={showError} />
}

export default function App() {
  const [session, setSession] = useState({ user: null, onboarding_required: false })
  const [sessionLoading, setSessionLoading] = useState(true)
  const [route, setRoute] = useState(readRoute)
  const [detailSeed, setDetailSeed] = useState(null)
  const [toast, setToast] = useState(null)
  const [ratingMovie, setRatingMovie] = useState(null)
  const [rating, setRating] = useState(4)
  const [ratingBusy, setRatingBusy] = useState(false)
  const user = session.user

  useEffect(() => {
    localStorage.removeItem('cinematch-session-v1')
    document.title = COPY.app.documentTitle
    api.me()
      .then(setSession)
      .catch((error) => {
        if (error.status && error.status !== 401) setToast({ message: error.message, type: 'error' })
      })
      .finally(() => setSessionLoading(false))
    const syncRoute = () => setRoute(readRoute())
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
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
  useEffect(() => { window.scrollTo({ top: 0 }) }, [route.page, route.params])
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

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
  const showError = useCallback((error) => {
    setToast({ message: error?.message || COPY.app.unknownError, type: 'error' })
  }, [])

  const authenticate = (result) => {
    setSession(result)
    const destination = route.params.get('next') || 'recommendations'
    changeRoute(result.onboarding_required ? 'onboarding' : destination, result.onboarding_required ? { next: destination } : {})
    setToast({ message: COPY.app.welcome, type: 'success' })
  }
  const logout = async () => {
    try {
      await api.logout()
    } finally {
      setSession({ user: null, onboarding_required: false })
      changeRoute('home')
      setToast({ message: COPY.app.loggedOut, type: 'success' })
    }
  }
  const openDetails = useCallback((movie) => {
    setDetailSeed(movie)
    const from = route.page === 'detail' ? route.params.get('from') || 'home' : route.page
    changeRoute('detail', { id: movieId(movie), from })
  }, [changeRoute, route])
  const openRate = (movie) => {
    if (!user) {
      changeRoute('auth', { next: route.page || 'discover' })
      return
    }
    setRatingMovie(movie)
    setRating(4)
  }
  const saveRating = async () => {
    setRatingBusy(true)
    try {
      await api.rate(movieId(ratingMovie), rating)
      setRatingMovie(null)
      setToast({ message: COPY.app.ratingSaved, type: 'success' })
    } catch (error) {
      showError(error)
    } finally {
      setRatingBusy(false)
    }
  }

  if (sessionLoading) return <PageLoading />
  const activePage = route.page === 'detail' ? route.params.get('from') || 'home' : route.page
  return (
    <Layout page={activePage} navigate={navigate} user={user} logout={logout}>
      <PwaStatus />
      <Suspense fallback={<PageLoading />}>
        <PageTransition key={`${route.page}-${route.params.get('id') || ''}`}>
          <AppPage route={route} user={user} detailSeed={detailSeed} navigate={navigate} changeRoute={changeRoute} replaceParams={replaceParams} openDetails={openDetails} openRate={openRate} showError={showError} authenticate={authenticate} />
          <SiteFooter navigate={navigate} />
        </PageTransition>
      </Suspense>
      {ratingMovie ? (
        <Dialog title={COPY.ratingDialog.title} onClose={() => setRatingMovie(null)}>
          <div className="rating-dialog">
            <p>{COPY.ratingDialog.prompt(ratingMovie.display_title || ratingMovie.title)}</p>
            <div className="rating-picker">
              {[1, 2, 3, 4, 5].map((value) => (
                <button type="button" key={value} aria-pressed={rating === value} className={rating === value ? 'selected' : ''} onClick={() => setRating(value)} aria-label={COPY.ratingDialog.aria(value)}>
                  <Star weight={value <= rating ? 'fill' : 'duotone'} aria-hidden="true" /><span>{faNumber(value)}</span>
                </button>
              ))}
            </div>
            <button type="button" className="button primary large" disabled={ratingBusy} onClick={saveRating}>
              {ratingBusy ? <SpinnerLabel>{COPY.ratingDialog.saving}</SpinnerLabel> : COPY.ratingDialog.save}
            </button>
          </div>
        </Dialog>
      ) : null}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toast ? <div className={`toast ${toast.type}`}>{toast.type === 'error' ? <AlertCircle size={19} aria-hidden="true" /> : <CheckCircle2 size={19} aria-hidden="true" />}{toast.message}</div> : null}
      </div>
    </Layout>
  )
}
