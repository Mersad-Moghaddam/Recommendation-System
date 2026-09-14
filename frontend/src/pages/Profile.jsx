import { useEffect, useState } from 'react'
import { ClockCounterClockwise, SignOut, Sparkle, Star } from '@phosphor-icons/react'
import { api } from '../api'
import { ErrorMessage, PageLoading } from '../components/UI'
import { COPY } from '../constants/copy'
import { faNumber } from '../utils'
import { useDataRevision } from '../app/dataChanges'

const EMPTY_SUMMARY = { movies_watched: 0, series_watched: 0, episodes_watched: 0, watchlist_count: 0, ratings_count: 0, active_series_count: 0 }

export default function Profile({ user, navigate, logout }) {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const dataRevision = useDataRevision('profile', 'ratings', 'library')

  useEffect(() => {
    let active = true
    api.profileSummary().then((result) => active && setSummary(result)).catch((requestError) => active && setError(requestError.message))
    return () => { active = false }
  }, [dataRevision])

  if (!summary && !error) return <PageLoading />
  const totals = summary || EMPTY_SUMMARY
  return (
    <div className="profile-page">
      <header className="profile-identity"><span>{COPY.profile.account}</span><h1>{COPY.profile.title}</h1><p>{user.username}</p></header>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      <section className="profile-group" aria-labelledby="profile-summary-title">
        <h2 id="profile-summary-title">{COPY.profile.summary}</h2>
        <dl className="profile-summary">
          <Summary value={totals.movies_watched} label={COPY.profile.moviesWatched} />
          <Summary value={totals.series_watched} label={COPY.profile.seriesWatched} />
          <Summary value={totals.episodes_watched} label={COPY.profile.episodesWatched} />
          <Summary value={totals.watchlist_count} label={COPY.profile.watchlist} />
          <Summary value={totals.ratings_count} label={COPY.profile.ratings} />
          <Summary value={totals.active_series_count} label={COPY.profile.activeSeries} />
        </dl>
      </section>
      <section className="profile-group" aria-labelledby="profile-library-title">
        <h2 id="profile-library-title">{COPY.profile.library}</h2>
        <div className="profile-list">
          <ProfileLink page="ratings" navigate={navigate} icon={<Star aria-hidden="true" />} label={COPY.profile.ratingsLink} detail={COPY.profile.ratingsDetail(totals.ratings_count)} />
          <ProfileLink page="tracker" navigate={navigate} icon={<ClockCounterClockwise aria-hidden="true" />} label={COPY.profile.trackerLink} detail={COPY.profile.trackerDetail(totals.active_series_count, totals.watchlist_count)} />
          <ProfileLink page="recommendations" navigate={navigate} icon={<Sparkle aria-hidden="true" />} label={COPY.profile.recommendationsLink} detail={COPY.profile.recommendationsDetail} />
        </div>
      </section>
      <section className="profile-group" aria-labelledby="profile-session-title">
        <h2 id="profile-session-title">{COPY.profile.session}</h2>
        <div className="profile-list"><button type="button" className="profile-row profile-signout" onClick={logout}><SignOut aria-hidden="true" /><span>{COPY.profile.signOut}</span></button></div>
      </section>
    </div>
  )
}

function Summary({ value, label }) {
  return <div><dd>{faNumber(value)}</dd><dt>{label}</dt></div>
}

function ProfileLink({ page, navigate, icon, label, detail }) {
  return <a className="profile-row" href={`/#${page}`} onClick={(event) => navigate(page, event)}>{icon}<span><b>{label}</b><small>{detail}</small></span><i aria-hidden="true">›</i></a>
}
