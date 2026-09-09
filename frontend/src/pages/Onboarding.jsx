import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle, Star } from '@phosphor-icons/react'
import { api } from '../api'
import { CardArtwork } from '../components/MovieArtwork'
import { ErrorMessage, Hero, Loading, SpinnerLabel } from '../components/UI'
import { COPY } from '../constants/copy'
import { faNumber, movieId } from '../utils'

export default function Onboarding({ navigate, next }) {
  const [movies, setMovies] = useState([])
  const [ratings, setRatings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const selectedCount = Object.keys(ratings).length

  useEffect(() => {
    api.onboarding()
      .then(setMovies)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [])

  const choose = (id, value) => {
    if (ratings[id] == null && selectedCount >= 3) return
    setRatings((current) => ({ ...current, [id]: value }))
  }
  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await api.rateBulk(
        Object.entries(ratings).map(([id, rating]) => ({ movie_id: Number(id), rating })),
      )
      navigate(next)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }
  const skip = async () => {
    setSaving(true)
    try {
      await api.skipOnboarding()
      navigate(next)
    } catch (requestError) {
      setError(requestError.message)
      setSaving(false)
    }
  }

  return (
    <>
      <Hero
        className="compact-hero onboarding-hero"
        eyebrow={COPY.onboarding.eyebrow}
        title={<>{COPY.onboarding.titleStart}<br /><em>{COPY.onboarding.titleAccent}</em></>}
        description={COPY.onboarding.description}
      />
      <div className="onboarding-progress" aria-live="polite">
        <span><i style={{ width: `${selectedCount / 3 * 100}%` }} /></span>
        <b>{COPY.onboarding.progress(faNumber(selectedCount))}</b>
      </div>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {loading ? <Loading count={6} /> : (
        <div className="onboarding-grid">
          {movies.map((movie, index) => {
            const id = movieId(movie)
            const current = ratings[id]
            return (
              <article className={`onboarding-movie ${current ? 'selected' : ''}`} key={id}>
                <CardArtwork movie={movie} index={index} />
                <div>
                  <h2>{movie.display_title}</h2>
                  <p lang={movie.overview_locale || undefined} dir={movie.overview_locale === 'en' ? 'ltr' : 'rtl'}>
                    {movie.overview_short || COPY.card.noOverview}
                  </p>
                  <div className="onboarding-stars" aria-label={COPY.onboarding.rateAria(movie.display_title)}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button type="button" key={value} onClick={() => choose(id, value)} aria-label={COPY.ratingDialog.aria(value)} aria-pressed={current === value}>
                        <Star weight={value <= current ? 'fill' : 'regular'} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                  {current ? <span className="onboarding-picked"><CheckCircle weight="fill" aria-hidden="true" />{COPY.onboarding.picked(faNumber(current))}</span> : null}
                </div>
              </article>
            )
          })}
        </div>
      )}
      <div className="onboarding-actions">
        <button type="button" className="button primary" disabled={selectedCount !== 3 || saving} onClick={save}>
          {saving ? <SpinnerLabel>{COPY.onboarding.saving}</SpinnerLabel> : <>{COPY.onboarding.continue}<ArrowLeft aria-hidden="true" /></>}
        </button>
        <button type="button" className="text-button" disabled={saving} onClick={skip}>{COPY.onboarding.skip}</button>
      </div>
    </>
  )
}
