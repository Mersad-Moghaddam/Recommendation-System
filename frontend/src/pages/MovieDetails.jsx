import { useEffect, useState } from 'react'
import { ArrowRight, CalendarBlank as CalendarDays, Database, Info, Sparkle as Sparkles, Star, UsersThree as UsersRound } from '@phosphor-icons/react'
import { api } from '../api'
import { DetailArtwork } from '../components/MovieArtwork'
import MovieGrid from '../components/MovieGrid'
import { ErrorMessage, PageLoading, SectionTitle } from '../components/UI'
import { COPY } from '../constants/copy'
import { faNumber, genreFa, movieId, titleWithoutYear } from '../utils'

function useMoviePageData(id) {
  const [details, setDetails] = useState(null)
  const [similar, setSimilar] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.movieDetails(id)
      .then((result) => active && setDetails(result))
      .catch((requestError) => active && setError(requestError.message))
    api.similar(id)
      .then((result) => active && setSimilar(result))
      .catch((requestError) => active && setError(requestError.message))
    return () => { active = false }
  }, [id])

  return { details, similar, error }
}

export default function MovieDetails({ id, seed, user, onRate, onDetails, goBack }) {
  const { details, similar, error } = useMoviePageData(id)
  const movie = details || seed
  if (!movie && !error) return <PageLoading />
  if (!movie) return <ErrorMessage>{error}</ErrorMessage>

  return (
    <>
      <button type="button" className="back-button" onClick={goBack}><ArrowRight size={18} aria-hidden="true" />{COPY.details.back}</button>
      <DetailHero movie={movie} details={details} onRate={onRate} />
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      <DetailExtras details={details} similar={similar} id={id} user={user} onRate={onRate} onDetails={onDetails} />
    </>
  )
}

function DetailHero({ movie, details, onRate }) {
  return (
    <article className="detail-hero">
      <img className="detail-hero-visual" src="/images/cinema-hero.webp" alt="" width="1599" height="900" fetchPriority="high" />
      <div className="detail-poster"><DetailArtwork movie={movie} /></div>
      <div className="detail-main">
        <span className="eyebrow">{COPY.details.eyebrow}</span>
        <h1>{details?.display_title || titleWithoutYear(movie.title)}</h1>
        <div className="detail-tags">{movie.genres?.map((genre) => <span key={genre}>{genreFa(genre)}</span>)}</div>
        {movie.score != null ? <div className="detail-match"><Sparkles aria-hidden="true" /><strong>{COPY.card.match(faNumber(Math.round(movie.score * 100)))}</strong></div> : null}
        {movie.reason ? <div className="recommendation-reason"><b>{COPY.details.reasonTitle}</b><p>{movie.reason}</p></div> : null}
        {details ? <p className="detail-overview">{details.overview}</p> : <p className="detail-loading">{COPY.details.loading}</p>}
        <div className="detail-actions"><button type="button" className="button primary" onClick={() => onRate(movie)}><Star size={18} aria-hidden="true" />{COPY.details.rateAction}</button></div>
      </div>
      <DetailFacts details={details} />
    </article>
  )
}

function DetailFacts({ details }) {
  if (!details) return null
  return (
    <aside className="detail-facts">
      <Fact icon={Star} label={COPY.details.rating} value={details.rating_average == null ? COPY.details.noRating : faNumber(details.rating_average)} />
      <Fact icon={UsersRound} label={COPY.details.votes} value={faNumber(details.rating_count)} />
      <Fact icon={CalendarDays} label={COPY.details.year} value={details.year ? faNumber(details.year) : '—'} />
      <Fact icon={Database} label={COPY.details.source} value={details.source} />
    </aside>
  )
}

function DetailExtras({ details, similar, id, user, onRate, onDetails }) {
  if (!details) return null
  const relatedMovies = similar.filter((item) => movieId(item) !== Number(id))
  return (
    <>
      <section className="detail-insights">
        <Insight icon={Sparkles} title={COPY.details.experienceTitle} text={details.experience} />
        <Insight icon={UsersRound} title={COPY.details.bestForTitle} text={details.best_for} />
        <Insight icon={Star} title={COPY.details.communityTitle} text={details.community_note} />
        <Insight icon={Info} title={COPY.details.dataTransparency} text={details.data_note} />
      </section>
      <section className="similar-section">
        <SectionTitle eyebrow={COPY.details.similarEyebrow} title={COPY.details.similarTitle} />
        <MovieGrid movies={relatedMovies} user={user} onRate={onRate} onDetails={onDetails} />
      </section>
    </>
  )
}

function Fact({ icon: Icon, label, value }) {
  return <div><Icon size={18} aria-hidden="true" /><span><small>{label}</small><strong>{value}</strong></span></div>
}

function Insight({ icon: Icon, title, text }) {
  return <article><Icon size={22} aria-hidden="true" /><div><h2>{title}</h2><p>{text}</p></div></article>
}
