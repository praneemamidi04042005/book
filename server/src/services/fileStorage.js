const path = require('path')
const { v2: cloudinary } = require('cloudinary')

function cloudinaryEnabled() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
}

async function storeReport(filePath, mimeType) {
  if (!cloudinaryEnabled()) return { url: null, publicId: null }
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true })
  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: 'raw',
    folder: 'bookmyappointment/reports',
    type: 'authenticated',
    access_mode: 'authenticated',
    format: path.extname(filePath).replace('.', ''),
    context: { mimeType },
  })
  return { url: result.secure_url, publicId: result.public_id }
}

function authenticatedUrl(publicId) {
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true })
  return cloudinary.utils.private_download_url(publicId, '', { resource_type: 'raw', expires_at: Math.floor(Date.now() / 1000) + 120 })
}

module.exports = { storeReport, authenticatedUrl }
