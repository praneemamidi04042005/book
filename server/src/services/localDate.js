function todayInHyderabad() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function dateInHyderabad(daysFromToday = 0) {
  const [year, month, day] = todayInHyderabad().split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + daysFromToday, 12))
  return date.toISOString().slice(0, 10)
}

function minutesNowInHyderabad() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return Number(values.hour) * 60 + Number(values.minute)
}

function timeToMinutes(value) {
  const match = String(value).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return null
  const hour = Number(match[1]) % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0)
  return hour * 60 + Number(match[2])
}

function isFutureSlot(date, time) {
  const today = todayInHyderabad()
  if (date !== today) return date > today
  const minutes = timeToMinutes(time)
  return minutes !== null && minutes > minutesNowInHyderabad()
}

module.exports = { todayInHyderabad, dateInHyderabad, minutesNowInHyderabad, timeToMinutes, isFutureSlot }
