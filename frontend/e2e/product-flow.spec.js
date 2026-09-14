import { expect, test } from '@playwright/test'

const movies = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  movie_id: index + 1,
  title: `Movie ${index + 1} (2020)`,
  display_title: `Movie ${index + 1}`,
  year: 2020,
  genres: ['Drama'],
  overview_short: index ? 'خلاصهٔ کوتاه بدون اسپویل' : 'A spoiler-free English overview.',
  overview_locale: index ? 'fa' : 'en',
  overview_source: 'tmdb',
  score: 0.8,
  reason: 'هماهنگ با حال‌وهوای امشب',
  reason_sources: ['mood'],
}))

test.beforeEach(async ({ context }) => {
  await context.route('**/api/auth/me', (route) => route.fulfill({ json: { user: null, onboarding_required: false } }))
  await context.route('**/api/stats', (route) => route.fulfill({ json: { movies: 87903, serials: 9200, ratings: 100839, users: 0, persian_movies: 30 } }))
  await context.route('**/api/movies?**', (route) => route.fulfill({ json: movies.slice(0, 6) }))
})

test('registration returns to onboarding and then concierge', async ({ page }) => {
  await page.route('**/api/auth/register', (route) => route.fulfill({
    status: 201,
    json: { user: { id: 700, username: 'nightviewer' }, onboarding_required: true },
  }))
  await page.route('**/api/onboarding/movies', (route) => route.fulfill({ json: movies }))
  await page.route('**/api/ratings/bulk', (route) => route.fulfill({ json: { ratings: [], onboarding_complete: true } }))
  await page.goto('/#concierge')
  await expect(page).toHaveURL(/#auth\?next=concierge/)
  await page.getByRole('button', { name: 'Create account' }).first().click()
  await page.getByLabel('Username').fill('nightviewer')
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill('secret12')
  await page.getByRole('button', { name: 'Create account' }).last().click()
  await expect(page).toHaveURL(/#onboarding/)
  const cards = page.locator('.onboarding-movie')
  for (let index = 0; index < 3; index += 1) {
    await cards.nth(index).getByRole('button', { name: '5 out of 5 stars' }).click()
  }
  await page.getByRole('button', { name: 'Save and continue' }).click()
  await expect(page).toHaveURL(/#concierge/)
  if ((page.viewportSize()?.width || 0) <= 900) {
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
  }
})

test('English summaries retain direction and private APIs are never cached', async ({ page, context }) => {
  await page.goto('/#discover')
  await expect(page.getByText('A spoiler-free English overview.')).toHaveAttribute('dir', 'ltr')
  await context.setOffline(true)
  await page.evaluate(() => window.dispatchEvent(new Event('offline')))
  await expect(page.getByText(/You are offline/)).toBeVisible()
  const privateEntries = await page.evaluate(async () => {
    const keys = await caches.keys()
    const requests = (await Promise.all(keys.map(async (key) => (await caches.open(key)).keys()))).flat()
    return requests.map((request) => request.url).filter((entry) => {
      const url = new URL(entry)
      return /^\/api\/(?:auth|ratings|users|recommendations)(?:\/|$)/.test(url.pathname)
    })
  })
  expect(privateEntries).toEqual([])
})

test('install prompt replaces the catalog count without an icon', async ({ page }) => {
  await page.goto('/#discover')
  await expect(page.getByText('A spoiler-free English overview.')).toBeVisible()
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true })
    event.prompt = async () => {}
    event.userChoice = Promise.resolve({ outcome: 'dismissed' })
    window.dispatchEvent(event)
  })
  const prompt = page.getByRole('button', { name: 'Install Cinematch' })
  await expect(prompt).toBeVisible()
  const box = await prompt.boundingBox()
  expect(box.height).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeLessThanOrEqual(60)
  expect(box.width).toBeLessThanOrEqual(128)
  expect(box.y).toBeLessThan(70)
  await expect(prompt.locator('svg')).toHaveCount(0)
  await expect(page.getByText('87 thousand movies')).toHaveCount(0)
})

test('theme switch persists and every route fits the viewport', async ({ page }) => {
  await page.goto('/#home')
  await page.evaluate(() => localStorage.removeItem('cinematch-theme-v1'))
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  const themeButton = page.getByRole('button', { name: 'Switch to dark theme' })
  await themeButton.click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  for (const route of ['home', 'discover', 'auth']) {
    await page.goto(`/#${route}`)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  }
})

test('authentication validation is inline, announced, and focuses the first error', async ({ page }) => {
  await page.goto('/#auth')
  await page.getByRole('button', { name: 'Sign in to Cinematch' }).click()
  await expect(page.getByLabel('Username')).toBeFocused()
  await expect(page.getByLabel('Username')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText('Enter your username.')).toBeVisible()
  await expect(page.getByText('Enter your password.')).toBeVisible()
})

