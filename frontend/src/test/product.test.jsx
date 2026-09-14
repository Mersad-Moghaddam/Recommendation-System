import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MovieCard from '../components/MovieCard'
import App from '../App'
import { LocaleProvider } from '../locale'
import Concierge from '../pages/Concierge'
import Discover from '../pages/Discover'
import MovieDetails from '../pages/MovieDetails'
import Onboarding from '../pages/Onboarding'
import Recommendations from '../pages/Recommendations'
import Tracker from '../pages/Tracker'
import { api } from '../api'

vi.mock('../api', () => ({
  api: {
    quiz: vi.fn(),
    movies: vi.fn(),
    movieDetails: vi.fn(),
    similar: vi.fn(),
    onboarding: vi.fn(),
    rateBulk: vi.fn(),
    skipOnboarding: vi.fn(),
    recommendations: vi.fn(),
    library: vi.fn(),
    activity: vi.fn(),
    nextEpisode: vi.fn(),
    profileSummary: vi.fn(),
    me: vi.fn(),
    stats: vi.fn(),
    logout: vi.fn(),
    saveLibrary: vi.fn(),
    removeLibrary: vi.fn(),
  },
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  window.location.hash = ''
})

describe('product UI contracts', () => {
  it('renders the protected profile with persisted totals and account actions', async () => {
    api.me.mockResolvedValue({ user: { id: 8, username: 'viewer' }, onboarding_required: false })
    api.profileSummary.mockResolvedValue({
      movies_watched: 4, series_watched: 2, episodes_watched: 18,
      watchlist_count: 3, ratings_count: 9, active_series_count: 1,
    })
    window.location.hash = '#profile'
    window.scrollTo = vi.fn()
    render(<LocaleProvider><App /></LocaleProvider>)

    expect(await screen.findByRole('heading', { name: 'Your profile' })).toBeVisible()
    expect(screen.getByText('9 ratings')).toBeVisible()
    expect(screen.getByRole('link', { name: /My watch tracker/ })).toHaveAttribute('href', '/#tracker')
    expect(within(screen.getByRole('region', { name: 'Account' })).getByRole('button', { name: 'Sign out' })).toBeVisible()
  })

  it('marks English card summaries with an LTR direction', () => {
    render(
      <MovieCard
        movie={{
          id: 3,
          title: 'Arrival (2016)',
          display_title: 'Arrival',
          year: 2016,
          genres: ['Drama'],
          overview_short: 'A linguist tries to communicate with mysterious visitors.',
          overview_locale: 'en',
        }}
        index={0}
        onDetails={() => {}}
      />,
    )
    expect(screen.getByText(/A linguist/)).toHaveAttribute('dir', 'ltr')
    expect(screen.getByText('Arrival')).toBeVisible()
    expect(screen.getByRole('link', { name: /Arrival/ })).toHaveAttribute('href', '/#detail?id=3')
  })

  it('keeps surprise exclusive while allowing two ordered moods', () => {
    render(<Concierge user={{ id: 1 }} onRate={() => {}} onDetails={() => {}} />)
    const surprise = screen.getByRole('button', { name: 'Surprise me' })
    fireEvent.click(surprise)
    expect(surprise).toHaveAttribute('aria-pressed', 'true')
    const thoughtful = screen.getByRole('button', { name: 'Thoughtful' })
    fireEvent.click(thoughtful)
    expect(thoughtful).toHaveAttribute('aria-pressed', 'true')
    expect(surprise).toHaveAttribute('aria-pressed', 'false')
    const emotional = screen.getByRole('button', { name: 'Emotional' })
    fireEvent.click(emotional)
    expect(thoughtful).toHaveAttribute('aria-pressed', 'true')
    expect(emotional).toHaveAttribute('aria-pressed', 'true')
  })

  it('saves exactly three onboarding ratings before continuing', async () => {
    const movies = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      movie_id: index + 1,
      title: `Movie ${index + 1} (2020)`,
      display_title: `Movie ${index + 1}`,
      year: 2020,
      genres: ['Drama'],
      overview_short: 'A spoiler-free summary.',
    }))
    api.onboarding.mockResolvedValue(movies)
    api.rateBulk.mockResolvedValue({ onboarding_complete: true })
    const navigate = vi.fn()
    render(<Onboarding navigate={navigate} next="concierge" />)
    const cards = await screen.findAllByRole('article')
    for (const card of cards.slice(0, 3)) {
      fireEvent.click(within(card).getByRole('button', { name: '5 out of 5 stars' }))
    }
    fireEvent.click(screen.getByRole('button', { name: /Save and continue/ }))
    await waitFor(() => expect(api.rateBulk).toHaveBeenCalledOnce())
    expect(api.rateBulk.mock.calls[0][0]).toHaveLength(3)
    expect(navigate).toHaveBeenCalledWith('concierge')
  })

  it('lets users revise onboarding choices after reaching the limit', async () => {
    const movies = Array.from({ length: 4 }, (_, index) => ({
      id: index + 1,
      title: `Movie ${index + 1} (2020)`,
      display_title: `Movie ${index + 1}`,
      genres: ['Drama'],
    }))
    api.onboarding.mockResolvedValue(movies)
    render(<Onboarding navigate={() => {}} next="concierge" />)
    const cards = await screen.findAllByRole('article')
    for (const card of cards.slice(0, 3)) {
      fireEvent.click(within(card).getByRole('button', { name: '5 out of 5 stars' }))
    }

    expect(within(cards[3]).getByRole('button', { name: '5 out of 5 stars' })).toBeDisabled()
    fireEvent.click(within(cards[0]).getByRole('button', { name: '5 out of 5 stars' }))
    expect(within(cards[3]).getByRole('button', { name: '5 out of 5 stars' })).toBeEnabled()
  })

  it('sanitizes invalid discover pages before requesting movies', async () => {
    api.movies.mockResolvedValue([])
    render(
      <Discover
        user={null}
        onRate={() => {}}
        onDetails={() => {}}
        params={new URLSearchParams('page=-4')}
        replaceParams={() => {}}
      />,
    )

    await waitFor(() => expect(api.movies).toHaveBeenCalled())
    expect(api.movies.mock.calls[0][0].skip).toBe(0)
  })

  it('clears both the visible and committed discover search', async () => {
    api.movies.mockResolvedValue([])
    const replaceParams = vi.fn()
    render(
      <Discover
        user={null}
        onRate={() => {}}
        onDetails={() => {}}
        params={new URLSearchParams('q=Arrival')}
        replaceParams={replaceParams}
      />,
    )

    const searchInput = screen.getByRole('textbox', { name: 'Search movies' })
    expect(searchInput).toHaveValue('Arrival')
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(searchInput).toHaveValue('')
    await waitFor(() => expect(replaceParams).toHaveBeenCalledWith(expect.objectContaining({ q: undefined, page: undefined })))
  })

  it('applies mobile discovery filters without dropping the current query fields', async () => {
    api.movies.mockResolvedValue([])
    const replaceParams = vi.fn()
    render(
      <Discover
        user={null}
        onRate={() => {}}
        onDetails={() => {}}
        params={new URLSearchParams('q=Arrival&type=serial&page=2')}
        replaceParams={replaceParams}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    const sheet = screen.getByRole('dialog', { name: 'Filters' })
    expect(sheet).toBeVisible()
    fireEvent.change(within(sheet).getByRole('combobox', { name: 'Genre filter' }), { target: { value: 'Drama' } })
    fireEvent.click(within(sheet).getByRole('button', { name: 'Apply filters' }))

    await waitFor(() => expect(replaceParams).toHaveBeenCalledWith({
      q: 'Arrival', genre: 'Drama', iranian: undefined, page: undefined, type: 'serial',
    }))
  })

  it('applies desktop discovery filters immediately', async () => {
    api.movies.mockResolvedValue([])
    const replaceParams = vi.fn()
    render(
      <Discover
        user={null}
        onRate={() => {}}
        onDetails={() => {}}
        params={new URLSearchParams('q=Arrival')}
        replaceParams={replaceParams}
      />,
    )

    fireEvent.change(screen.getByRole('combobox', { name: 'Genre filter' }), { target: { value: 'Drama' } })

    await waitFor(() => expect(replaceParams).toHaveBeenCalledWith({
      q: 'Arrival', genre: 'Drama', iranian: undefined, page: undefined, type: undefined,
    }))
  })

  it('never displays a detail seed belonging to another movie', async () => {
    api.movieDetails.mockRejectedValue(new Error('جزئیات پیدا نشد'))
    api.similar.mockResolvedValue([])
    render(
      <MovieDetails
        id="1"
        seed={{ id: 2, title: 'Wrong Movie (2020)', genres: ['Drama'] }}
        user={null}
        onRate={() => {}}
        onDetails={() => {}}
        goBack={() => {}}
      />,
    )

    expect(screen.queryByText('Wrong Movie')).not.toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent('جزئیات پیدا نشد')
  })

  it('marks the next series episode from its detail page and displays returned progress', async () => {
    api.movieDetails.mockResolvedValue({
      id: 20, title: 'Dark (2017)', display_title: 'Dark', media_type: 'serial', genres: ['Drama'], overview: 'A mystery.',
    })
    api.similar.mockResolvedValue([])
    api.library.mockResolvedValue([{ movie_id: 20, status: 'watching', current_season: 1, current_episode: 2, watched_episodes: 2, remaining_episodes: 24, progress_percent: 8 }])
    api.nextEpisode.mockResolvedValue({ movie_id: 20, status: 'watching', current_season: 1, current_episode: 3, watched_episodes: 3, remaining_episodes: 23, progress_percent: 12 })
    const onTrack = vi.fn()
    render(<MovieDetails id="20" user={{ id: 1 }} onRate={() => {}} onDetails={() => {}} onTrack={onTrack} goBack={() => {}} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Mark next episode watched' }))

    await waitFor(() => expect(api.nextEpisode).toHaveBeenCalledWith(20, expect.any(String)))
    expect(onTrack).not.toHaveBeenCalled()
    expect(within(screen.getByText('Total episodes watched').closest('div')).getByText('3')).toBeVisible()
    expect(screen.getByText('23')).toBeVisible()
  })

  it('shows persisted series progress before a new detail mutation', async () => {
    api.movieDetails.mockResolvedValue({ id: 20, title: 'Dark (2017)', display_title: 'Dark', media_type: 'serial', genres: ['Drama'], overview: 'A mystery.' })
    api.similar.mockResolvedValue([])
    api.library.mockResolvedValue([{ movie_id: 20, status: 'watching', current_season: 2, current_episode: 3, watched_episodes: 13, remaining_episodes: 13, progress_percent: 50 }])

    render(<MovieDetails id="20" user={{ id: 1 }} onRate={() => {}} onDetails={() => {}} onTrack={() => {}} goBack={() => {}} />)

    expect(await screen.findByText('Current status')).toBeVisible()
    expect(screen.getByText('50%')).toBeVisible()
    expect(api.nextEpisode).not.toHaveBeenCalled()
  })

  it('does not advance a series episode when tracking redirects a guest to sign in', async () => {
    api.movieDetails.mockResolvedValue({
      id: 20, title: 'Dark (2017)', display_title: 'Dark', media_type: 'serial', genres: ['Drama'], overview: 'A mystery.',
    })
    api.similar.mockResolvedValue([])
    const onTrack = vi.fn().mockResolvedValue(false)
    render(<MovieDetails id="20" user={null} onRate={() => {}} onDetails={() => {}} onTrack={onTrack} goBack={() => {}} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Mark next episode watched' }))

    await waitFor(() => expect(onTrack).toHaveBeenCalledWith(expect.objectContaining({ id: 20 }), 'watching'))
    expect(api.nextEpisode).not.toHaveBeenCalled()
  })

  it('renders a GitHub-style viewing grid and series remainder', async () => {
    api.library.mockResolvedValue([{
      entry_id: 1, movie_id: 20, id: 20, display_title: 'Dark', title: 'Dark (2017)',
      genres: ['Drama'], media_type: 'serial', status: 'watching', current_season: 2,
      current_episode: 3, watched_episodes: 13, total_episodes: 26,
      remaining_episodes: 13, progress_percent: 50,
    }])
    api.activity.mockResolvedValue({
      days: [
        { date: '2026-09-11', count: 0, level: 0 },
        { date: '2026-09-12', count: 2, level: 2 },
        { date: '2026-09-13', count: 5, level: 4 },
      ],
      total_units: 7, active_days: 2, current_streak: 2, longest_streak: 2,
    })
    render(<Tracker user={{ username: 'viewer' }} navigate={() => {}} onDetails={() => {}} showError={() => {}} />)
    expect(await screen.findByText('Dark')).toBeVisible()
    expect(screen.getByText(/13 episodes remaining/)).toBeVisible()
    expect(screen.getByRole('region', { name: /Watch activity chart/ })).toBeVisible()
    expect(document.querySelectorAll('.heatmap .activity-cell')).toHaveLength(3)
    expect(document.querySelector('.heatmap .level-4')).toBeInTheDocument()
  })

  it('submits season, episode and total watched episode progress', async () => {
    const entry = {
      entry_id: 1, movie_id: 20, id: 20, display_title: 'Dark', title: 'Dark (2017)',
      genres: ['Drama'], media_type: 'serial', status: 'watching', current_season: 1,
      current_episode: 2, watched_episodes: 2, total_seasons: 3, total_episodes: 26,
      remaining_episodes: 24, progress_percent: 8,
    }
    api.library.mockResolvedValue([entry])
    api.activity.mockResolvedValue({ days: [], total_units: 2, active_days: 1, current_streak: 1, longest_streak: 1 })
    api.saveLibrary.mockResolvedValue({ ...entry, current_season: 2, current_episode: 4, watched_episodes: 12 })
    render(<Tracker user={{ username: 'viewer' }} navigate={() => {}} onDetails={() => {}} showError={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Update progress' }))
    const fields = screen.getAllByRole('spinbutton')
    fireEvent.change(fields[0], { target: { value: '2' } })
    fireEvent.change(fields[1], { target: { value: '4' } })
    fireEvent.change(fields[2], { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save progress' }))
    await waitFor(() => expect(api.saveLibrary).toHaveBeenCalledWith(20, expect.objectContaining({
      status: 'watching', current_season: 2, current_episode: 4, watched_episodes: 12,
    })))
  })

  it('marks the next series episode watched and exposes selected heatmap day details', async () => {
    const entry = {
      entry_id: 1, movie_id: 20, id: 20, display_title: 'Dark', title: 'Dark (2017)',
      genres: ['Drama'], media_type: 'serial', status: 'watching', current_season: 1,
      current_episode: 2, watched_episodes: 2, total_seasons: 3, total_episodes: 26,
      remaining_episodes: 24, progress_percent: 8,
    }
    api.library.mockResolvedValue([entry])
    api.activity.mockResolvedValue({
      days: [{ date: '2026-09-12', count: 2, level: 2 }],
      total_units: 2, active_days: 1, current_streak: 1, longest_streak: 1,
    })
    api.nextEpisode.mockResolvedValue({ ...entry, current_episode: 3, watched_episodes: 3, remaining_episodes: 23, progress_percent: 12 })
    render(<Tracker user={{ username: 'viewer' }} navigate={() => {}} onDetails={() => {}} showError={() => {}} />)

    const day = await screen.findByRole('button', { name: '2026-09-12: 2 watches' })
    fireEvent.click(day)
    expect(screen.getByText('2026-09-12: 2 watches')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Mark next episode watched' }))
    await waitFor(() => expect(api.nextEpisode).toHaveBeenCalledWith(20, expect.any(String)))
    expect(screen.getByText(/23 episodes remaining/)).toBeVisible()
  })

  it('does not clear recommendations when the active filters are clicked again', async () => {
    api.recommendations.mockResolvedValue([])
    render(<Recommendations user={{ username: 'viewer' }} onRate={() => {}} onDetails={() => {}} onTrack={() => {}} params={new URLSearchParams()} changeRoute={() => {}} />)
    await waitFor(() => expect(api.recommendations).toHaveBeenCalledOnce())

    fireEvent.click(screen.getByRole('button', { name: 'Movie picks' }))
    fireEvent.click(screen.getByRole('button', { name: 'Balanced' }))

    expect(api.recommendations).toHaveBeenCalledOnce()
  })

  it('writes recommendation media and mode choices to hash route state', async () => {
    api.recommendations.mockResolvedValue([])
    const changeRoute = vi.fn()
    render(<Recommendations user={{ username: 'viewer' }} onRate={() => {}} onDetails={() => {}} onTrack={() => {}} params={new URLSearchParams('type=serial')} changeRoute={changeRoute} />)
    await waitFor(() => expect(api.recommendations).toHaveBeenCalledWith('balanced', 'serial'))

    fireEvent.click(screen.getByRole('button', { name: 'Explore more' }))
    expect(changeRoute).toHaveBeenCalledWith('recommendations', { mode: 'explore', type: 'serial' })
  })

  it('confirms removal before deleting a tracker entry', async () => {
    const entry = {
      entry_id: 1, movie_id: 20, id: 20, display_title: 'Dark', title: 'Dark (2017)',
      genres: ['Drama'], media_type: 'serial', status: 'watching', current_season: 2,
      current_episode: 3, watched_episodes: 13, total_episodes: 26,
      remaining_episodes: 13, progress_percent: 50,
    }
    api.library.mockResolvedValue([entry])
    api.activity.mockResolvedValue({ days: [], total_units: 13, active_days: 1, current_streak: 1, longest_streak: 1 })
    api.removeLibrary.mockResolvedValue(null)
    render(<Tracker user={{ username: 'viewer' }} navigate={() => {}} onDetails={() => {}} showError={() => {}} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Remove from tracker' }))
    expect(api.removeLibrary).not.toHaveBeenCalled()
    expect(screen.getByText('Remove “Dark” from your watch tracker?')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Remove title' }))

    await waitFor(() => expect(api.removeLibrary).toHaveBeenCalledWith(20))
  })
})
