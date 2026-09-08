import { ArrowUpLeft, Sparkle as Sparkles, Star } from '@phosphor-icons/react'
import { COPY } from '../constants/copy'
import { faNumber, genreFa, titleWithoutYear } from '../utils'
import { CardArtwork } from './MovieArtwork'

function MovieCardFrame({ movie, index, onDetails, onRate, className }) {
  const title = titleWithoutYear(movie.title)
  return (
    <article className={`movie-card ${className}`} style={{ '--delay': `${Math.min(index, 8) * 40}ms` }}>
      <button className="movie-card-main" type="button" onClick={() => onDetails(movie)} aria-label={COPY.card.detailsAria(title)}>
        <CardArtwork movie={movie} index={index} />
        <span className="movie-copy">
          <span className="genre-row">
            {movie.genres?.slice(0, 3).map((genre) => <span key={genre}>{genreFa(genre)}</span>)}
          </span>
          <strong className="movie-title" title={movie.title}>{title}</strong>
          {movie.score != null ? (
            <span className="match"><Sparkles size={14} aria-hidden="true" />{COPY.card.match(faNumber(Math.round(movie.score * 100)))}</span>
          ) : null}
          {movie.reason ? <span className="reason">{movie.reason}</span> : null}
          <span className="details-link">{COPY.card.details}<ArrowUpLeft size={16} aria-hidden="true" /></span>
        </span>
      </button>
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
