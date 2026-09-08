import { Info, Sparkles, Star } from 'lucide-react'
import { faNumber, genreFa, movieId, titleWithoutYear, yearFromTitle } from '../utils'

export default function MovieCard({ movie, index = 0, canRate, onRate, onSimilar, compact = false }) {
  const id = movieId(movie)
  const hue = (Number(id) * 37) % 360
  return <article className={`movie-card ${compact ? 'compact' : ''}`} style={{ '--hue': hue, '--delay': `${Math.min(index, 8) * 45}ms` }}>
    <div className="poster" aria-hidden="true">
      <div className="poster-noise" />
      <span className="poster-year">{faNumber(yearFromTitle(movie.title))}</span>
      <ClapperGlyph />
      <span className="poster-index">{faNumber(String(index + 1).padStart(2, '0'))}</span>
    </div>
    <div className="movie-body">
      <div className="genre-row">{movie.genres?.slice(0, 3).map((genre) => <span key={genre}>{genreFa(genre)}</span>)}</div>
      <h3 title={movie.title}>{titleWithoutYear(movie.title)}</h3>
      {movie.score != null && <div className="match"><Sparkles size={14} /> {faNumber(Math.round(movie.score * 100))}٪ هماهنگی</div>}
      {movie.reason && <p className="reason">{movie.reason}</p>}
      <div className="card-actions">
        <button className="icon-action" onClick={() => onSimilar(movie)}><Info size={17} /> مشابه‌ها</button>
        {canRate && <button className="icon-action primary" onClick={() => onRate(movie)}><Star size={17} /> امتیاز</button>}
      </div>
    </div>
  </article>
}

function ClapperGlyph() {
  return <svg className="poster-glyph" viewBox="0 0 90 90" fill="none"><circle cx="45" cy="45" r="31" stroke="currentColor" strokeWidth="2"/><circle cx="45" cy="45" r="7" fill="currentColor"/><circle cx="45" cy="24" r="6" fill="currentColor"/><circle cx="64" cy="42" r="6" fill="currentColor"/><circle cx="48" cy="64" r="6" fill="currentColor"/><circle cx="27" cy="49" r="6" fill="currentColor"/></svg>
}
