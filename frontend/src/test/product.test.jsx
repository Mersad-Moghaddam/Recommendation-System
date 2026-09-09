import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MovieCard from '../components/MovieCard'
import Concierge from '../pages/Concierge'
import Discover from '../pages/Discover'
import MovieDetails from '../pages/MovieDetails'
import Onboarding from '../pages/Onboarding'
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
  },
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('product UI contracts', () => {
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
    const surprise = screen.getByRole('button', { name: 'غافلگیرم کن' })
    fireEvent.click(surprise)
    expect(surprise).toHaveAttribute('aria-pressed', 'true')
    const thoughtful = screen.getByRole('button', { name: 'فکری' })
    fireEvent.click(thoughtful)
    expect(thoughtful).toHaveAttribute('aria-pressed', 'true')
    expect(surprise).toHaveAttribute('aria-pressed', 'false')
    const emotional = screen.getByRole('button', { name: 'احساسی' })
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
      overview_short: 'خلاصهٔ بدون اسپویل',
    }))
    api.onboarding.mockResolvedValue(movies)
    api.rateBulk.mockResolvedValue({ onboarding_complete: true })
    const navigate = vi.fn()
    render(<Onboarding navigate={navigate} next="concierge" />)
    const cards = await screen.findAllByRole('article')
    for (const card of cards.slice(0, 3)) {
      fireEvent.click(within(card).getByRole('button', { name: '5 از ۵ ستاره' }))
    }
    fireEvent.click(screen.getByRole('button', { name: /ذخیره و ادامه/ }))
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
      fireEvent.click(within(card).getByRole('button', { name: '5 از ۵ ستاره' }))
    }

    expect(within(cards[3]).getByRole('button', { name: '5 از ۵ ستاره' })).toBeDisabled()
    fireEvent.click(within(cards[0]).getByRole('button', { name: '5 از ۵ ستاره' }))
    expect(within(cards[3]).getByRole('button', { name: '5 از ۵ ستاره' })).toBeEnabled()
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
})
