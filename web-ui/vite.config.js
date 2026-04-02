import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,  // 允许外部访问
    cors: true,  // 允许 CORS
    proxy: {
      '/api': {
        target: 'http://localhost:3458',  // 独立服务器端口
        changeOrigin: true
      }
    }
  }
})
