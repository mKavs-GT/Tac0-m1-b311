import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'



const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: ['favicon.svg', 'logo.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'MKAVS Admin Dashboard',
        short_name: 'MKAVS Admin',
        description: 'Executive Management Dashboard for MKAVS',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        id: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true
      },
      workbox: {
        navigateFallbackDenylist: [/^\/neoncode/]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core — tiny, always needed, cache-forever
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-is/')) {
            return 'vendor-react';
          }
          // Framer Motion — large animation library
          if (id.includes('node_modules/framer-motion/')) {
            return 'vendor-framer';
          }
          // Recharts + its d3 deps
          if (id.includes('node_modules/recharts/') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-') || id.includes('node_modules/internmap/') || id.includes('node_modules/robust-predicates/')) {
            return 'vendor-recharts';
          }
          // Lucide icons
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-lucide';
          }
          // Everything else in node_modules goes into a general vendor chunk
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
