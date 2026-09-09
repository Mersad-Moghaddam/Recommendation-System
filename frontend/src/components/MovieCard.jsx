import { ArrowUpLeft, Sparkle as Sparkles, Star } from '@phosphor-icons/react'
import { COPY } from '../constants/copy'
import { faNumber, genreFa, movieId, titleWithoutYear } from '../utils'
import { CardArtwork } from './MovieArtwork'

function MovieCardFrame({ movie, index, onDetails, onRate, className }) {
  const title = movie.display_title || titleWithoutYear(movie.title)
  return (
    <article className={`movie-card ${className}`} style={{ '--delay': `${Math.min(index, 5) * 18}ms` }}>
      <a className="movie-card-main" href={`/#detail?id=${movieId(movie)}`} onClick={(event) => onDetails(movie, event)}>
        <CardArtwork movie={movie} index={index} />
        <span className="movie-copy">
          <span className="genre-row">
            {movie.genres?.slice(0, 3).map((genre) => <span key={genre}>{genreFa(genre)}</span>)}
          </span>
          <strong className="movie-title" title={movie.title}>{title}</strong>
          {movie.year ? <span className="movie-year">{faNumber(movie.year)}</span> : null}
          <span
            className="movie-overview"
            lang={movie.overview_locale || undefined}
            dir={movie.overview_locale === 'en' ? 'ltr' : 'rtl'}
          >
            {movie.overview_short || COPY.card.noOverview}
          </span>
          {movie.score != null ? (
            <span className="match"><Sparkles size={14} aria-hidden="true" />{COPY.card.match(faNumber(Math.round(movie.score * 100)))}</span>
          ) : null}
          {movie.reason ? <span className="reason">{movie.reason}</span> : null}
          <span className="details-link">{COPY.card.details}<ArrowUpLeft size={16} aria-hidden="true" /></span>
        </span>
      </a>
      {onRate ? (
        <button className="rate-quick" type="button" onClick={() => onRate(movie)}>
          <Star size={16} aria-hidden="true" />{COPY.card.rate}
        </button>
      ) : null}
    </article>
  )
}

export default function MovieCard(props) {
  return <MovieCardFrame {...props} className="movie-card-standard" />
}

export function CompactMovieCard(props) {
  return <MovieCardFrame {...props} className="movie-card-compact" />
}
