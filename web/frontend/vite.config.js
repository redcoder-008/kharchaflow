import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  plugins: [react()],
  server: {
    fs: {
      allow: [
        fileURLToPath(new URL('..', import.meta.url)),
        fileURLToPath(new URL('../..', import.meta.url)),
      ],
    },
  },
  build: {
    outDir: fileURLToPath(new URL('../../dist', import.meta.url)),
    emptyOutDir: true,
    // Raise warning threshold — large bundle is expected with Firebase + Recharts
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'charts-vendor': ['recharts'],
          'icons-vendor': ['lucide-react'],
        }
      }
    }
  }
})

