/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Pollen Tracker',
        short_name: 'PollenTracker',
        description: 'Personalized pollen forecasts for allergy sufferers',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // No caching of API calls in MVP as per requirements
        runtimeCaching: []
      }
    })
  ],
  server: {
    proxy: {
      '/api/pollen': {
        target: 'https://pollen.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pollen/, '/v1'),
        secure: true,
        headers: {
          'User-Agent': 'Pollen-Tracker-App/1.0'
        }
      },
      '/api/maps/places': {
        target: 'https://maps.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/maps\/places/, '/maps/api/place'),
        secure: true,
        headers: {
          'User-Agent': 'Pollen-Tracker-App/1.0'
        }
      },
      '/api/maps/geocode': {
        target: 'https://maps.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/maps\/geocode/, '/maps/api/geocode'),
        secure: true,
        headers: {
          'User-Agent': 'Pollen-Tracker-App/1.0'
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        'vite.config.ts',
        'eslint.config.js',
        'tailwind.config.js',
        'postcss.config.js'
      ]
    }
  }
})
