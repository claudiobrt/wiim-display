import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0', 
    port: 5173,
    proxy: {
      '/proxy': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/image-proxy': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})