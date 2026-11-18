import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^lodash$/, replacement: 'lodash-es' },
      { find: /^lodash\/(.+)$/, replacement: 'lodash-es/$1' },
    ],
  },
  server: { port: 5173 },
})
