import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// relatieve asset-paden voor Electron (file://)
export default defineConfig({
  plugins: [react()],
  base: './'
})
