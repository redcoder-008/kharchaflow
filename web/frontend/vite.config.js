import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('../..', import.meta.url)), 'VITE_')
  const messagingConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
  }
  return {
  root: fileURLToPath(new URL('.', import.meta.url)),
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  plugins: [react(), {
    name: 'firebase-messaging-service-worker',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'firebase-messaging-sw.js',
        source: `importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js');\nimportScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js');\nconst firebaseConfig = ${JSON.stringify(messagingConfig)};\nif (firebaseConfig.apiKey && firebaseConfig.projectId) { firebase.initializeApp(firebaseConfig); const messaging = firebase.messaging(); messaging.onBackgroundMessage((payload) => { const notification = payload.notification || {}; self.registration.showNotification(notification.title || 'KharchaFlow', { body: notification.body || 'You have a new notification.', icon: '/favicon.ico', data: payload.data || {} }); }); }`
      })
    }
  }],
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
  }
})

