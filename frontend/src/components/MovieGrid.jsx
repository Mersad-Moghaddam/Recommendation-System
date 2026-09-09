import MovieCard, { CompactMovieCard } from './MovieCard'
import { Empty, Loading } from './UI'
import { movieId } from '../utils'

function Grid({ movies, loading, onRate, onDetails, emptyTitle, CardComponent, compact = false }) {
  if (loading) return <Loading compact={compact} />
  if (!movies?.length) return <Empty title={emptyTitle} />
  return (
    <div className="movie-grid">
      {movies.map((movie, index) => (
        <CardComponent
          key={movieId(movie)}
          movie={movie}
          index={index}
          onRate={onRate}
          onDetails={onDetails}
        />
      ))}
    </div>
  )
}

export default function MovieGrid(props) {
  return <Grid {...props} CardComponent={MovieCard} />
}

export function CompactMovieGrid(props) {
  return <Grid {...props} CardComponent={CompactMovieCard} compact />
}
