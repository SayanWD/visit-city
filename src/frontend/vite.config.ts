import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // теперь fetch('/users') при dev-de режиме уйдёт на бэкенд
      '/users': 'http://localhost:4000'
    }
  }
})
