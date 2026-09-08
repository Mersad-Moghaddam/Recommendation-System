import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import { api } from '../api'
import MovieGrid from '../components/MovieGrid'
import { ErrorMessage, Hero, SectionTitle } from '../components/UI'
import { GENRES, faNumber } from '../utils'

export default function Discover({ user, onRate, onSimilar }) {
  const [draft, setDraft] = useState('')
  const [filters, setFilters] = useState({ query: '', iranian: false, genre: '', page: 0 })
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    api.movies({ query: filters.query, iranian: filters.iranian, genre: filters.genre, skip: filters.page * 24 })
      .then(setMovies).catch((err) => setError(err.message)).finally(() => setLoading(false))
  }, [filters])
  const updateFilters = (next) => { setLoading(true); setError(''); setFilters((current) => ({ ...current, ...next })) }
  const search = (event) => { event.preventDefault(); updateFilters({ query: draft.trim(), page: 0 }) }
  return <>
    <Hero variant="compact-hero archive" eyebrow="آرشیو فیلم" title={<>فیلم بعدی‌ات<br/><em>همین‌جا منتظر است.</em></>} description="در میان آثار ایرانی و بین‌المللی جست‌وجو کن، ژانر را محدود کن و سلیقه‌ات را بساز." />
    <section className="search-panel">
      <form className="search-box" onSubmit={search}><Search size={20}/><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="نام فیلم را بنویس؛ مثلاً جدایی یا Interstellar" aria-label="جست‌وجوی فیلم"/><button>جست‌وجو</button></form>
      <div className="filter-bar"><span><SlidersHorizontal size={17}/> فیلترها</span><select value={filters.genre} onChange={(e) => updateFilters({ genre:e.target.value, page:0 })} aria-label="فیلتر ژانر"><option value="">همه ژانرها</option>{Object.entries(GENRES).filter(([key]) => key !== '(no genres listed)').map(([key,label]) => <option value={key} key={key}>{label}</option>)}</select><label className="switch"><input type="checkbox" checked={filters.iranian} onChange={(e) => updateFilters({ iranian:e.target.checked, page:0 })}/><span/> فقط سینمای ایران</label>{(filters.query || filters.genre || filters.iranian) && <button className="clear-filter" onClick={() => { setDraft(''); updateFilters({ query:'', iranian:false, genre:'', page:0 }) }}>حذف فیلترها</button>}</div>
    </section>
    {error && <ErrorMessage>{error}</ErrorMessage>}
    <SectionTitle eyebrow={filters.iranian ? 'کاتالوگ ایران' : 'کاتالوگ کامل'} title={filters.query ? `نتیجه برای «${filters.query}»` : 'مرور فیلم‌ها'} action={<span className="page-label">صفحه {faNumber(filters.page + 1)}</span>} />
    <MovieGrid movies={movies} loading={loading} user={user} onRate={onRate} onSimilar={onSimilar}/>
    {!loading && movies.length > 0 && <div className="pagination"><button disabled={filters.page === 0} onClick={() => updateFilters({ page:filters.page-1 })}><ChevronRight/> صفحه قبل</button><span>{faNumber(filters.page + 1)}</span><button disabled={movies.length < 24} onClick={() => updateFilters({ page:filters.page+1 })}>صفحه بعد <ChevronLeft/></button></div>}
  </>
}
