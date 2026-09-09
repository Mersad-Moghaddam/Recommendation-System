import { useEffect, useState } from 'react'
import { ArrowClockwise as RefreshCw } from '@phosphor-icons/react'
import { api } from '../api'
import MovieGrid from '../components/MovieGrid'
import { ErrorMessage, Hero, SectionTitle } from '../components/UI'
import { COPY, MODE_OPTIONS } from '../constants/copy'

export default function Recommendations({ user, onRate, onDetails }) {
  const [mode, setMode] = useState('balanced')
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    api.recommendations(mode)
      .then((items) => active && setMovies(items))
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [mode, reloadKey])

  const changeMethod = (value) => {
    setLoading(true)
    setError('')
    setMode(value)
  }
  const reload = () => {
    setLoading(true)
    setError('')
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
      <MovieGrid movies={movies} loading={loading} user={user} onRate={onRate} onDetails={onDetails} emptyTitle={COPY.recommendations.empty} />
    </>
  )
}
