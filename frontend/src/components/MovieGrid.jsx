import MovieCard from './MovieCard'
import { Empty, Loading } from './UI'

export default function MovieGrid({ movies, loading, user, onRate, onSimilar, emptyTitle, compact = false }) {
  if (loading) return <Loading />
  if (!movies?.length) return <Empty title={emptyTitle} />
  return <div className="movie-grid">{movies.map((movie, index) => <MovieCard key={movie.movie_id ?? movie.id} movie={movie} index={index} canRate={Boolean(user)} onRate={onRate} onSimilar={onSimilar} compact={compact} />)}</div>
}
