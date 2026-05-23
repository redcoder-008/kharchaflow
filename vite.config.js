import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
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
