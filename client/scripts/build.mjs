import { build } from 'vite'
import react from '@vitejs/plugin-react'

await build({
  configFile: false,
  root: process.cwd(),
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'charts'
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react-vendor'
        },
      },
    },
  },
})
