import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'fonts/*.woff2', 'images/shabnama-hero.webp'],
      manifest: {
        name: 'سینمچ — پیشنهاد هوشمند فیلم',
        short_name: 'سینمچ',
        description: 'پیشنهاد فیلم توضیح‌پذیر برای حال‌وهوای امشب',
        lang: 'fa',
        dir: 'rtl',
        start_url: '/#home',
        scope: '/',
        display: 'standalone',
        background_color: '#F4F0E7',
        theme_color: '#10172A',
        categories: ['entertainment', 'lifestyle'],
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'کشف فیلم', short_name: 'کشف', url: '/#discover', icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }] },
          { name: 'پیشنهاد امشب', short_name: 'پیشنهاد', url: '/#concierge', icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,webp}'],
        runtimeCaching: [{
          urlPattern: ({ request, url }) => request.method === 'GET'
            && url.origin === self.location.origin
            && (/^\/api\/stats$/.test(url.pathname) || /^\/api\/movies(?:\/\d+(?:\/details|\/similar)?)?$/.test(url.pathname)),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'cinematch-public-api-v2',
            networkTimeoutSeconds: 3,
            expiration: { maxEntries: 36, maxAgeSeconds: 60 * 60 * 24 * 3 },
            cacheableResponse: { statuses: [0, 200] },
          },
        }],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:8000', '/health': 'http://127.0.0.1:8000' },
  },
  preview: { port: 4173 },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
