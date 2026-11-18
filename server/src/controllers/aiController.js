const { recommendSpecialist } = require('../ai/specialistRecommendation')
const { explainReport } = require('../ai/rag/reportExplanation')
const { parseParameters } = require('../ai/reportParser')
const { all } = require('../services/repository')

function recommend(req, res) {
  const text = String(req.body.symptoms || '').trim()
  if (!text || text.length > 1500) return res.status(400).json({ message: 'Describe symptoms in up to 1,500 characters.' })
  return res.json({ ...recommendSpecialist(text), informationalOnly: true })
}

async function analyze(req, res) {
  const { extractedText, reportType = 'Medical report' } = req.body
  if (typeof extractedText !== 'string' || extractedText.length > 60000) return res.status(400).json({ message: 'Provide extracted report text up to 60,000 characters.' })
  const extractedParameters = await parseParameters(extractedText)
  const language = req.body.language === 'Telugu' ? 'Telugu' : 'English'
  const result = await explainReport({ reportType: String(reportType).slice(0, 100), extractedText, extractedParameters, language })
  return res.json({ ...result, extractedParameters })
}

async function healthTrends(req, res) {
  if (req.user.role === 'PATIENT' && String(req.user._id) !== String(req.params.patientId)) return res.status(403).json({ message: 'You can only view your own health trends.' })
  if (req.user.role !== 'PATIENT') return res.status(403).json({ message: 'Share report access before viewing patient trends.' })
  const reports = (await all('reports')).filter(r => String(r.patientId) === String(req.params.patientId)).sort((a, b) => String(a.uploadDate).localeCompare(String(b.uploadDate)))
  const series = {}
  for (const report of reports) for (const value of report.extractedParameters || []) {
    if (typeof value.value !== 'number') continue
    const key = value.name
    series[key] ||= []
    series[key].push({ date: report.uploadDate, value: value.value, unit: value.unit, reportId: report._id, reportType: report.reportType })
  }
  return res.json(series)
}

async function listRanges(req, res) { return res.json(await all('ranges')) }

async function updateRange(req, res) {
  const { lower, upper, unit, population, source } = req.body
  const range = (await all('ranges')).find(item => item.parameter.toLowerCase() === req.params.parameter.toLowerCase())
  const values = { unit, lower: lower === '' ? undefined : Number(lower), upper: upper === '' ? undefined : Number(upper), population, source, informationalOnly: true }
  if (!unit || !population || !source || values.lower != null && !Number.isFinite(values.lower) || values.upper != null && !Number.isFinite(values.upper) || values.lower != null && values.upper != null && values.lower > values.upper) return res.status(400).json({ message: 'Provide valid units, limits, population and source.' })
  if (range) {
    const { update } = require('../services/repository')
    return res.json(await update('ranges', range._id, values))
  }
  const { create } = require('../services/repository')
  return res.status(201).json(await create('ranges', { parameter: req.params.parameter, ...values }))
}

module.exports = { recommend, analyze, healthTrends, listRanges, updateRange }
