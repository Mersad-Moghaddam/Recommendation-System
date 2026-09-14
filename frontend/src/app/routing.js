export const PROTECTED_PAGES = new Set(['concierge', 'recommendations', 'ratings', 'tracker', 'profile', 'onboarding'])

export function readRoute() {
  const raw = window.location.hash.slice(1) || 'home'
  const [page, query = ''] = raw.split('?')
  return { page, params: new URLSearchParams(query) }
}

export function routeUrl(page, params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  })
  return `#${page}${query.size ? `?${query}` : ''}`
}

export function isModifiedClick(event) {
  return event && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
}
