const rules = [
  { match: /chest pain|chest tightness|palpitation|heart|blood pressure|hypertension/i, specialties: ['Cardiologist'] },
  { match: /blood sugar|glucose|diabetes|hba1c|diabet/i, specialties: ['Endocrinologist', 'Diabetologist'] },
  { match: /kidney|creatinine|renal/i, specialties: ['Nephrologist'] },
  { match: /liver|alt\b|ast\b|digest|stomach|abdominal/i, specialties: ['Gastroenterologist'] },
  { match: /skin|rash|itch|acne/i, specialties: ['Dermatologist'] },
  { match: /eye|vision|sight/i, specialties: ['Ophthalmologist'] },
  { match: /bone|joint|knee|back pain|fracture/i, specialties: ['Orthopedist'] },
  { match: /headache|migraine|nerve|dizz|seizure|numbness/i, specialties: ['Neurologist'] },
]

function recommendSpecialist(text = '') {
  const matches = rules.find(rule => rule.match.test(text))
  return {
    specialties: matches?.specialties || ['General Physician'],
    disclaimer: 'This is an informational specialist recommendation and not a medical diagnosis.',
    basis: matches ? 'The recommendation is based on the symptoms or report terms shared.' : 'A general physician can help with general or unclear concerns.',
  }
}

module.exports = { recommendSpecialist }
