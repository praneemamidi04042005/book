const { all } = require('../services/repository')

const parameterPatterns = [
  { name: 'Hemoglobin', unit: 'g/dL', labels: ['hemoglobin', '\bhb\b', '\bhgb\b'] },
  { name: 'WBC', unit: '/µL', labels: ['wbc', 'white blood cells?', 'total leukocyte count'] },
  { name: 'Platelets', unit: '/µL', labels: ['platelets?', 'thrombocytes?'] },
  { name: 'HbA1c', unit: '%', labels: ['hba1c', 'a1c', 'glycated hemoglobin'] },
  { name: 'Creatinine', unit: 'mg/dL', labels: ['creatinine'] },
  { name: 'Total Cholesterol', unit: 'mg/dL', labels: ['total cholesterol', 'cholesterol total'] },
  { name: 'LDL Cholesterol', unit: 'mg/dL', labels: ['ldl(?: cholesterol)?'] },
  { name: 'Glucose', unit: 'mg/dL', labels: ['fasting glucose', 'blood glucose', 'glucose'] },
]

function rangeString(range) {
  if (range.lower != null && range.upper != null) return `${range.lower}–${range.upper} ${range.unit}`
  if (range.lower != null) return `≥ ${range.lower} ${range.unit}`
  if (range.upper != null) return `≤ ${range.upper} ${range.unit}`
  return null
}

function extractValue(line, labels) {
  for (const label of labels) {
    const re = new RegExp(`(?:${label})\\s*[:=\\-]?\\s*(?:result\\s*)?([<>]?\\s*-?\\d[\\d,]*(?:\\.\\d+)?)\\s*([a-zA-Zµμ/%]+)?`, 'i')
    const match = line.match(re)
    if (match) {
      const value = Number(match[1].replace(/[<>,\s]/g, ''))
      if (Number.isFinite(value)) return { value, unit: match[2] || null }
    }
  }
  return null
}

function normalizeUnit(unit, expected) {
  if (!unit) return expected
  const cleaned = unit.toLowerCase().replace(/μ/g, 'µ').replace(/microliter|microlitre/g, 'µl').replace(/\s/g, '')
  const aliases = { 'g/dl': 'g/dL', 'mg/dl': 'mg/dL', '%': '%', '/ul': '/µL', '/µl': '/µL', 'cells/µl': '/µL', '10^3/µl': '/µL', '10^3/ul': '/µL' }
  return aliases[cleaned] || unit
}

function checkAgainstRange(value, range) {
  if (!range) return 'REVIEW'
  if (range.lower != null && value < range.lower) return 'LOW'
  if (range.upper != null && value > range.upper) return 'HIGH'
  return 'NORMAL'
}

async function parseParameters(text) {
  const lines = text.split(/[\r\n]+/).map(line => line.trim()).filter(Boolean)
  const configuredRanges = await all('ranges')
  const results = []
  for (const definition of parameterPatterns) {
    let found = null
    for (const line of lines) {
      found = extractValue(line, definition.labels)
      if (found) break
    }
    if (!found) continue
    const range = configuredRanges.find(item => item.parameter.toLowerCase() === definition.name.toLowerCase() && normalizeUnit(item.unit, item.unit) === definition.unit)
    const unit = normalizeUnit(found.unit, definition.unit)
    const unitMatches = !found.unit || unit.toLowerCase() === definition.unit.toLowerCase()
    const status = unitMatches ? checkAgainstRange(found.value, range) : 'REVIEW'
    results.push({
      name: definition.name,
      value: found.value,
      unit,
      status,
      referenceRange: unitMatches && range ? rangeString(range) : null,
      rangeNote: unitMatches && range ? `${range.population}; ${range.source}. Informational only.` : 'No matching configured reference interval. Review the range printed by the laboratory.',
    })
  }
  return results
}

module.exports = { parseParameters, parameterPatterns }
