function notFound(req, res) { res.status(404).json({ message: 'This API route was not found.' }) }

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)
  console.error(error)
  if (error.code === 11000) return res.status(409).json({ message: 'That time slot has just been booked. Please choose another.' })
  if (error.name === 'ValidationError') return res.status(400).json({ message: error.message })
  if (error.name === 'MulterError') return res.status(400).json({ message: error.code === 'LIMIT_FILE_SIZE' ? 'Files must be smaller than the configured upload limit.' : error.message })
  res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Something went wrong. Please try again.' })
}

module.exports = { notFound, errorHandler }
