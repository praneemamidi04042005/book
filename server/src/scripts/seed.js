require('dotenv').config()
const mongoose = require('mongoose')
const { connectDatabase } = require('../config/database')
const { seedDatabase, isDatabaseReady } = require('../services/repository')

async function run() {
  const connected = await connectDatabase()
  if (!connected) throw new Error('Could not connect to MongoDB; the Hyderabad catalog was not saved.')
  await seedDatabase()
  if (isDatabaseReady()) {
    console.log('MongoDB catalog seed complete.')
    await mongoose.disconnect()
  }
}

run().catch(error => { console.error('Seed failed:', error); process.exitCode = 1 })
