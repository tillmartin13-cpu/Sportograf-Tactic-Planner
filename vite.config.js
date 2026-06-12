import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import viteImagemin from 'vite-plugin-imagemin';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteImagemin({
      gifsicle: { optimizationLevel: 3 },
      mozjpeg: { quality: 78 },
      pngquant: { quality: [0.7, 0.9], speed: 4 },
      webp: { quality: 78 },
      svgo: false,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Don't cache large station images — always fetch fresh
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/hyrox\/stations\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'hyrox-images', expiration: { maxEntries: 100 } },
          },
        ],
      },
      manifest: false, // keep our own public/manifest.json
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
});
