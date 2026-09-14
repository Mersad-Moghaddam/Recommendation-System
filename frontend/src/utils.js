import { GENRE_LABELS, PERSIAN_DIGITS } from './constants/copy'

const YEAR_PATTERN = /\((\d{4})\)\s*$/
let locale = 'en'
const NUMBER_FORMATTERS = { en: new Intl.NumberFormat('en-US'), fa: new Intl.NumberFormat('fa-IR') }
const MONTH_FORMATTERS = {
  en: new Intl.DateTimeFormat('en-US', { month: 'short' }),
  fa: new Intl.DateTimeFormat('fa-IR', { month: 'short' }),
}

export const setFormattingLocale = (nextLocale) => { locale = nextLocale === 'fa' ? 'fa' : 'en' }
export const faNumber = (value) => locale === 'fa' ? String(value ?? '').replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]) : String(value ?? '')
export const genreFa = (genre) => GENRE_LABELS[genre] || genre
export const movieId = (movie) => movie.movie_id ?? movie.id
export const yearFromTitle = (title = '') => title.match(YEAR_PATTERN)?.[1] || '—'
export const titleWithoutYear = (title = '') => title.replace(YEAR_PATTERN, '').trim()
export const formatFaNumber = (value) => NUMBER_FORMATTERS[locale].format(value)
export const formatMonth = (value) => MONTH_FORMATTERS[locale].format(value)
