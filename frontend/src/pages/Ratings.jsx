import { useEffect, useState } from 'react'
import { Film, Star } from 'lucide-react'
import { api } from '../api'
import { Empty, ErrorMessage, Hero, Loading } from '../components/UI'
import { faNumber, genreFa } from '../utils'

export default function Ratings({ token, setPage }) {
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { api.ratings(token).then(setRatings).catch((err) => setError(err.message)).finally(() => setLoading(false)) }, [token])
  return <>
    <Hero variant="compact-hero ratings" eyebrow="دفترچهٔ تماشا" title={<>رد پای سلیقهٔ<br/><em>سینمایی تو.</em></>} description="امتیازها پایهٔ پیشنهاد شخصی هستند؛ با هر انتخاب، مدل تو را بهتر می‌شناسد." />
    {error && <ErrorMessage>{error}</ErrorMessage>}
    {loading ? <Loading count={4}/> : ratings.length ? <div className="rating-list">{ratings.map((item) => <article key={item.id}><span className="rating-film"><Film/></span><div className="rating-info"><h3>{item.title}</h3><p>{item.genres.map(genreFa).join(' · ')}</p></div><div className="stars" aria-label={`امتیاز ${item.rating} از ۵`}><Star fill="currentColor"/><strong>{faNumber(item.rating)}</strong><small>از ۵</small></div></article>)}</div> : <><Empty title="هنوز امتیازی ثبت نکرده‌ای" text="چند فیلم را پیدا کن و به آن‌ها امتیاز بده تا پیشنهادهای شخصی فعال شوند."/><div className="center"><button className="button primary" onClick={() => setPage('discover')}>رفتن به آرشیو فیلم‌ها</button></div></>}
  </>
}
