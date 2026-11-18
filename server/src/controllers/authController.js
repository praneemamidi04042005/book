const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { all, create, findUserByEmail, update } = require('../services/repository')

const safeUser = ({ password, ...user }) => user
const tokenFor = user => jwt.sign({ sub: String(user._id), role: user.role }, process.env.JWT_SECRET || 'local-demo-secret-change-me', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

async function register(req, res) {
  const { name, email, password } = req.body
  if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || '') || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ message: 'Enter your name, a valid email and a password with at least 8 characters.' })
  }
  if (await findUserByEmail(email)) return res.status(409).json({ message: 'An account with that email already exists.' })
  const user = await create('users', { name: name.trim(), email: email.trim().toLowerCase(), password: await bcrypt.hash(password, 12), role: 'PATIENT' })
  return res.status(201).json({ token: tokenFor(user), user: safeUser(user) })
}

async function login(req, res) {
  const { email, password } = req.body
  if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ message: 'Email and password are required.' })
  const normalizedEmail = email.trim().toLowerCase()
  if (process.env.NODE_ENV === 'production' && normalizedEmail.endsWith('@bookmyappointment.demo')) {
    return res.status(401).json({ message: 'Email or password is incorrect.' })
  }
  const user = await findUserByEmail(normalizedEmail, true)
  if (!user?.password || !await bcrypt.compare(password, user.password)) return res.status(401).json({ message: 'Email or password is incorrect.' })
  return res.json({ token: tokenFor(user), user: safeUser(user) })
}

async function profile(req, res) {
  const current = (await all('users')).find(user => String(user._id) === String(req.user._id))
  if (!current) return res.status(404).json({ message: 'Account not found.' })
  return res.json(safeUser(current))
}

async function updateProfile(req, res) {
  const allowed = ['name', 'phone', 'city', 'dateOfBirth', 'sex']
  const changes = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowed.includes(key)))
  if (changes.name && String(changes.name).trim().length > 100) return res.status(400).json({ message: 'Name must be 100 characters or fewer.' })
  if (changes.name) changes.name = String(changes.name).trim()
  const user = await update('users', req.user._id, changes)
  if (!user) return res.status(404).json({ message: 'Account not found.' })
  return res.json(safeUser(user))
}

module.exports = { register, login, profile, updateProfile }
