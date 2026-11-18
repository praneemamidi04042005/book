require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')
const { connectDatabase } = require('./config/database')
const routes = require('./routes')
const { notFound, errorHandler } = require('./middleware/errorHandler')
const { seedDatabase } = require('./services/repository')

async function start() {
  const production = process.env.NODE_ENV === 'production'
  const databaseConnected = await connectDatabase()
  if (production && !process.env.JWT_SECRET) throw new Error('JWT_SECRET must be configured in production.')
  if (production && !databaseConnected) throw new Error('A reachable MONGODB_URI is required in production.')
  await seedDatabase()
  if (process.env.OPENAI_API_KEY) await require('./ai/vectorStore').indexMissingKnowledge()
  const app = express()
  app.disable('x-powered-by')
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }))
  app.use(cors({ origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(value => value.trim()) : ['http://localhost:5173'], credentials: false }))
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: false, limit: '1mb' }))
  const clientBuild = path.resolve(__dirname, '../../client/dist')
  if (production) app.use(express.static(clientBuild))
  app.get('/', (_req, res) => res.json({ name: 'BookMyAppointment AI', docs: '/api/health' }))
  app.use('/api', routes)
  if (production) {
    app.get(/^\/(?!api(?:\/|$)).*/, (_req, res, next) => {
      res.sendFile(path.join(clientBuild, 'index.html'), error => { if (error) next(error) })
    })
  }
  app.use(notFound)
  app.use(errorHandler)
  const port = Number(process.env.PORT || 5000)
  app.listen(port, () => console.log(`BookMyAppointment AI API listening on http://localhost:${port}`))
}

start().catch(error => { console.error('Could not start server:', error); process.exitCode = 1 })
