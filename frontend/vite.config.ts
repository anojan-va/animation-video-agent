import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:7860',
        changeOrigin: true,
        secure: false
      },
      '/public': {
        target: 'http://127.0.0.1:7860',
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: 'http://127.0.0.1:7860',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
})