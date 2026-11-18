const fs = require('fs/promises')
const path = require('path')
const pdfParse = require('pdf-parse')
const Tesseract = require('tesseract.js')

async function extractText(filePath, mimeType) {
  const buffer = await fs.readFile(filePath)
  if (mimeType === 'application/pdf') {
    const result = await pdfParse(buffer)
    const text = result.text?.trim() || ''
    if (text.length > 8) return { text, engine: 'pdf-parse' }
    throw new Error('This PDF has no selectable text. Scanned PDF page rendering is not enabled yet; upload an image report or a text-based PDF.')
  }
  if (!['image/jpeg', 'image/png'].includes(mimeType)) throw new Error('Unsupported report file type.')
  const worker = await Tesseract.createWorker('eng')
  try {
    const { data } = await worker.recognize(path.resolve(filePath))
    return { text: data.text || '', engine: 'tesseract.js' }
  } finally { await worker.terminate() }
}

module.exports = { extractText }
