import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { api } from '../api'
import MovieGrid from '../components/MovieGrid'
import { ErrorMessage, Hero, SectionTitle } from '../components/UI'

const METHODS = [['hybrid','ترکیبی'],['collaborative','هم‌سلیقه‌ها'],['content','شباهت محتوایی'],['popular','محبوبیت']]

export default function Recommendations({ user, token, onRate, onSimilar }) {
  const [method, setMethod] = useState('hybrid')
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  useEffect(() => {
    let active = true
    api.recommendations(token, method).then((items) => active && setMovies(items)).catch((err) => active && setError(err.message)).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [method, token, reloadKey])
  const changeMethod = (value) => { setLoading(true); setError(''); setMethod(value) }
  const reload = () => { setLoading(true); setError(''); setReloadKey((value) => value + 1) }
  return <>
    <Hero variant="compact-hero personal" eyebrow={`برای ${user.username}`} title={<>انتخاب‌هایی که با<br/><em>سلیقهٔ تو رشد می‌کنند.</em></>} description="هر امتیاز جدید، تصویر دقیق‌تری از فیلم‌های مورد علاقهٔ تو می‌سازد." />
    <div className="method-bar"><div className="segmented">{METHODS.map(([value,label]) => <button key={value} className={method === value ? 'selected' : ''} onClick={() => changeMethod(value)}>{label}</button>)}</div><button className="refresh" onClick={reload}><RefreshCw size={17}/> به‌روزرسانی</button></div>
    <p className="context-note">مدل ترکیبی، رفتار کاربران هم‌سلیقه را با ژانرهای محبوب شما ادغام می‌کند. اگر کمتر از سه فیلم امتیاز داده باشید، مدل مطمئن محبوبیت نمایش داده می‌شود.</p>
    {error && <ErrorMessage>{error}</ErrorMessage>}
    <SectionTitle eyebrow="مدل پیشنهادی" title="ویژهٔ شما"/>
    <MovieGrid movies={movies} loading={loading} user={user} onRate={onRate} onSimilar={onSimilar} emptyTitle="برای ساخت پیشنهاد، چند فیلم را امتیاز بده"/>
  </>
}
