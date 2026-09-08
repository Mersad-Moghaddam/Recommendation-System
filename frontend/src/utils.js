import { GENRE_LABELS, PERSIAN_DIGITS } from './constants/copy'

const YEAR_PATTERN = /\((\d{4})\)\s*$/
const PERSIAN_NUMBER_FORMATTER = new Intl.NumberFormat('fa-IR')

export const faNumber = (value) => String(value ?? '').replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)])
export const genreFa = (genre) => GENRE_LABELS[genre] || genre
export const movieId = (movie) => movie.movie_id ?? movie.id
export const yearFromTitle = (title = '') => title.match(YEAR_PATTERN)?.[1] || '—'
export const titleWithoutYear = (title = '') => title.replace(YEAR_PATTERN, '').trim()
export const formatFaNumber = (value) => PERSIAN_NUMBER_FORMATTER.format(value)
