import { ArrowUpLeft, BookmarkSimple, CheckCircle, PlayCircle, Sparkle as Sparkles, Star } from '@phosphor-icons/react'
import { COPY } from '../constants/copy'
import { faNumber, genreFa, movieId, titleWithoutYear } from '../utils'
import { CardArtwork } from './MovieArtwork'

function MovieCardFrame({ movie, index, onDetails, onRate, onTrack, className }) {
  const title = movie.display_title || titleWithoutYear(movie.title)
  return (
    <article className={`movie-card ${className}`} style={{ '--delay': `${Math.min(index, 5) * 18}ms` }}>
      <a className="movie-card-main" href={`/#detail?id=${movieId(movie)}`} onClick={(event) => onDetails(movie, event)}>
        <CardArtwork movie={movie} index={index} />
        <span className="movie-copy">
          <span className="genre-row">
            <span className="media-badge">{movie.media_type === 'serial' ? COPY.card.serial : COPY.card.movie}</span>
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
      <MovieQuickActions movie={movie} onRate={onRate} onTrack={onTrack} />
    </article>
  )
}

function MovieQuickActions({ movie, onRate, onTrack }) {
  if (!onRate && !onTrack) return null
  return <div className="card-quick-actions"><TrackingActions movie={movie} onTrack={onTrack} />{onRate && movie.media_type !== 'serial' ? <button type="button" onClick={() => onRate(movie)}><Star size={16} aria-hidden="true" />{COPY.card.rate}</button> : null}</div>
}

function TrackingActions({ movie, onTrack }) {
  if (!onTrack) return null
  const serial = movie.media_type === 'serial'
  return <><button type="button" onClick={() => onTrack(movie, 'watchlist')}><BookmarkSimple size={16} aria-hidden="true" />{COPY.card.watchlist}</button><button type="button" onClick={() => onTrack(movie, serial ? 'watching' : 'completed')}>{serial ? <PlayCircle size={16} aria-hidden="true" /> : <CheckCircle size={16} aria-hidden="true" />}{serial ? COPY.card.trackSerial : COPY.card.watched}</button></>
}

export default function MovieCard(props) {
  return <MovieCardFrame {...props} className="movie-card-standard" />
}

export function CompactMovieCard(props) {
  return <MovieCardFrame {...props} className="movie-card-compact" />
}
