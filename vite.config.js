import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Dev-only: forward the relative /api path to the local journey-api service
  // so the same `fetch('/api/legs')` works in dev and in production (nginx).
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8009',
    },
  },
})
