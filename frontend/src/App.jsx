import { addTransitionType, startTransition, useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Star } from 'lucide-react'
import { api } from './api'
import Layout from './components/Layout'
import PageTransition from './components/PageTransition'
import { Dialog, SpinnerLabel } from './components/UI'
import { COPY } from './constants/copy'
import { faNumber, movieId } from './utils'
import Auth from './pages/Auth'
import Concierge from './pages/Concierge'
import Discover from './pages/Discover'
import Home from './pages/Home'
import MovieDetails from './pages/MovieDetails'
import Ratings from './pages/Ratings'
import Recommendations from './pages/Recommendations'
const SESSION_KEY = 'cinematch-session-v1'

function storedSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || {} } catch { return {} }
}

function readRoute() {
  const raw = window.location.hash.slice(1) || 'home'
  const [page, query = ''] = raw.split('?')
  return { page, params: new URLSearchParams(query) }
}

function routeUrl(page, params) {
  const query = new URLSearchParams(params)
  return `#${page}${query.size ? `?${query}` : ''}`
}

function isModifiedClick(event) {
  return event && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
}

function AppPage({ route, user, token, detailSeed, navigate, replaceParams, openDetails, openRate, showError, authenticate }) {
  const common = { user, onRate: openRate, onDetails: openDetails }
  if (route.page === 'detail' && route.params.get('id')) {
    const from = route.params.get('from') || 'home'
    return <MovieDetails {...common} id={route.params.get('id')} seed={detailSeed} goBack={() => navigate(from, null, {}, 'nav-back')} />
  }
  if (route.page === 'concierge') return <Concierge {...common} />
  if (route.page === 'discover') return <Discover {...common} params={route.params} replaceParams={replaceParams} />
  if (route.page === 'recommendations' && user) return <Recommendations {...common} token={token} />
  if (route.page === 'ratings' && user) return <Ratings token={token} navigate={navigate} onDetails={openDetails} />
  if (route.page === 'auth' || ((route.page === 'recommendations' || route.page === 'ratings') && !user)) return <Auth onAuthenticated={authenticate} />
  return <Home {...common} navigate={navigate} showError={showError} />
}

export default function App() {
  const [session, setSession] = useState(storedSession)
  const [route, setRoute] = useState(readRoute)
  const [detailSeed, setDetailSeed] = useState(null)
  const [toast, setToast] = useState(null)
  const [ratingMovie, setRatingMovie] = useState(null)
  const [rating, setRating] = useState(4)
  const [ratingBusy, setRatingBusy] = useState(false)
  const user = session.user
  const token = session.access_token

  useEffect(() => {
    document.title = COPY.app.documentTitle
    const syncRoute = () => startTransition(() => {
      addTransitionType('nav-back')
      setRoute(readRoute())
    })
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  useEffect(() => { window.scrollTo({ top: 0 }) }, [route.page, route.params])
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

  const navigate = useCallback((page, event, params = {}, transitionType = 'nav-lateral') => {
    if (isModifiedClick(event)) return
    event?.preventDefault()
    window.history.pushState(null, '', routeUrl(page, params))
    startTransition(() => {
      addTransitionType(transitionType)
      setRoute(readRoute())
    })
  }, [])

  const replaceParams = useCallback((params) => {
    window.history.replaceState(null, '', routeUrl('discover', params))
    setRoute(readRoute())
  }, [])
  const showError = useCallback((error) => setToast({ message: error?.message || COPY.app.unknownError, type: 'error' }), [])

  const authenticate = (result) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(result))
    setSession(result)
    navigate('recommendations')
    setToast({ message: COPY.app.welcome, type: 'success' })
  }
  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setSession({})
    navigate('home')
    setToast({ message: COPY.app.loggedOut, type: 'success' })
  }
  const openDetails = useCallback((movie) => {
    setDetailSeed(movie)
    const from = route.page === 'detail' ? route.params.get('from') || 'home' : route.page
    navigate('detail', null, { id: movieId(movie), from }, 'nav-forward')
  }, [navigate, route])
  const openRate = (movie) => {
    if (!user) { navigate('auth'); return }
    setRatingMovie(movie)
    setRating(4)
  }
  const saveRating = async () => {
    setRatingBusy(true)
    try {
      await api.rate(token, movieId(ratingMovie), rating)
      setRatingMovie(null)
      setToast({ message: COPY.app.ratingSaved, type: 'success' })
    } catch (error) {
      showError(error)
    } finally {
      setRatingBusy(false)
    }
  }

  const activePage = route.page === 'detail' ? route.params.get('from') || 'home' : route.page
  return (
    <Layout page={activePage} navigate={navigate} user={user} logout={logout}>
      <PageTransition key={`${route.page}-${route.params.get('id') || ''}`}>
        <AppPage route={route} user={user} token={token} detailSeed={detailSeed} navigate={navigate} replaceParams={replaceParams} openDetails={openDetails} openRate={openRate} showError={showError} authenticate={authenticate} />
      </PageTransition>
      {ratingMovie ? (
        <Dialog title={COPY.ratingDialog.title} onClose={() => setRatingMovie(null)}>
          <div className="rating-dialog">
            <p>{COPY.ratingDialog.prompt(ratingMovie.title)}</p>
            <div className="rating-picker">
              {[1, 2, 3, 4, 5].map((value) => (
                <button type="button" key={value} className={rating === value ? 'selected' : ''} onClick={() => setRating(value)} aria-label={COPY.ratingDialog.aria(value)}>
                  <Star fill={value <= rating ? 'currentColor' : 'none'} aria-hidden="true" /><span>{faNumber(value)}</span>
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
