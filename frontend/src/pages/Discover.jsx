import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import { api } from '../api'
import MovieGrid from '../components/MovieGrid'
import { ErrorMessage, Hero, SectionTitle } from '../components/UI'
import { COPY, GENRE_OPTIONS } from '../constants/copy'
import { faNumber } from '../utils'

export default function Discover({ user, onRate, onDetails, params, replaceParams }) {
  const initialFilters = {
    query: params.get('q') || '',
    iranian: params.get('iranian') === '1',
    genre: params.get('genre') || '',
    page: Number(params.get('page') || 0),
  }
  const [draft, setDraft] = useState(initialFilters.query)
  const [filters, setFilters] = useState(initialFilters)
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.movies({ query: filters.query, iranian: filters.iranian, genre: filters.genre, skip: filters.page * 24 })
      .then((items) => active && setMovies(items))
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [filters.genre, filters.iranian, filters.page, filters.query])

  const updateFilters = (next) => {
    setLoading(true)
    setError('')
    const updated = { ...filters, ...next }
    setFilters(updated)
    replaceParams({
      q: updated.query || undefined,
      genre: updated.genre || undefined,
      iranian: updated.iranian ? '1' : undefined,
      page: updated.page ? String(updated.page) : undefined,
    })
  }
  const search = (event) => { event.preventDefault(); updateFilters({ query: draft.trim(), page: 0 }) }
  const clearFilters = () => { setDraft(''); updateFilters({ query: '', iranian: false, genre: '', page: 0 }) }

  return (
    <>
      <Hero className="compact-hero archive-hero" eyebrow={COPY.discover.eyebrow} title={<>{COPY.discover.titleStart}<br /><em>{COPY.discover.titleAccent}</em></>} description={COPY.discover.description} />
      <section className="search-panel">
        <form className="search-box" onSubmit={search}>
          <Search size={20} aria-hidden="true" />
          <input name="movie-search" autoComplete="off" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={COPY.discover.searchPlaceholder} aria-label={COPY.discover.searchLabel} />
          <button type="submit">{COPY.discover.searchAction}</button>
        </form>
        <div className="filter-bar">
          <span><SlidersHorizontal size={17} aria-hidden="true" />{COPY.discover.filters}</span>
          <select name="genre" autoComplete="off" value={filters.genre} onChange={(event) => updateFilters({ genre: event.target.value, page: 0 })} aria-label={COPY.discover.genreLabel}>
            <option value="">{COPY.discover.allGenres}</option>
            {GENRE_OPTIONS.map(([key, label]) => <option value={key} key={key}>{label}</option>)}
          </select>
          <label className="switch"><input type="checkbox" checked={filters.iranian} onChange={(event) => updateFilters({ iranian: event.target.checked, page: 0 })} /><span aria-hidden="true" />{COPY.discover.iranianOnly}</label>
          {filters.query || filters.genre || filters.iranian ? <button type="button" className="clear-filter" onClick={clearFilters}>{COPY.discover.clear}</button> : null}
        </div>
      </section>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      <SectionTitle
        eyebrow={filters.iranian ? COPY.discover.iranianCatalog : COPY.discover.fullCatalog}
        title={filters.query ? COPY.discover.result(filters.query) : COPY.discover.browse}
        action={<span className="page-label">{COPY.discover.page(faNumber(filters.page + 1))}</span>}
      />
      <MovieGrid movies={movies} loading={loading} user={user} onRate={onRate} onDetails={onDetails} />
      {!loading && movies.length > 0 ? (
        <div className="pagination">
          <button type="button" disabled={filters.page === 0} onClick={() => updateFilters({ page: filters.page - 1 })}><ChevronRight aria-hidden="true" />{COPY.discover.previous}</button>
          <span>{faNumber(filters.page + 1)}</span>
          <button type="button" disabled={movies.length < 24} onClick={() => updateFilters({ page: filters.page + 1 })}>{COPY.discover.next}<ChevronLeft aria-hidden="true" /></button>
        </div>
      ) : null}
    </>
  )
}