test('Persian switches the document to RTL and persists across reload', async ({ page }) => {
  await page.goto('/#home')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  await page.getByRole('button', { name: 'Switch to Persian' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'fa')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.getByRole('link', { name: 'سینمچ، صفحهٔ اصلی' })).toBeVisible()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'fa')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
})

test('watch tracker keeps the yearly graph and series controls usable', async ({ page }) => {
  const activityStart = new Date('2025-09-08T12:00:00Z')
  const activityDays = Array.from({ length: 371 }, (_, index) => ({
    date: new Date(activityStart.getTime() + index * 86_400_000).toISOString().slice(0, 10),
    count: index % 6,
    level: Math.min(index % 6, 4),
  }))
  await page.unroute('**/api/auth/me')
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { user: { id: 8, username: 'viewer' }, onboarding_required: false } }))
  await page.route('**/api/users/me/library?**', (route) => route.fulfill({ json: [{
    entry_id: 1, movie_id: 80, id: 80, title: 'Dark (2017)', display_title: 'Dark', year: 2017,
    genres: ['Drama'], media_type: 'serial', total_seasons: 3, total_episodes: 26,
    status: 'watching', current_season: 2, current_episode: 3, watched_episodes: 13,
    remaining_episodes: 13, progress_percent: 50, updated_at: '2026-09-13T10:00:00',
  }] }))
  await page.route('**/api/users/me/activity?**', (route) => route.fulfill({ json: {
    days: activityDays,
    total_units: 190, active_days: 112, current_streak: 4, longest_streak: 11,
  } }))
  await page.goto('/#tracker')
  await expect(page.getByRole('heading', { name: 'Watching activity over the last year' })).toBeVisible()
  await expect(page.getByText('13 episodes remaining')).toBeVisible()
  await page.getByRole('button', { name: 'Update progress' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})

test('series detail loads persisted progress and advances only once per action', async ({ page }) => {
  await page.unroute('**/api/auth/me')
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { user: { id: 8, username: 'viewer' }, onboarding_required: false } }))
  await page.route('**/api/movies/80/details', (route) => route.fulfill({ json: {
    id: 80, title: 'Dark (2017)', display_title: 'Dark', year: 2017, genres: ['Drama'], media_type: 'serial',
    total_seasons: 3, total_episodes: 26, overview: 'A mystery unfolds across generations.', overview_locale: 'en',
    rating_average: 4.4, rating_count: 100, source: 'tmdb', experience: 'Tense', best_for: 'Mystery fans', community_note: 'Highly rated', data_note: 'TMDB',
  } }))
  await page.route('**/api/movies/80/similar?**', (route) => route.fulfill({ json: [] }))
  await page.route('**/api/users/me/library?**', (route) => route.fulfill({ json: [{
    entry_id: 1, movie_id: 80, id: 80, title: 'Dark (2017)', display_title: 'Dark', year: 2017,
    genres: ['Drama'], media_type: 'serial', total_seasons: 3, total_episodes: 26,
    status: 'watching', current_season: 2, current_episode: 3, watched_episodes: 13,
    remaining_episodes: 13, progress_percent: 50, updated_at: '2026-09-13T10:00:00',
  }] }))
  let advances = 0
  await page.route('**/api/users/me/library/80/next-episode', async (route) => {
    advances += 1
    expect(route.request().headers()['x-idempotency-key']).toBeTruthy()
    await route.fulfill({ json: {
      entry_id: 1, movie_id: 80, id: 80, title: 'Dark (2017)', display_title: 'Dark', year: 2017,
      genres: ['Drama'], media_type: 'serial', total_seasons: 3, total_episodes: 26,
      status: 'watching', current_season: 2, current_episode: 4, watched_episodes: 14,
      remaining_episodes: 12, progress_percent: 54, updated_at: '2026-09-14T10:00:00',
    } })
  })
  await page.goto('/#detail?id=80&from=discover')
  await expect(page.getByText('Current status')).toBeVisible()
  await expect(page.getByText('50%')).toBeVisible()
  const next = page.getByRole('button', { name: 'Mark next episode watched' })
  await next.evaluate((button) => { button.click(); button.click() })
  await expect(page.getByText('54%')).toBeVisible()
  expect(advances).toBe(1)
})

test('recommendation choices persist in hash navigation state', async ({ page }) => {
  await page.unroute('**/api/auth/me')
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { user: { id: 8, username: 'viewer' }, onboarding_required: false } }))
  await page.route('**/api/recommendations/me?**', (route) => route.fulfill({ json: [] }))
  await page.goto('/#recommendations')
  await page.getByRole('button', { name: 'Series picks' }).click()
  await expect(page).toHaveURL(/#recommendations\?type=serial/)
  await page.getByRole('button', { name: 'Explore more' }).click()
  await expect(page).toHaveURL(/#recommendations\?mode=explore&type=serial/)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Series picks' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Explore more' })).toHaveAttribute('aria-pressed', 'true')
})
