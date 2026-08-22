/** Vite app config for the standalone ontology-studio editor. */
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5199, strictPort: true },
})
