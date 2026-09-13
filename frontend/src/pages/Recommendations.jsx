import { useEffect, useState } from 'react'
import { ArrowClockwise as RefreshCw } from '@phosphor-icons/react'
import { api } from '../api'
import MovieGrid from '../components/MovieGrid'
import { ErrorMessage, Hero, SectionTitle } from '../components/UI'
import { COPY, MODE_OPTIONS } from '../constants/copy'

export default function Recommendations({ user, onRate, onDetails, onTrack }) {
  const [mode, setMode] = useState('balanced')
  const [mediaType, setMediaType] = useState('movie')
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    api.recommendations(mode, mediaType)
      .then((items) => active && setMovies(items))
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [mediaType, mode, reloadKey])

  const changeMethod = (value) => {
    if (value === mode) return
    setLoading(true)
    setError('')
    setMovies([])
    setMode(value)
  }
  const changeMediaType = (value) => {
    if (value === mediaType) return
    setLoading(true)
    setError('')
    setMovies([])
    setMediaType(value)
  }
  const reload = () => {
    setLoading(true)
    setError('')
    setMovies([])
    setReloadKey((value) => value + 1)
  }

  return (
    <>
      <Hero
        className="compact-hero personal-hero"
        eyebrow={COPY.recommendations.eyebrow(user.username)}
        title={<>{COPY.recommendations.titleStart}<br /><em>{COPY.recommendations.titleAccent}</em></>}
        description={COPY.recommendations.description}
      />
      <div className="media-switch segmented" aria-label="نوع پیشنهاد">
        <button type="button" aria-pressed={mediaType === 'movie'} className={mediaType === 'movie' ? 'selected' : ''} onClick={() => changeMediaType('movie')}>{COPY.recommendations.moviesTab}</button>
        <button type="button" aria-pressed={mediaType === 'serial'} className={mediaType === 'serial' ? 'selected' : ''} onClick={() => changeMediaType('serial')}>{COPY.recommendations.serialsTab}</button>
      </div>
      <div className="method-bar">
        <div className="segmented" aria-label={COPY.recommendations.listEyebrow}>
          {MODE_OPTIONS.map(([value, label]) => (
            <button type="button" key={value} aria-pressed={mode === value} className={mode === value ? 'selected' : ''} onClick={() => changeMethod(value)}>{label}</button>
          ))}
        </div>
        <button type="button" className="refresh" onClick={reload}>
          <RefreshCw size={17} aria-hidden="true" />{COPY.recommendations.refresh}
        </button>
      </div>
      <p className="context-note">{COPY.recommendations.note}</p>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      <SectionTitle eyebrow={COPY.recommendations.listEyebrow} title={COPY.recommendations.listTitle} />
      <MovieGrid movies={movies} loading={loading} user={user} onRate={onRate} onDetails={onDetails} onTrack={onTrack} emptyTitle={COPY.recommendations.empty} />
    </>
  )
}
