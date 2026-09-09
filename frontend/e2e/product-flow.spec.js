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
  await page.route('**/api/stats', (route) => route.fulfill({ json: { movies: 87903, ratings: 100839, users: 0, persian_movies: 30 } }))
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
