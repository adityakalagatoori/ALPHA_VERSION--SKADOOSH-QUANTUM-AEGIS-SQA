import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/v2': {
        target: 'https://sqa-backend-hsw2.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/health': {
        target: 'https://sqa-backend-hsw2.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/access': {
        target: 'https://sqa-backend-hsw2.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})