import '@testing-library/jest-dom/vitest'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: query.includes('prefers-reduced-motion') ? false : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
Element.prototype.scrollIntoView = () => {}
window.requestAnimationFrame = (callback) => window.setTimeout(callback, 0)
window.cancelAnimationFrame = (id) => window.clearTimeout(id)
