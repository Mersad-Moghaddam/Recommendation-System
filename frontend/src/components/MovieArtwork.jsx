import { Play } from '@phosphor-icons/react'
import { faNumber, movieId, titleWithoutYear, yearFromTitle } from '../utils'

function Artwork({ movie, index, className }) {
  const id = movieId(movie)
  const tone = Math.abs(Number(id) || index || 0) % 5
  const title = titleWithoutYear(movie.title)
  return (
    <div className={`movie-artwork ${className}`} style={{ '--art-tone': tone }} aria-hidden="true">
      <span className="artwork-grain" />
      <span className="artwork-frame" />
      <span className="artwork-year">{faNumber(yearFromTitle(movie.title))}</span>
      <span className="artwork-mark"><Play weight="fill" /></span>
      <strong>{title.slice(0, 1)}</strong>
      {index != null ? <span className="artwork-index">{faNumber(String(index + 1).padStart(2, '0'))}</span> : null}
    </div>
  )
}

export function CardArtwork({ movie, index }) {
  return <Artwork movie={movie} index={index} className="artwork-card" />
}

export function DetailArtwork({ movie }) {
  return <Artwork movie={movie} className="artwork-detail" />
}
