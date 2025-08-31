import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Enhanced logging configuration
  logLevel: 'info',
  customLogger: {
    info: (msg, options) => {
      console.log(`[VITE INFO] ${new Date().toISOString()} - ${msg}`);
    },
    warn: (msg, options) => {
      console.warn(`[VITE WARN] ${new Date().toISOString()} - ${msg}`);
    },
    error: (msg, options) => {
      console.error(`[VITE ERROR] ${new Date().toISOString()} - ${msg}`);
    },
  },
  
  // Development server configuration
  server: {
    port: 5173,
    host: '0.0.0.0',
    // Enhanced CORS and proxy logging
    cors: true,
  },
  
  // Build configuration with detailed output
  build: {
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router'],
          'ui-vendor': ['vuetify', '@mdi/font']
        }
      }
    }
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Музыкальная библиотека',
        short_name: 'Ноты',
        description: 'Каталог нот и музыкальных произведений',
        theme_color: '#2563eb',
        background_color: '#f3f4f6',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|webp|ico)$/, // кэшировать картинки
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /\/api\//, // кэшировать API-ответы
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
}); 