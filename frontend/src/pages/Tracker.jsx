import { useEffect, useMemo, useState } from 'react'
import { ArrowUpLeft, BookmarkSimple, CheckCircle, FilmReel, PlayCircle, Trash } from '@phosphor-icons/react'
import { api } from '../api'
import { CardArtwork } from '../components/MovieArtwork'
import { Dialog, Empty, ErrorMessage, Hero, PageLoading, SectionTitle, SpinnerLabel } from '../components/UI'
import { COPY } from '../constants/copy'
import { faNumber, formatMonth, genreFa } from '../utils'
import { announceDataChange, createMutationId, useDataRevision } from '../app/dataChanges'

const EMPTY_ACTIVITY = { days: [], total_units: 0, active_days: 0, current_streak: 0, longest_streak: 0 }

export default function Tracker({ user, navigate, onDetails, showError }) {
  const [entries, setEntries] = useState([])
  const [activity, setActivity] = useState(EMPTY_ACTIVITY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [pendingRemoval, setPendingRemoval] = useState(null)
  const [removeBusy, setRemoveBusy] = useState(false)
  const [episodeBusy, setEpisodeBusy] = useState(null)
  const [notice, setNotice] = useState('')
  const dataRevision = useDataRevision('library', 'activity')

  useEffect(() => {
    let active = true
    Promise.all([api.library(), api.activity()])
      .then(([library, viewing]) => {
        if (!active) return
        setEntries(library)
        setActivity(viewing)
      })
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [dataRevision])
  const groups = useMemo(() => entries.reduce((result, entry) => {
    const bucket = result[entry.status] || []
    result[entry.status] = [...bucket, entry]
    return result
  }, {}), [entries])

  const updateEntry = async (entry, payload) => {
    try {
      const updated = await api.saveLibrary(entry.movie_id, payload)
      setEntries((current) => current.map((item) => item.movie_id === updated.movie_id ? updated : item))
      setEditing(null)
      setNotice(COPY.tracker.noticeSaved)
      setActivity(await api.activity())
      announceDataChange('library', 'activity', 'profile', 'detail')
    } catch (requestError) {
      showError(requestError)
    }
  }
  const removeEntry = async () => {
    if (!pendingRemoval) return
    setRemoveBusy(true)
    try {
      await api.removeLibrary(pendingRemoval.movie_id)
      setEntries((current) => current.filter((item) => item.movie_id !== pendingRemoval.movie_id))
      setNotice(COPY.tracker.noticeRemoved)
      setPendingRemoval(null)
      announceDataChange('library', 'profile', 'detail')
    } catch (requestError) {
      showError(requestError)
    } finally {
      setRemoveBusy(false)
    }
  }
  const markNextEpisode = async (entry) => {
    setEpisodeBusy(entry.movie_id)
    try {
      const updated = await api.nextEpisode(entry.movie_id, createMutationId())
      setEntries((current) => current.map((item) => item.movie_id === updated.movie_id ? updated : item))
      setActivity(await api.activity())
      setNotice(COPY.tracker.noticeEpisodeWatched)
      announceDataChange('library', 'activity', 'profile', 'detail')
    } catch (requestError) {
      showError(requestError)
    } finally {
      setEpisodeBusy(null)
    }
  }

  if (loading) return <PageLoading />
  return (
    <>
      <Hero className="compact-hero tracker-hero" eyebrow={COPY.tracker.eyebrow(user.username)} title={<>{COPY.tracker.titleStart}<br /><em>{COPY.tracker.titleAccent}</em></>} description={COPY.tracker.description}>
        <a className="button ghost" href="/#ratings" onClick={(event) => navigate('ratings', event)}>{COPY.tracker.ratingsAction}</a>
      </Hero>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      <p className="sr-only" aria-live="polite">{notice}</p>
      <ActivityPanel activity={activity} />
      <LibrarySection status="watching" title={COPY.tracker.watching} entries={groups.watching || []} empty={COPY.tracker.emptyWatching} navigate={navigate} onDetails={onDetails} onEdit={setEditing} onRemove={setPendingRemoval} onUpdate={updateEntry} onNextEpisode={markNextEpisode} episodeBusy={episodeBusy} />
      <LibrarySection status="watchlist" title={COPY.tracker.watchlist} entries={groups.watchlist || []} empty={COPY.tracker.emptyWatchlist} navigate={navigate} onDetails={onDetails} onEdit={setEditing} onRemove={setPendingRemoval} onUpdate={updateEntry} />
      <LibrarySection status="completed" title={COPY.tracker.completed} entries={groups.completed || []} empty={COPY.tracker.emptyCompleted} navigate={navigate} onDetails={onDetails} onEdit={setEditing} onRemove={setPendingRemoval} onUpdate={updateEntry} />
      {editing ? <ProgressDialog entry={editing} onClose={() => setEditing(null)} onSave={(payload) => updateEntry(editing, payload)} /> : null}
      {pendingRemoval ? <RemovalDialog entry={pendingRemoval} busy={removeBusy} onClose={() => { if (!removeBusy) setPendingRemoval(null) }} onConfirm={removeEntry} /> : null}
    </>
  )
}

function ActivityPanel({ activity }) {
  const [selectedDay, setSelectedDay] = useState(() => activity.days.find((day) => day.count > 0) || activity.days.at(-1) || null)
  const months = activity.days.reduce((labels, day, index) => {
    if (index % 7 !== 0) return labels
    const date = new Date(`${day.date}T12:00:00`)
    const month = formatMonth(date)
    if (labels.at(-1)?.month !== month) labels.push({ month, week: Math.floor(index / 7) + 1 })
    return labels
  }, [])
  return (
    <section className="activity-panel" aria-labelledby="activity-title">
      <div className="activity-heading"><div><h2 id="activity-title">{COPY.tracker.activityTitle}</h2><p>{COPY.tracker.activityHint}</p></div><ActivityLegend /></div>
      <div className="heatmap-scroll" role="region" aria-label={COPY.tracker.activityScrollLabel} tabIndex="0">
        <div className="heatmap-chart" aria-label={`${COPY.tracker.activityTitle}: ${COPY.tracker.activityAria(faNumber(activity.total_units), faNumber(activity.active_days))}`}>
          <div className="heatmap-months" aria-hidden="true">{months.map((label) => <span key={`${label.week}-${label.month}`} style={{ gridColumnStart: label.week }}>{label.month}</span>)}</div>
          <div className="heatmap-weekdays" aria-hidden="true">{COPY.tracker.weekdays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
          <div className="heatmap">
            {activity.days.map((day) => {
              const label = COPY.tracker.activityLabel(day.date, faNumber(day.count))
              return <button type="button" key={day.date} className={`activity-cell level-${day.level}`} aria-label={label} title={label} aria-pressed={selectedDay?.date === day.date} onClick={() => setSelectedDay(day)} />
            })}
          </div>
        </div>
      </div>
      {selectedDay ? <p className="activity-detail" aria-live="polite">{COPY.tracker.activityLabel(selectedDay.date, faNumber(selectedDay.count))}</p> : null}
      <dl className="activity-stats">
        <Stat value={activity.total_units} label={COPY.tracker.totalUnits} />
        <Stat value={activity.active_days} label={COPY.tracker.activeDays} />
        <Stat value={activity.current_streak} label={COPY.tracker.currentStreak} />
        <Stat value={activity.longest_streak} label={COPY.tracker.longestStreak} />
      </dl>
    </section>
  )
}

function ActivityLegend() {
  return <div className="activity-legend" aria-hidden="true"><span>{COPY.tracker.less}</span>{[0, 1, 2, 3, 4].map((level) => <i key={level} className={`activity-cell level-${level}`} />)}<span>{COPY.tracker.more}</span></div>
}

function Stat({ value, label }) {
  return <div><dt>{label}</dt><dd>{faNumber(value)}</dd></div>
}

function LibrarySection({ status, title, entries, empty, navigate, onDetails, onEdit, onRemove, onUpdate, onNextEpisode, episodeBusy }) {
  const Icon = status === 'watchlist' ? BookmarkSimple : status === 'watching' ? PlayCircle : CheckCircle
  return (
    <section className="library-section">
      <SectionTitle eyebrow={<><Icon aria-hidden="true" />{COPY.tracker.titleCount(faNumber(entries.length))}</>} title={title} />
      {entries.length ? <div className="library-list">{entries.map((entry) => <LibraryRow key={entry.entry_id} entry={entry} onDetails={onDetails} onEdit={onEdit} onRemove={onRemove} onUpdate={onUpdate} onNextEpisode={onNextEpisode} episodeBusy={episodeBusy === entry.movie_id} />)}</div> : <Empty title={empty} text={COPY.tracker.emptyText} />}
      {!entries.length ? <a className="button secondary empty-action" href="/#discover" onClick={(event) => navigate('discover', event)}>{COPY.tracker.findTitles}<ArrowUpLeft aria-hidden="true" /></a> : null}
    </section>
  )
}

function LibraryRow({ entry, onDetails, onEdit, onRemove, onUpdate, onNextEpisode, episodeBusy }) {
  const serial = entry.media_type === 'serial'
  return (
    <article className="library-row">
      <button type="button" className="library-artwork" onClick={(event) => onDetails(entry, event)} aria-label={COPY.tracker.detailsAria(entry.display_title)}><CardArtwork movie={entry} index={0} /></button>
      <div className="library-copy">
        <span className="genre-row"><span className="media-badge">{serial ? COPY.card.serial : COPY.card.movie}</span>{entry.genres.slice(0, 2).map((genre) => <span key={genre}>{genreFa(genre)}</span>)}</span>
        <button type="button" className="library-title" onClick={(event) => onDetails(entry, event)}>{entry.display_title}</button>
        {serial && entry.status !== 'watchlist' ? <><div className="progress-track" aria-label={COPY.tracker.progress(faNumber(entry.progress_percent))}><i style={{ width: `${entry.progress_percent}%` }} /></div><p>{COPY.tracker.progress(faNumber(entry.progress_percent))} · {entry.remaining_episodes == null ? COPY.tracker.unknownRemaining : COPY.tracker.remaining(faNumber(entry.remaining_episodes))}</p></> : null}
      </div>
      <div className="library-actions">
        {serial ? <button type="button" onClick={() => onEdit(entry)}><PlayCircle aria-hidden="true" />{COPY.tracker.updateProgress}</button> : null}
        {serial && entry.status === 'watching' ? <button type="button" disabled={episodeBusy} onClick={() => onNextEpisode(entry)}><CheckCircle aria-hidden="true" />{episodeBusy ? COPY.tracker.saving : COPY.tracker.nextEpisode}</button> : null}
        {entry.status === 'watchlist' ? <button type="button" onClick={() => serial ? onEdit(entry) : onUpdate(entry, { status: 'completed', watched_episodes: 1 })}><CheckCircle aria-hidden="true" />{serial ? COPY.card.trackSerial : COPY.card.watched}</button> : null}
        <button type="button" className="danger-quiet" onClick={() => onRemove(entry)}><Trash aria-hidden="true" />{COPY.tracker.remove}</button>
      </div>
    </article>
  )
}

function ProgressDialog({ entry, onClose, onSave }) {
  const [form, setForm] = useState({
    current_season: entry.current_season || 1,
    current_episode: entry.current_episode || 1,
    watched_episodes: entry.watched_episodes || 0,
    status: entry.status === 'watchlist' ? 'watching' : entry.status,
  })
  const [busy, setBusy] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      await onSave({ ...form, current_season: Number(form.current_season), current_episode: Number(form.current_episode), watched_episodes: Number(form.watched_episodes) })
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog title={`${COPY.tracker.progressTitle} «${entry.display_title}»`} onClose={onClose}>
      <form className="progress-form" onSubmit={submit} noValidate>
        <div className="progress-form-grid">
          <label><span>{COPY.tracker.season}</span><input type="number" min="1" max={entry.total_seasons || undefined} required value={form.current_season} onChange={(event) => setForm({ ...form, current_season: event.target.value })} /></label>
          <label><span>{COPY.tracker.episode}</span><input type="number" min="1" required value={form.current_episode} onChange={(event) => setForm({ ...form, current_episode: event.target.value })} /></label>
        </div>
        <label><span>{COPY.tracker.watchedEpisodes}</span><input type="number" min="0" max={entry.total_episodes || undefined} required value={form.watched_episodes} onChange={(event) => setForm({ ...form, watched_episodes: event.target.value })} /></label>
        <div className="segmented" aria-label={COPY.tracker.serialStatus}><button type="button" aria-pressed={form.status === 'watching'} className={form.status === 'watching' ? 'selected' : ''} onClick={() => setForm({ ...form, status: 'watching' })}>{COPY.tracker.watching}</button><button type="button" aria-pressed={form.status === 'completed'} className={form.status === 'completed' ? 'selected' : ''} onClick={() => setForm({ ...form, status: 'completed' })}>{COPY.tracker.completed}</button></div>
        <button type="submit" className="button primary large" disabled={busy}>{busy ? <SpinnerLabel>{COPY.tracker.saving}</SpinnerLabel> : COPY.tracker.saveProgress}</button>
      </form>
    </Dialog>
  )
}

function RemovalDialog({ entry, busy, onClose, onConfirm }) {
  return (
    <Dialog title={COPY.tracker.removeTitle} onClose={onClose} className="confirm-dialog">
      <div className="confirm-copy">
        <p>{COPY.tracker.removePrompt(entry.display_title)}</p>
        <small>{COPY.tracker.removeHint}</small>
      </div>
      <div className="confirm-actions">
        <button type="button" className="button secondary" disabled={busy} onClick={onClose}>{COPY.common.cancel}</button>
        <button type="button" className="button danger" disabled={busy} onClick={onConfirm}>
          {busy ? <SpinnerLabel>{COPY.tracker.removing}</SpinnerLabel> : COPY.tracker.removeConfirm}
        </button>
      </div>
    </Dialog>
  )
}
