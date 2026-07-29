import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      workbox: {
        // Barkod tarayıcı (zxing) ~450 KB ve zaten çevrimiçi ürün sorgusuyla
        // birlikte çalışıyor; ilk kuruluma yük olmasın diye önbelleğe alınmıyor,
        // ihtiyaç anında indirilip çalışma zamanı önbelleğine yazılıyor.
        globIgnores: ['**/BarcodeScannerModal-*.js'],
        runtimeCaching: [{
          urlPattern: /\/assets\/BarcodeScannerModal-.*\.js$/,
          handler: 'CacheFirst',
          options: { cacheName: 'barcode-scanner' }
        }]
      },
      manifest: {
        name: 'ProOverload Tracker',
        short_name: 'ProOverload',
        description: 'Advanced Workout and Nutrition Tracker',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
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
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['lucide-react']
        }
      }
    }
  }
})
