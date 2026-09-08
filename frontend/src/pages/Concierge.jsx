import { useState } from 'react'
import { BrainCircuit, ChevronLeft, RotateCcw, Sparkles } from 'lucide-react'
import { api } from '../api'
import MovieGrid from '../components/MovieGrid'
import { ErrorMessage, Hero, SectionTitle, SpinnerLabel } from '../components/UI'
import { GENRES } from '../utils'

const MOODS = [
  ['Feel-good','حال‌خوب‌کن','☀️'], ['Thrilled','پرهیجان','⚡'], ['Thoughtful','فکری و عمیق','🪞'],
  ['Escape','فرار از روزمرگی','🚀'], ['Comfort','آرام و صمیمی','☕'], ['Surprise me','غافلگیرم کن','🎲'],
]
const ERAS = [['Any era','همه دوره‌ها'],['Classics','کلاسیک'],['80s & 90s','دهه ۸۰ و ۹۰'],['2000s','۲۰۰۰ تا ۲۰۱۴'],['Modern','مدرن']]
const ORIGINS = [['Any','ایران و جهان'],['Iranian','فقط ایران'],['International','فقط جهان']]

export default function Concierge({ user, onRate, onSimilar }) {
  const [form, setForm] = useState({ mood: 'Feel-good', genres: [], era: 'Any era', origin: 'Any', discovery: 55 })
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError(''); setMovies([])
    try { setMovies(await api.quiz(form)); setTimeout(() => document.getElementById('quiz-results')?.scrollIntoView({ behavior: 'smooth' }), 50) }
    catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  const toggleGenre = (genre) => setForm((current) => ({ ...current, genres: current.genres.includes(genre) ? current.genres.filter((item) => item !== genre) : current.genres.length < 5 ? [...current.genres, genre] : current.genres }))
  return <>
    <Hero variant="compact-hero" eyebrow="دستیار انتخاب فیلم" title={<>چه فیلمی برای<br/><em>امشب تو ساخته شده؟</em></>} description="چهار انتخاب کوتاه؛ یک پیشنهاد شخصی و قابل توضیح." />
    <form className="quiz-card" onSubmit={submit}>
      <QuizSection number="۱" title="دوست داری چه حسی بگیری؟" hint="یک گزینه را انتخاب کن">
        <div className="mood-grid">{MOODS.map(([value,label,emoji]) => <button type="button" key={value} className={`choice-card ${form.mood === value ? 'selected' : ''}`} onClick={() => setForm({ ...form, mood: value })}><span>{emoji}</span><b>{label}</b></button>)}</div>
      </QuizSection>
      <QuizSection number="۲" title="چه ژانرهایی دوست داری؟" hint="حداکثر پنج ژانر">
        <div className="chip-grid">{Object.entries(GENRES).filter(([key]) => key !== '(no genres listed)').map(([value,label]) => <button type="button" key={value} className={`filter-chip ${form.genres.includes(value) ? 'selected' : ''}`} onClick={() => toggleGenre(value)}>{label}</button>)}</div>
      </QuizSection>
      <div className="quiz-columns">
        <QuizSection number="۳" title="از کدام سینما؟"><div className="segmented">{ORIGINS.map(([value,label]) => <button type="button" key={value} className={form.origin === value ? 'selected' : ''} onClick={() => setForm({ ...form, origin: value })}>{label}</button>)}</div></QuizSection>
        <QuizSection number="۴" title="کدام دوره؟"><div className="segmented wrap">{ERAS.map(([value,label]) => <button type="button" key={value} className={form.era === value ? 'selected' : ''} onClick={() => setForm({ ...form, era: value })}>{label}</button>)}</div></QuizSection>
      </div>
      <QuizSection number="۵" title="چقدر اهل کشف هستی؟" hint="سمت چپ: محبوب و مطمئن؛ سمت راست: کمتر دیده‌شده">
        <div className="range-wrap"><span>محبوب</span><input aria-label="میزان علاقه به کشف فیلم‌های کمتر دیده‌شده" type="range" min="0" max="100" value={form.discovery} onChange={(e) => setForm({ ...form, discovery: Number(e.target.value) })}/><span>کشف تازه</span></div>
      </QuizSection>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <div className="quiz-submit"><button className="button primary large" disabled={loading}>{loading ? <SpinnerLabel>در حال تحلیل سلیقه…</SpinnerLabel> : <><Sparkles size={20}/> پیشنهاد فیلم‌های من <ChevronLeft size={19}/></>}</button><button type="button" className="reset-button" onClick={() => { setForm({ mood:'Feel-good', genres:[], era:'Any era', origin:'Any', discovery:55 }); setMovies([]) }}><RotateCcw size={16}/> پاک کردن انتخاب‌ها</button></div>
      <p className="model-note"><BrainCircuit size={18}/> پاسخ‌ها با TF–IDF، شباهت کسینوسی و امتیازهای واقعی MovieLens تحلیل می‌شوند؛ نتیجه از پیش نوشته نشده است.</p>
    </form>
    {(loading || movies.length > 0) && <section id="quiz-results" className="results-section"><SectionTitle eyebrow="نتیجه تحلیل" title="فیلم‌های مناسب حال تو"/><MovieGrid movies={movies} loading={loading} user={user} onRate={onRate} onSimilar={onSimilar}/></section>}
  </>
}

function QuizSection({ number, title, hint, children }) { return <fieldset className="quiz-section"><legend><span>{number}</span><div><b>{title}</b>{hint && <small>{hint}</small>}</div></legend>{children}</fieldset> }
