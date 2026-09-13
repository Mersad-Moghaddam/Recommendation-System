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

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { user: null, onboarding_required: false } }))
  await page.route('**/api/stats', (route) => route.fulfill({ json: { movies: 87903, serials: 9200, ratings: 100839, users: 0, persian_movies: 30 } }))
  await page.route('**/api/movies?**', (route) => route.fulfill({ json: movies.slice(0, 6) }))
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
  await page.getByRole('button', { name: 'ساخت حساب' }).first().click()
  await page.getByLabel('نام کاربری').fill('nightviewer')
  await page.getByLabel('رمز عبور').fill('secret12')
  await page.getByRole('button', { name: 'ساخت حساب' }).last().click()
  await expect(page).toHaveURL(/#onboarding/)
  const cards = page.locator('.onboarding-movie')
  for (let index = 0; index < 3; index += 1) {
    await cards.nth(index).getByRole('button', { name: '5 از ۵ ستاره' }).click()
  }
  await page.getByRole('button', { name: /ذخیره و ادامه/ }).click()
  await expect(page).toHaveURL(/#concierge/)
  if ((page.viewportSize()?.width || 0) <= 900) {
    await expect(page.getByRole('button', { name: /خروج از حساب/ })).toBeVisible()
  }
})

test('English summaries retain direction and private APIs are never cached', async ({ page, context }) => {
  await page.goto('/#discover')
  await expect(page.getByText('A spoiler-free English overview.')).toHaveAttribute('dir', 'ltr')
  await context.setOffline(true)
  await page.evaluate(() => window.dispatchEvent(new Event('offline')))
  await expect(page.getByText(/آفلاین هستید/)).toBeVisible()
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
  const prompt = page.getByRole('button', { name: 'نصب سینمچ' })
  await expect(prompt).toBeVisible()
  const box = await prompt.boundingBox()
  expect(box.height).toBeLessThanOrEqual(44)
  expect(box.width).toBeLessThanOrEqual(120)
  expect(box.y).toBeLessThan(70)
  await expect(prompt.locator('svg')).toHaveCount(0)
  await expect(page.getByText('۸۷ هزار فیلم')).toHaveCount(0)
})

test('theme switch persists and every route fits the viewport', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/#home')
  await page.evaluate(() => localStorage.removeItem('cinematch-theme-v1'))
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  const themeButton = page.getByRole('button', { name: 'فعال‌کردن نمای تاریک' })
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
  await page.getByRole('button', { name: 'ورود' }).last().click()
  await expect(page.getByLabel('نام کاربری')).toBeFocused()
  await expect(page.getByLabel('نام کاربری')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText('نام کاربری را وارد کنید.')).toBeVisible()
  await expect(page.getByText('گذرواژه را وارد کنید.')).toBeVisible()
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
  await expect(page.getByRole('heading', { name: 'فعالیت تماشای یک سال اخیر' })).toBeVisible()
  await expect(page.getByText('۱۳ قسمت باقی مانده')).toBeVisible()
  await page.getByRole('button', { name: 'ثبت پیشرفت' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})
