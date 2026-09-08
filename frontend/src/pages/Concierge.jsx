import { useState } from 'react'
import { ArrowCounterClockwise as RotateCcw, Brain as BrainCircuit, CaretLeft as ChevronLeft, CheckCircle, Coffee, Lightning, Planet, Shuffle, Sparkle as Sparkles, Sun } from '@phosphor-icons/react'
import { api } from '../api'
import MovieGrid from '../components/MovieGrid'
import { ErrorMessage, Hero, SectionTitle, SpinnerLabel } from '../components/UI'
import { COPY, ERA_OPTIONS, GENRE_OPTIONS, MOOD_OPTIONS, ORIGIN_OPTIONS } from '../constants/copy'
import { faNumber } from '../utils'

const INITIAL_FORM = { mood: 'Feel-good', genres: [], era: 'Any era', origin: 'Any', discovery: 55 }
const MOOD_ICONS = {
  'Feel-good': Sun,
  Thrilled: Lightning,
  Thoughtful: BrainCircuit,
  Escape: Planet,
  Comfort: Coffee,
  'Surprise me': Shuffle,
}

function optionLabel(options, value) {
  return options.find(([optionValue]) => optionValue === value)?.[1] || value
}

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
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      window.setTimeout(() => document.getElementById('quiz-results')?.scrollIntoView({ behavior, block: 'start' }), 50)
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
      <div className="quiz-progress"><span><i /></span><b>{COPY.concierge.progress}</b></div>
      <form className="quiz-card" onSubmit={submit}>
        <div className="quiz-fields">
          <QuizSection number="01" title={COPY.concierge.moodTitle} hint={COPY.concierge.moodHint}>
            <div className="mood-grid">
              {MOOD_OPTIONS.map(([value, label]) => {
                const MoodIcon = MOOD_ICONS[value]
                const selected = form.mood === value
                return (
                  <button type="button" key={value} aria-pressed={selected} className={`choice-card ${selected ? 'selected' : ''}`} onClick={() => setForm({ ...form, mood: value })}>
                    <MoodIcon size={27} weight={selected ? 'fill' : 'duotone'} aria-hidden="true" />
                    <b>{label}</b>
                    <CheckCircle className="choice-check" weight="fill" aria-hidden="true" />
                  </button>
                )
              })}
            </div>
          </QuizSection>
          <QuizSection number="02" title={COPY.concierge.genresTitle} hint={COPY.concierge.genresHint}>
            <div className="chip-grid">
              {GENRE_OPTIONS.map(([value, label]) => {
                const selected = selectedGenres.has(value)
                return <button type="button" key={value} aria-pressed={selected} className={`filter-chip ${selected ? 'selected' : ''}`} onClick={() => toggleGenre(value)}>{selected ? <CheckCircle weight="fill" aria-hidden="true" /> : null}{label}</button>
              })}
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
            <div className="range-value">{COPY.concierge.discoveryValue(faNumber(form.discovery))}</div>
            <div className="range-wrap">
              <span>{COPY.concierge.popular}</span>
              <input aria-label={COPY.concierge.discoveryTitle} name="discovery" type="range" min="0" max="100" value={form.discovery} onChange={(event) => setForm({ ...form, discovery: Number(event.target.value) })} />
              <span>{COPY.concierge.discovery}</span>
            </div>
          </QuizSection>
        </div>
        <aside className="quiz-summary" aria-label={COPY.concierge.summaryTitle}>
          <div className="summary-heading"><span><Sparkles size={22} weight="fill" aria-hidden="true" /></span><div><h2>{COPY.concierge.summaryTitle}</h2><p>{COPY.concierge.summaryHint}</p></div></div>
          <dl>
            <SummaryRow label={COPY.concierge.summaryMood} value={optionLabel(MOOD_OPTIONS, form.mood)} />
            <SummaryRow label={COPY.concierge.summaryGenres} value={form.genres.length ? form.genres.map((genre) => optionLabel(GENRE_OPTIONS, genre)).join('، ') : COPY.concierge.noGenres} />
            <SummaryRow label={COPY.concierge.summaryOrigin} value={optionLabel(ORIGIN_OPTIONS, form.origin)} />
            <SummaryRow label={COPY.concierge.summaryEra} value={optionLabel(ERA_OPTIONS, form.era)} />
            <SummaryRow label={COPY.concierge.summaryDiscovery} value={COPY.concierge.discoveryValue(faNumber(form.discovery))} />
          </dl>
          {error ? <ErrorMessage>{error}</ErrorMessage> : null}
          <div className="quiz-submit">
            <button type="submit" className="button primary large" disabled={loading}>
              {loading ? <SpinnerLabel>{COPY.concierge.submitting}</SpinnerLabel> : <><Sparkles size={20} weight="fill" aria-hidden="true" />{COPY.concierge.submit}<ChevronLeft size={19} aria-hidden="true" /></>}
            </button>
            <button type="button" className="reset-button" onClick={() => { setForm(INITIAL_FORM); setMovies([]) }}><RotateCcw size={18} aria-hidden="true" />{COPY.concierge.reset}</button>
          </div>
          <p className="model-note"><BrainCircuit size={19} aria-hidden="true" />{COPY.concierge.modelNote}</p>
        </aside>
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

function SummaryRow({ label, value }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>
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
  return <div className={className}>{options.map(([optionValue, label]) => <button type="button" key={optionValue} aria-pressed={value === optionValue} className={value === optionValue ? 'selected' : ''} onClick={() => onChange(optionValue)}>{label}</button>)}</div>
}
