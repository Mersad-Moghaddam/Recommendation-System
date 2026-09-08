import { useEffect, useState } from 'react'
import { ArrowLeft, FilmReel as Film, Star } from '@phosphor-icons/react'
import { api } from '../api'
import { Empty, ErrorMessage, Hero, Loading } from '../components/UI'
import { COPY } from '../constants/copy'
import { faNumber, genreFa } from '../utils'

export default function Ratings({ token, navigate, onDetails }) {
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.ratings(token)
      .then((items) => active && setRatings(items))
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [token])

  return (
    <>
      <Hero className="compact-hero ratings-hero" eyebrow={COPY.ratings.eyebrow} title={<>{COPY.ratings.titleStart}<br /><em>{COPY.ratings.titleAccent}</em></>} description={COPY.ratings.description} />
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {loading ? <Loading count={4} /> : ratings.length ? (
        <div className="rating-list">
          {ratings.map((item) => (
            <article key={item.id}>
              <button type="button" className="rating-film" onClick={() => onDetails(item)} aria-label={COPY.card.detailsAria(item.title)}><Film aria-hidden="true" /></button>
              <button type="button" className="rating-info" onClick={() => onDetails(item)}><strong>{item.title}</strong><span>{item.genres.map(genreFa).join(' · ')}</span></button>
              <div className="stars" aria-label={COPY.ratings.aria(item.rating)}><Star weight="fill" aria-hidden="true" /><strong>{faNumber(item.rating)}</strong><small>{COPY.ratings.outOf}</small></div>
            </article>
          ))}
        </div>
      ) : (
        <>
          <Empty title={COPY.ratings.empty} text={COPY.ratings.emptyText} />
          <div className="center"><a className="button primary" href="/#discover" onClick={(event) => navigate('discover', event)}>{COPY.ratings.discoverAction}<ArrowLeft size={18} aria-hidden="true" /></a></div>
        </>
      )}
    </>
  )
}
