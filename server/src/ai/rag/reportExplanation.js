const OpenAI = require('openai')
const { searchKnowledge } = require('../vectorStore')
const { recommendSpecialist } = require('../specialistRecommendation')

let openai
function client() {
  if (!process.env.OPENAI_API_KEY) return null
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return openai
}
const DISCLAIMER = 'This is an AI-assisted informational explanation, not a medical diagnosis. A licensed healthcare professional should interpret the report and make all diagnosis and treatment decisions.'

function fallback(values, recommendation) {
  if (!values.length) return {
    summary: 'The report text was received, but no supported parameter values could be confidently extracted. Please review the original document with a healthcare professional.',
    explanation: 'Only clearly detected values are shown. No values were inferred or filled in.',
    riskCategory: 'NEEDS_CLINICIAN_REVIEW',
    recommendedSpecialist: recommendation.specialties[0],
    abnormalParameters: [],
    disclaimer: DISCLAIMER,
  }
  const flagged = values.filter(p => p.status === 'HIGH' || p.status === 'LOW')
  const compared = values.filter(p => ['NORMAL', 'HIGH', 'LOW'].includes(p.status))
  const summary = flagged.length
    ? `${flagged.length} recorded value${flagged.length > 1 ? 's are' : ' is'} outside the configured informational interval${flagged.length > 1 ? 's' : ''}. The interval may not match your lab or personal context; please discuss the report with a doctor.`
    : compared.length
      ? 'The compared values did not fall outside the configured informational intervals. This comparison may not reflect the ranges printed by your laboratory; review the complete report with a doctor.'
      : 'Values were extracted, but no matching reference interval was available for comparison. Please review the report with a healthcare professional.'
  return { summary, explanation: `We found ${values.length} value${values.length === 1 ? '' : 's'} in the report. The comparison uses configured informational reference intervals and should not be used to make health decisions.`, riskCategory: flagged.length ? 'PROMPT_CLINICIAN_REVIEW' : 'ROUTINE_CLINICIAN_REVIEW', recommendedSpecialist: recommendation.specialties[0], abnormalParameters: flagged, disclaimer: DISCLAIMER }
}

function parseJson(text) {
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  return JSON.parse(clean)
}

async function explainReport({ reportType, extractedText, extractedParameters, language = 'English' }) {
  const recommendation = recommendSpecialist(`${reportType || ''} ${extractedText || ''} ${extractedParameters.map(p => p.name).join(' ')}`)
  const base = fallback(extractedParameters, recommendation)
  const ai = client()
  if (language === 'Telugu' && !ai) throw Object.assign(new Error('Telugu explanations require an OpenAI API key.'), { statusCode: 503 })
  if (!ai) return { ...base, retrievedKnowledge: await searchKnowledge(`${reportType} ${extractedParameters.map(p => p.name).join(' ')}`) }
  const knowledge = await searchKnowledge(`${reportType} ${extractedParameters.map(p => `${p.name} ${p.status}`).join(' ')}`).catch(() => [])
  const allowedValues = extractedParameters.map(({ name, value, unit, status, referenceRange, rangeNote }) => ({ name, value, unit, status, referenceRange, rangeNote }))
  try {
    const response = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `Write the summary and explanation in ${language === 'Telugu' ? 'simple Telugu' : 'simple English'}. Keep medical parameter names, numeric values, units, and reference intervals exactly as provided. You do not diagnose, prescribe, predict disease, or recommend treatment. Do not invent or alter values, units, ranges, or findings. Refer only to the provided extractedParameters. State that reference ranges vary by lab and personal context. If no values were extracted, say that. The specialist is a navigation suggestion only. Output JSON with summary, explanation, riskCategory (one of ROUTINE_CLINICIAN_REVIEW, PROMPT_CLINICIAN_REVIEW, NEEDS_CLINICIAN_REVIEW), recommendedSpecialist, abnormalParameterNames (array of names copied from input), and disclaimer. Never assign emergency status.` },
        { role: 'user', content: JSON.stringify({ reportType, extractedParameters: allowedValues, ruleBasedRecommendedSpecialist: recommendation.specialties[0], retrievedTrustedContext: knowledge.map(item => ({ title: item.title, source: item.source, text: item.text })) }) },
      ],
    })
    const parsed = parseJson(response.choices[0].message.content)
    const approvedNames = new Set(allowedValues.filter(p => p.status === 'HIGH' || p.status === 'LOW').map(p => p.name))
    const abnormalParameters = (parsed.abnormalParameterNames || []).filter(name => approvedNames.has(name)).map(name => allowedValues.find(p => p.name === name))
    const validCategories = ['ROUTINE_CLINICIAN_REVIEW', 'PROMPT_CLINICIAN_REVIEW', 'NEEDS_CLINICIAN_REVIEW']
    return {
      summary: String(parsed.summary || base.summary).slice(0, 1200),
      explanation: String(parsed.explanation || base.explanation).slice(0, 2400),
      riskCategory: validCategories.includes(parsed.riskCategory) ? parsed.riskCategory : base.riskCategory,
      recommendedSpecialist: recommendation.specialties[0],
      abnormalParameters,
      disclaimer: DISCLAIMER,
      retrievedKnowledge: knowledge,
    }
  } catch (error) {
    console.warn('LLM explanation unavailable; using rule-based explanation:', error.message)
    return { ...base, retrievedKnowledge: knowledge }
  }
}

module.exports = { explainReport, DISCLAIMER }
