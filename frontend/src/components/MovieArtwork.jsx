import { ViewTransition } from 'react'
import { Clapperboard, Play } from 'lucide-react'
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
      <span className="artwork-mark"><Clapperboard /><Play fill="currentColor" /></span>
      <strong>{title.slice(0, 1)}</strong>
      {index != null ? <span className="artwork-index">{faNumber(String(index + 1).padStart(2, '0'))}</span> : null}
    </div>
  )
}

export function CardArtwork({ movie, index }) {
  return (
    <ViewTransition name={`movie-art-${movieId(movie)}`} share="morph" default="none">
      <Artwork movie={movie} index={index} className="artwork-card" />
    </ViewTransition>
  )
}

export function DetailArtwork({ movie }) {
  return (
    <ViewTransition name={`movie-art-${movieId(movie)}`} share="morph" default="none">
      <Artwork movie={movie} className="artwork-detail" />
    </ViewTransition>
  )
}
