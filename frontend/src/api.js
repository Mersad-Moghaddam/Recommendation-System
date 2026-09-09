import { COPY } from './constants/copy'

const API_URL = import.meta.env.VITE_API_URL || '/api'
const pendingGets = new Map()

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.status = status
  }
}

async function fetchJson(url, options) {
  let response
  try {
    response = await fetch(url, {
      credentials: 'include',
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError(COPY.apiErrors.network)
  }
  if (!response.ok) {
    let message = COPY.apiErrors.generic
    try {
      const payload = await response.json()
      message = typeof payload.detail === 'string' ? payload.detail : message
    } catch {
      // The fallback copy is clearer than a non-JSON proxy response.
    }
    throw new ApiError(message, response.status)
  }
  if (response.status === 204) return null
  return response.json()
}

function request(path, options = {}) {
  const url = `${API_URL}${path}`
  const method = options.method || 'GET'
  if (method !== 'GET' || options.signal) return fetchJson(url, options)
  if (!pendingGets.has(url)) {
    const pending = fetchJson(url, options).finally(() => pendingGets.delete(url))
    pendingGets.set(url, pending)
  }
  return pendingGets.get(url)
}

export const api = {
  stats: () => request('/stats'),
  movies: ({ query = '', iranian = false, genre = '', skip = 0, limit = 24, signal } = {}) => request(
    `/movies?${new URLSearchParams({ q: query, persian_only: iranian, genre, skip, limit })}`,
    { signal },
  ),
  movieDetails: (id) => request(`/movies/${id}/details`),
  similar: (id) => request(`/movies/${id}/similar?n=6`),
  me: () => request('/auth/me'),
  login: (username, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
  register: (username, password) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  rate: (movieId, rating) => request('/ratings', {
    method: 'POST',
    body: JSON.stringify({ movie_id: movieId, rating }),
  }),
  rateBulk: (ratings) => request('/ratings/bulk', {
    method: 'POST',
    body: JSON.stringify({ ratings }),
  }),
  ratings: () => request('/users/me/ratings'),
  recommendations: (mode = 'balanced') => request(
    `/recommendations/me?mode=${encodeURIComponent(mode)}&n=12`,
  ),
  quiz: (payload) => request('/recommendations/quiz', {
    method: 'POST',
    body: JSON.stringify({ ...payload, n: 12 }),
  }),
  onboarding: () => request('/onboarding/movies'),
  skipOnboarding: () => request('/onboarding/skip', { method: 'POST' }),
}
