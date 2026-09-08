import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Star } from 'lucide-react'
import { api } from './api'
import Layout from './components/Layout'
import MovieGrid from './components/MovieGrid'
import { ErrorMessage, Loading, Modal } from './components/UI'
import Auth from './pages/Auth'
import Concierge from './pages/Concierge'
import Discover from './pages/Discover'
import Home from './pages/Home'
import Ratings from './pages/Ratings'
import Recommendations from './pages/Recommendations'
import { faNumber, movieId } from './utils'

function storedSession() {
  try { return JSON.parse(localStorage.getItem('cinematch-session')) || {} } catch { return {} }
}

export default function App() {
  const initial = storedSession()
  const [session, setSession] = useState(initial)
  const [page, setPage] = useState(() => window.location.hash.slice(1) || 'home')
  const [toast, setToast] = useState(null)
  const [ratingMovie, setRatingMovie] = useState(null)
  const [rating, setRating] = useState(4)
  const [ratingBusy, setRatingBusy] = useState(false)
  const [similar, setSimilar] = useState({ movie: null, items: [], loading: false, error: '' })
  const user = session.user
  const token = session.access_token

  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(null), 3500); return () => clearTimeout(timer) } }, [toast])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [page])
  useEffect(() => {
    const syncHash = () => setPage(window.location.hash.slice(1) || 'home')
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  const navigate = (nextPage) => { window.location.hash = nextPage; setPage(nextPage) }
  const showError = useCallback((error) => setToast({ message:error?.message || String(error), type:'error' }), [])
  const authenticate = (result) => { localStorage.setItem('cinematch-session', JSON.stringify(result)); setSession(result); navigate('recommendations'); setToast({ message:'خوش آمدی؛ حساب شما آماده است.', type:'success' }) }
  const logout = () => { localStorage.removeItem('cinematch-session'); setSession({}); navigate('home'); setToast({ message:'از حساب خارج شدید.', type:'success' }) }
  const openRate = (movie) => { if (!user) return navigate('auth'); setRatingMovie(movie); setRating(4) }
  const saveRating = async () => { setRatingBusy(true); try { await api.rate(token, movieId(ratingMovie), rating); setRatingMovie(null); setToast({ message:'امتیاز ثبت شد و پیشنهادهای شما به‌روز شدند.', type:'success' }) } catch (error) { showError(error) } finally { setRatingBusy(false) } }
  const openSimilar = async (movie) => { setSimilar({ movie, items: [], loading: true, error: '' }); try { const items = await api.similar(movieId(movie)); setSimilar({ movie, items, loading:false, error:'' }) } catch (error) { setSimilar({ movie, items:[], loading:false, error:error.message }) } }

  const common = { user, onRate: openRate, onSimilar: openSimilar }
  let content
  if (page === 'concierge') content = <Concierge {...common}/>
  else if (page === 'discover') content = <Discover {...common}/>
  else if (page === 'recommendations' && user) content = <Recommendations {...common} token={token}/>
  else if (page === 'ratings' && user) content = <Ratings token={token} setPage={navigate}/>
  else if (page === 'auth' || ((page === 'recommendations' || page === 'ratings') && !user)) content = <Auth onAuthenticated={authenticate}/>
  else content = <Home {...common} setPage={navigate} showError={showError}/>

  return <Layout page={page} setPage={navigate} user={user} logout={logout}>
    {content}
    {ratingMovie && <Modal title="ثبت امتیاز" onClose={() => setRatingMovie(null)}><div className="rating-modal"><p>امتیاز شما به <strong>{ratingMovie.title}</strong></p><div className="rating-picker">{[1,2,3,4,5].map((value) => <button key={value} className={rating === value ? 'selected' : ''} onClick={() => setRating(value)}><Star fill={value <= rating ? 'currentColor' : 'none'}/><span>{faNumber(value)}</span></button>)}</div><button className="button primary large" disabled={ratingBusy} onClick={saveRating}>{ratingBusy ? 'در حال ثبت…' : 'ثبت امتیاز'}</button></div></Modal>}
    {similar.movie && <Modal title={`مشابه «${similar.movie.title}»`} wide onClose={() => setSimilar({ movie:null, items:[], loading:false, error:'' })}>{similar.error && <ErrorMessage>{similar.error}</ErrorMessage>}{similar.loading ? <Loading count={3}/> : <MovieGrid movies={similar.items} user={user} onRate={openRate} onSimilar={openSimilar} compact/>}</Modal>}
    {toast && <div className={`toast ${toast.type}`} role="status">{toast.type === 'error' ? <AlertCircle size={19}/> : <CheckCircle2 size={19}/>} {toast.message}</div>}
  </Layout>
}
