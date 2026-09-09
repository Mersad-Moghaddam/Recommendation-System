import { FilmSlate as Clapperboard, Play } from '@phosphor-icons/react'
import { faNumber, movieId, titleWithoutYear, yearFromTitle } from '../utils'

function Artwork({ movie, index, className }) {
  const id = movieId(movie)
  const hue = Math.abs(Number(id) * 37) % 360
  const title = titleWithoutYear(movie.title)
  return (
    <div className={`movie-artwork ${className}`} style={{ '--art-hue': hue }} aria-hidden="true">
      <span className="artwork-grain" />
      <span className="artwork-frame" />
      <span className="artwork-year">{faNumber(yearFromTitle(movie.title))}</span>
      <span className="artwork-mark"><Clapperboard /><Play weight="fill" /></span>
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
