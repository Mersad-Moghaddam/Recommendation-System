import { useEffect, useState } from 'react'
import { ArrowLeft, Brain as BrainCircuit, FilmReel as Film, MapPin, Sparkle as Sparkles, Star, TelevisionSimple as Television, UsersThree as Users } from '@phosphor-icons/react'
import { api } from '../api'
import { CompactMovieGrid } from '../components/MovieGrid'
import { Hero, SectionTitle } from '../components/UI'
import { COPY } from '../constants/copy'
import { faNumber, formatFaNumber } from '../utils'

export default function Home({ navigate, user, onRate, onDetails, onTrack, showError }) {
  const [stats, setStats] = useState(null)
  const [iranianMovies, setIranianMovies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([api.stats(), api.movies({ iranian: true, limit: 6 })])
      .then(([nextStats, movies]) => {
        if (!active) return
        setStats(nextStats)
        setIranianMovies(movies)
      })
      .catch(showError)
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [showError])

  return (
    <>
      <Hero
        className="home-hero"
        visual={<img className="hero-visual" src="/images/tehran-premiere.webp" alt="" width="1942" height="817" fetchPriority="high" />}
        eyebrow={COPY.home.eyebrow}
        title={<>{COPY.home.titleStart}<br /><em>{COPY.home.titleAccent}</em></>}
        description={COPY.home.description}
      >
        <a className="button primary" href="/#concierge" onClick={(event) => navigate('concierge', event)}>
          <BrainCircuit size={19} aria-hidden="true" />{COPY.home.primaryAction}
        </a>
        <a className="button ghost" href="/#discover" onClick={(event) => navigate('discover', event)}>
          {COPY.home.secondaryAction}<ArrowLeft size={18} aria-hidden="true" />
        </a>
        <small className="hero-proof"><Sparkles size={15} aria-hidden="true" />{COPY.home.proof}</small>
      </Hero>

      <section className="stats-strip" aria-label={COPY.home.statsLabel}>
        <Stat icon={Film} value={stats?.movies} label={COPY.home.statMovies} />
        <Stat icon={Television} value={stats?.serials} label={COPY.home.statSerials} />
        <Stat icon={Star} value={stats?.ratings} label={COPY.home.statRatings} />
        <Stat icon={Users} value={stats?.users} label={COPY.home.statUsers} />
        <Stat icon={MapPin} value={stats?.persian_movies} label={COPY.home.statPersian} />
      </section>

      <section className="how-section">
        <SectionTitle eyebrow={COPY.home.howEyebrow} title={COPY.home.howTitle} />
        <div className="feature-grid">
          <Feature number={faNumber(1)} title={COPY.home.featureOneTitle} text={COPY.home.featureOneText} />
          <Feature number={faNumber(2)} title={COPY.home.featureTwoTitle} text={COPY.home.featureTwoText} />
          <Feature number={faNumber(3)} title={COPY.home.featureThreeTitle} text={COPY.home.featureThreeText} />
        </div>
      </section>

      <section>
        <SectionTitle
          eyebrow={COPY.home.iranianEyebrow}
          title={COPY.home.iranianTitle}
          action={<a className="link-button" href="/#discover" onClick={(event) => navigate('discover', event)}>{COPY.home.viewAll}<ArrowLeft size={16} aria-hidden="true" /></a>}
        />
        <CompactMovieGrid movies={iranianMovies} loading={loading} user={user} onRate={onRate} onDetails={onDetails} onTrack={onTrack} />
      </section>
    </>
  )
}

function Stat({ icon: Icon, value, label }) {
  return <div className="stat"><Icon size={21} aria-hidden="true" /><div><strong>{value == null ? '—' : formatFaNumber(value)}</strong><span>{label}</span></div></div>
}

function Feature({ number, title, text }) {
  return <article className="feature-card"><span>{number}</span><h3>{title}</h3><p>{text}</p></article>
}
