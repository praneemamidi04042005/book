const OpenAI = require('openai')
const { all, update, create } = require('../../services/repository')

let openai
function client() {
  if (!process.env.OPENAI_API_KEY) return null
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return openai
}
function tokens(text) { return new Set((text || '').toLowerCase().match(/[a-z0-9%]+/g) || []) }
function lexicalScore(query, text) {
  const q = tokens(query); const d = tokens(text)
  if (!q.size || !d.size) return 0
  let common = 0; for (const term of q) if (d.has(term)) common += 1
  return common / Math.sqrt(q.size * d.size)
}
function cosine(a, b) {
  if (!a?.length || a.length !== b?.length) return 0
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i += 1) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2 }
  return na && nb ? dot / Math.sqrt(na * nb) : 0
}
function chunkText(text, size = 800, overlap = 120) {
  const clean = String(text || '').trim()
  if (!clean) return []
  const chunks = []
  let start = 0
  while (start < clean.length) {
    let end = Math.min(clean.length, start + size)
    if (end < clean.length) {
      const boundary = clean.lastIndexOf(' ', end)
      if (boundary > start + Math.floor(size * 0.6)) end = boundary
    }
    chunks.push(clean.slice(start, end).trim())
    if (end >= clean.length) break
    start = Math.max(start + 1, end - overlap)
  }
  return chunks
}
async function embed(text) {
  const ai = client()
  if (!ai) return null
  const response = await ai.embeddings.create({ model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small', input: text.slice(0, 7000) })
  return response.data[0].embedding
}

async function upsertKnowledge({ title, text, category, source }) {
  const chunks = chunkText(text)
  const stored = []
  for (let index = 0; index < chunks.length; index += 1) {
    const embedding = await embed(`${title}\n${chunks[index]}`)
    stored.push(await create('knowledge', {
      title: chunks.length > 1 ? `${title} · ${index + 1}/${chunks.length}` : title,
      text: chunks[index], category, source: source || 'Curated educational content',
      ...(embedding ? { embedding } : {}),
    }))
  }
  return stored
}

async function indexMissingKnowledge() {
  if (!client()) return 0
  const documents = await all('knowledge')
  let indexed = 0
  for (const document of documents) {
    if (document.embedding?.length) continue
    try {
      const embedding = await embed(`${document.title}\n${document.text}`)
      if (embedding) { await update('knowledge', document._id, { embedding }); indexed += 1 }
    } catch (error) {
      console.warn(`Could not embed knowledge chunk "${document.title}": ${error.message}`)
    }
  }
  return indexed
}

async function searchKnowledge(query, limit = 4) {
  const documents = await all('knowledge')
  const queryVector = await embed(query).catch(() => null)
  const scored = documents.filter(doc => doc.active !== false).map(doc => ({
    ...doc,
    score: queryVector && doc.embedding?.length ? cosine(queryVector, doc.embedding) : lexicalScore(query, `${doc.title} ${doc.category || ''} ${doc.text}`),
  })).sort((a, b) => b.score - a.score).slice(0, limit)
  return scored.filter(doc => doc.score > 0).map(({ _id, title, category, source, text, score }) => ({ _id, title, category, source, text, score }))
}

module.exports = { embed, upsertKnowledge, searchKnowledge, lexicalScore, indexMissingKnowledge, chunkText }
