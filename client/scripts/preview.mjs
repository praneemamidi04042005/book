import { preview } from 'vite'
import react from '@vitejs/plugin-react'

const server = await preview({
  configFile: false,
  root: process.cwd(),
  plugins: [react()],
  preview: { port: 4173, host: '0.0.0.0' },
})
server.printUrls()
