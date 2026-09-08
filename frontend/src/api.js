const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export class ApiError extends Error {}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}), ...options.headers },
  }).catch(() => { throw new ApiError('ارتباط با سرور برقرار نشد. مطمئن شوید FastAPI در حال اجراست.') })
  if (!response.ok) {
    let message = 'در انجام درخواست مشکلی پیش آمد.'
    try { message = (await response.json()).detail || message } catch { /* response was not JSON */ }
    throw new ApiError(message)
  }
  return response.json()
}

export const api = {
  stats: () => request('/stats'),
  movies: ({ query = '', iranian = false, genre = '', skip = 0, limit = 24 } = {}) => request(`/movies?${new URLSearchParams({ q: query, persian_only: iranian, genre, skip, limit })}`),
  similar: (id) => request(`/movies/${id}/similar?n=6`),
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  rate: (token, movieId, rating) => request('/ratings', { method: 'POST', token, body: JSON.stringify({ movie_id: movieId, rating }) }),
  ratings: (token) => request('/users/me/ratings', { token }),
  recommendations: (token, method = 'hybrid') => request(`/recommendations/me?method=${method}&n=12`, { token }),
  quiz: (payload) => request('/recommendations/quiz', { method: 'POST', body: JSON.stringify({ ...payload, n: 12 }) }),
}
