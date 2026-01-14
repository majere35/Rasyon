import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
  },
  server: {
    proxy: {
      '/api/hemenyolda': {
        target: 'https://hemenyolda.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/hemenyolda/, '/api/v2'),
        secure: true,
      },
    },
  },
})
