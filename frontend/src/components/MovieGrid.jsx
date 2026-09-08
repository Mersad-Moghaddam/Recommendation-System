import { ViewTransition } from 'react'
import MovieCard, { CompactMovieCard } from './MovieCard'
import { Empty, Loading } from './UI'
import { movieId } from '../utils'

function Grid({ movies, loading, user, onRate, onDetails, emptyTitle, CardComponent }) {
  if (loading) return <Loading />
  if (!movies?.length) return <Empty title={emptyTitle} />
  return (
    <div className="movie-grid">
      {movies.map((movie, index) => (
        <ViewTransition key={movieId(movie)} update="auto" default="none">
          <CardComponent
            movie={movie}
            index={index}
            onRate={user ? onRate : undefined}
            onDetails={onDetails}
          />
        </ViewTransition>
      ))}
    </div>
  )
}

export default function MovieGrid(props) {
  return <Grid {...props} CardComponent={MovieCard} />
}

export function CompactMovieGrid(props) {
  return <Grid {...props} CardComponent={CompactMovieCard} />
}
