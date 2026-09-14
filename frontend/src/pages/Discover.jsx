import { useEffect, useState } from 'react'
import { CaretLeft as ChevronLeft, CaretRight as ChevronRight, MagnifyingGlass as Search, SlidersHorizontal, X } from '@phosphor-icons/react'
import { api } from '../api'
import MovieGrid from '../components/MovieGrid'
import { Dialog, ErrorMessage, Hero, SectionTitle } from '../components/UI'
import { COPY, GENRE_OPTIONS } from '../constants/copy'
import { faNumber } from '../utils'

function filtersFromParams(params) {
  const parsedPage = Number(params.get('page') || 0)
  return {
    query: params.get('q') || '',
    iranian: params.get('iranian') === '1',
    genre: params.get('genre') || '',
    mediaType: params.get('type') === 'serial' ? 'serial' : 'movie',
    page: Number.isInteger(parsedPage) && parsedPage >= 0 ? parsedPage : 0,
  }
}

export default function Discover({ user, onRate, onDetails, onTrack, params, replaceParams }) {
  const initialFilters = filtersFromParams(params)
  const [draft, setDraft] = useState(initialFilters.query)
  const [filters, setFilters] = useState(initialFilters)
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    api.movies({ query: filters.query, iranian: filters.iranian, genre: filters.genre, mediaType: filters.mediaType, skip: filters.page * 24, signal: controller.signal })
      .then(setMovies)
      .catch((requestError) => requestError.name !== 'AbortError' && setError(requestError.message))
      .finally(() => !controller.signal.aborted && setLoading(false))
    return () => controller.abort()
  }, [filters.genre, filters.iranian, filters.mediaType, filters.page, filters.query])

  const updateFilters = (next) => {
    setLoading(true)
    setError('')
    setMovies([])
    const updated = { ...filters, ...next }
    setFilters(updated)
    replaceParams({
      q: updated.query || undefined,
      genre: updated.genre || undefined,
      iranian: updated.iranian ? '1' : undefined,
      page: updated.page ? String(updated.page) : undefined,
      type: updated.mediaType === 'serial' ? 'serial' : undefined,
    })
  }
  const search = (event) => { event.preventDefault(); updateFilters({ query: draft.trim(), page: 0 }) }
  const clearSearch = () => {
    setDraft('')
    if (filters.query) updateFilters({ query: '', page: 0 })
  }
  const clearFilters = () => { setDraft(''); updateFilters({ query: '', iranian: false, genre: '', page: 0 }) }
  const applyFilters = (next) => {
    updateFilters({ ...next, page: 0 })
    setFiltersOpen(false)
  }

  return (
    <>
      <Hero className="compact-hero archive-hero" eyebrow={COPY.discover.eyebrow} title={<>{COPY.discover.titleStart}<br /><em>{COPY.discover.titleAccent}</em></>} description={COPY.discover.description} />
      <div className="media-switch segmented" aria-label={COPY.discover.mediaType}>
        <button type="button" className={filters.mediaType === 'movie' ? 'selected' : ''} aria-pressed={filters.mediaType === 'movie'} onClick={() => updateFilters({ mediaType: 'movie', page: 0 })}>{COPY.discover.moviesTab}</button>
        <button type="button" className={filters.mediaType === 'serial' ? 'selected' : ''} aria-pressed={filters.mediaType === 'serial'} onClick={() => updateFilters({ mediaType: 'serial', iranian: false, page: 0 })}>{COPY.discover.serialsTab}</button>
      </div>
      <section className="search-panel">
        <form className="search-box" onSubmit={search}>
          <Search size={20} aria-hidden="true" />
          <input name="movie-search" autoComplete="off" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={COPY.discover.searchPlaceholder} aria-label={COPY.discover.searchLabel} />
          {draft ? <button type="button" className="search-clear" onClick={clearSearch} aria-label={COPY.discover.clearSearch}><X aria-hidden="true" /></button> : null}
          <button type="submit" className="search-submit">{COPY.discover.searchAction}</button>
        </form>
        <div className="filter-bar"><DiscoverFilters filters={filters} onChange={applyFilters} onClear={clearFilters} /></div>
        <button type="button" className="filter-sheet-trigger" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={18} aria-hidden="true" />{COPY.discover.filters}</button>
      </section>
      {filtersOpen ? <Dialog title={COPY.discover.filters} className="filter-sheet" onClose={() => setFiltersOpen(false)}><DiscoverFilters filters={filters} onChange={applyFilters} onClear={() => { clearFilters(); setFiltersOpen(false) }} sheet /></Dialog> : null}
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      <SectionTitle
        eyebrow={filters.iranian ? COPY.discover.iranianCatalog : COPY.discover.fullCatalog}
        title={filters.query ? COPY.discover.result(filters.query) : COPY.discover.browse}
        action={<span className="page-label">{COPY.discover.page(faNumber(filters.page + 1))}</span>}
      />
      <MovieGrid movies={movies} loading={loading} user={user} onRate={onRate} onDetails={onDetails} onTrack={onTrack} />
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

function DiscoverFilters({ filters, onChange, onClear, sheet = false }) {
  const [draft, setDraft] = useState({ genre: filters.genre, iranian: filters.iranian })
  const apply = () => onChange(draft)
  const update = (next) => {
    if (sheet) setDraft({ ...draft, ...next })
    else onChange(next)
  }
  const values = sheet ? draft : filters
  return (
    <div className={sheet ? 'filter-sheet-content' : 'filter-controls'}>
      {!sheet ? <span><SlidersHorizontal size={17} aria-hidden="true" />{COPY.discover.filters}</span> : null}
      <select name={sheet ? 'sheet-genre' : 'genre'} autoComplete="off" value={values.genre} onChange={(event) => update({ genre: event.target.value })} aria-label={COPY.discover.genreLabel}>
        <option value="">{COPY.discover.allGenres}</option>
        {GENRE_OPTIONS.map(([key, label]) => <option value={key} key={key}>{label}</option>)}
      </select>
      {filters.mediaType === 'movie' ? <label className="switch"><input type="checkbox" checked={values.iranian} onChange={(event) => update({ iranian: event.target.checked })} /><span aria-hidden="true" />{COPY.discover.iranianOnly}</label> : null}
      {sheet ? <button type="button" className="button primary large" onClick={apply}>{COPY.discover.applyFilters}</button> : null}
      {filters.query || filters.genre || filters.iranian ? <button type="button" className="clear-filter" onClick={onClear}>{COPY.discover.clear}</button> : null}
    </div>
  )
}
