import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'FAMS — Falcon Academic Management System',
        short_name: 'FAMS',
        description: 'Tablet-optimised attendance + offline-capable PRD §9.1 PWA.',
        theme_color: '#0F1B2D',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /\/api\/v1\/students.*/,
            handler: 'NetworkFirst',
            options: { cacheName: 'fams-students', networkTimeoutSeconds: 5 },
          },
          {
            urlPattern: /\/api\/v1\/campuses.*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'fams-campuses' },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    // HMR must use the same port as the dev server. Overriding to a different
    // port (e.g., 5173) causes the HMR WebSocket client to connect to a port
    // nothing listens on, triggering endless reconnect loops and "duplicated
    // frontend instance" warnings in the browser console.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/hubs': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
