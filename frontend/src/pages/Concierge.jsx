import { useState } from 'react'
import { BrainCircuit, ChevronLeft, RotateCcw, Sparkles } from 'lucide-react'
import { api } from '../api'
import MovieGrid from '../components/MovieGrid'
import { ErrorMessage, Hero, SectionTitle, SpinnerLabel } from '../components/UI'
import { COPY, ERA_OPTIONS, GENRE_OPTIONS, MOOD_OPTIONS, ORIGIN_OPTIONS } from '../constants/copy'

const INITIAL_FORM = { mood: 'Feel-good', genres: [], era: 'Any era', origin: 'Any', discovery: 55 }

export default function Concierge({ user, onRate, onDetails }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const selectedGenres = new Set(form.genres)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMovies([])
    try {
      setMovies(await api.quiz(form))
      window.setTimeout(() => document.getElementById('quiz-results')?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleGenre = (genre) => {
    setForm((current) => ({
      ...current,
      genres: current.genres.includes(genre)
        ? current.genres.filter((item) => item !== genre)
        : current.genres.length < 5 ? [...current.genres, genre] : current.genres,
    }))
  }

  return (
    <>
      <Hero
        className="compact-hero concierge-hero"
        eyebrow={COPY.concierge.eyebrow}
        title={<>{COPY.concierge.titleStart}<br /><em>{COPY.concierge.titleAccent}</em></>}
        description={COPY.concierge.description}
      />
      <div className="quiz-progress"><span /><b>{COPY.concierge.progress}</b></div>
      <form className="quiz-card" onSubmit={submit}>
        <QuizSection number="01" title={COPY.concierge.moodTitle} hint={COPY.concierge.moodHint}>
          <div className="mood-grid">
            {MOOD_OPTIONS.map(([value, label, symbol]) => (
              <button type="button" key={value} className={`choice-card ${form.mood === value ? 'selected' : ''}`} onClick={() => setForm({ ...form, mood: value })}>
                <span>{symbol}</span><b>{label}</b>
              </button>
            ))}
          </div>
        </QuizSection>
        <QuizSection number="02" title={COPY.concierge.genresTitle} hint={COPY.concierge.genresHint}>
          <div className="chip-grid">
            {GENRE_OPTIONS.map(([value, label]) => (
              <button type="button" key={value} className={`filter-chip ${selectedGenres.has(value) ? 'selected' : ''}`} onClick={() => toggleGenre(value)}>{label}</button>
            ))}
          </div>
        </QuizSection>
        <div className="quiz-columns">
          <QuizSection number="03" title={COPY.concierge.originTitle}>
            <ChoiceSegments options={ORIGIN_OPTIONS} value={form.origin} onChange={(origin) => setForm({ ...form, origin })} />
          </QuizSection>
          <QuizSection number="04" title={COPY.concierge.eraTitle}>
            <WrappedChoiceSegments options={ERA_OPTIONS} value={form.era} onChange={(era) => setForm({ ...form, era })} />
          </QuizSection>
        </div>
        <QuizSection number="05" title={COPY.concierge.discoveryTitle} hint={COPY.concierge.discoveryHint}>
          <div className="range-wrap">
            <span>{COPY.concierge.popular}</span>
            <input aria-label={COPY.concierge.discoveryTitle} type="range" min="0" max="100" value={form.discovery} onChange={(event) => setForm({ ...form, discovery: Number(event.target.value) })} />
            <span>{COPY.concierge.discovery}</span>
          </div>
        </QuizSection>
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}
        <div className="quiz-submit">
          <button type="submit" className="button primary large" disabled={loading}>
            {loading ? <SpinnerLabel>{COPY.concierge.submitting}</SpinnerLabel> : <><Sparkles size={20} aria-hidden="true" />{COPY.concierge.submit}<ChevronLeft size={19} aria-hidden="true" /></>}
          </button>
          <button type="button" className="reset-button" onClick={() => { setForm(INITIAL_FORM); setMovies([]) }}><RotateCcw size={16} aria-hidden="true" />{COPY.concierge.reset}</button>
        </div>
        <p className="model-note"><BrainCircuit size={18} aria-hidden="true" />{COPY.concierge.modelNote}</p>
      </form>
      {loading || movies.length > 0 ? (
        <section id="quiz-results" className="results-section">
          <SectionTitle eyebrow={COPY.concierge.resultEyebrow} title={COPY.concierge.resultTitle} />
          <MovieGrid movies={movies} loading={loading} user={user} onRate={onRate} onDetails={onDetails} />
        </section>
      ) : null}
    </>
  )
}

function QuizSection({ number, title, hint, children }) {
  return <fieldset className="quiz-section"><legend><span>{number}</span><div><b>{title}</b>{hint ? <small>{hint}</small> : null}</div></legend>{children}</fieldset>
}

function ChoiceSegments({ options, value, onChange }) {
  return <Segments className="segmented" options={options} value={value} onChange={onChange} />
}

function WrappedChoiceSegments({ options, value, onChange }) {
  return <Segments className="segmented segmented-wrap" options={options} value={value} onChange={onChange} />
}

function Segments({ className, options, value, onChange }) {
  return <div className={className}>{options.map(([optionValue, label]) => <button type="button" key={optionValue} className={value === optionValue ? 'selected' : ''} onClick={() => onChange(optionValue)}>{label}</button>)}</div>
}
