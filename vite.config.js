import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/harmonies-score-calculator/',
  server: { port: 7823 },
})
