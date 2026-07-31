import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/yani-api': {
        target: 'https://api.yani.tv',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/yani-api/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      }
    }
  }
})

