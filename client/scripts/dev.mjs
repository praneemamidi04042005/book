import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

const server = await createServer({
  configFile: false,
  root: process.cwd(),
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^lodash$/, replacement: 'lodash-es' },
      { find: /^lodash\/(.+)$/, replacement: 'lodash-es/$1' },
    ],
  },
  server: { port: 5173, host: '0.0.0.0' },
})
await server.listen()
server.printUrls()
