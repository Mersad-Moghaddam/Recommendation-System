export const GENRES = {
  Action: 'اکشن', Adventure: 'ماجراجویی', Animation: 'انیمیشن', Children: 'کودک', Comedy: 'کمدی',
  Crime: 'جنایی', Documentary: 'مستند', Drama: 'درام', Fantasy: 'فانتزی', 'Film-Noir': 'نوآر',
  Horror: 'ترسناک', Musical: 'موزیکال', Mystery: 'معمایی', Romance: 'عاشقانه', 'Sci-Fi': 'علمی‌تخیلی',
  Thriller: 'هیجان‌انگیز', War: 'جنگی', Western: 'وسترن', '(no genres listed)': 'بدون ژانر',
}

const digits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹']
export const faNumber = (value) => String(value ?? '').replace(/\d/g, (digit) => digits[Number(digit)])
export const genreFa = (genre) => GENRES[genre] || genre
export const movieId = (movie) => movie.movie_id ?? movie.id
export const yearFromTitle = (title = '') => title.match(/\((\d{4})\)\s*$/)?.[1] || '—'
export const titleWithoutYear = (title = '') => title.replace(/\s*\(\d{4}\)\s*$/, '')
