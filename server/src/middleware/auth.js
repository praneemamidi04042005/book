const jwt = require('jsonwebtoken')
const { byId } = require('../services/repository')

async function authenticate(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Sign in to continue.' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'local-demo-secret-change-me')
    const user = await byId('users', payload.sub)
    if (!user) return res.status(401).json({ message: 'Your session is no longer valid.' })
    const { password, ...safeUser } = user
    req.user = safeUser
    return next()
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' })
  }
}

function requireRole(...roles) {
  return (req, res, next) => roles.includes(req.user?.role) ? next() : res.status(403).json({ message: 'You do not have permission to perform this action.' })
}

module.exports = { authenticate, requireRole }
