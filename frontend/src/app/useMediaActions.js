import { useCallback, useState } from 'react'
import { api } from '../api'
import { COPY } from '../constants/copy'
import { movieId } from '../utils'
import { announceDataChange } from './dataChanges'

export function useMediaActions({ user, route, changeRoute, showError, showSuccess }) {
  const [ratingMovie, setRatingMovie] = useState(null)
  const [rating, setRating] = useState(4)
  const [ratingBusy, setRatingBusy] = useState(false)

  const openRate = useCallback((movie) => {
    if (!user) {
      changeRoute('auth', { next: route.page || 'discover' })
      return false
    }
    setRatingMovie(movie)
    setRating(4)
    return true
  }, [changeRoute, route.page, user])

  const saveRating = useCallback(async () => {
    const submittedMovieId = movieId(ratingMovie)
    setRatingBusy(true)
    try {
      await api.rate(submittedMovieId, rating)
      announceDataChange('ratings', 'library', 'activity', 'profile', 'recommendations')
      setRatingMovie((current) => current && movieId(current) === submittedMovieId ? null : current)
      showSuccess(COPY.app.ratingSaved)
    } catch (error) {
      showError(error)
    } finally {
      setRatingBusy(false)
    }
  }, [rating, ratingMovie, showError, showSuccess])

  const saveToLibrary = useCallback(async (movie, status = 'watchlist') => {
    if (!user) {
      changeRoute('auth', { next: route.page || 'discover' })
      return false
    }
    try {
      await api.saveLibrary(movieId(movie), { status, watched_episodes: status === 'completed' ? 1 : 0 })
      announceDataChange('library', 'activity', 'profile', 'detail')
      showSuccess(status === 'completed' ? COPY.app.watchedSaved : COPY.app.watchlistSaved)
      return true
    } catch (error) {
      showError(error)
      return false
    }
  }, [changeRoute, route.page, showError, showSuccess, user])

  return { ratingMovie, rating, ratingBusy, setRating, closeRating: () => setRatingMovie(null), openRate, saveRating, saveToLibrary }
}
