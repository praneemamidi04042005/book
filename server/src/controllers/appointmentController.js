const crypto = require('crypto')
const { all, byId, create, update } = require('../services/repository')
const { todayInHyderabad, isFutureSlot } = require('../services/localDate')

const same = (a, b) => String(a) === String(b)

async function decorate(appointment, viewerRole) {
  const [doctor, hospital, patient] = await Promise.all([byId('doctors', appointment.doctorId), byId('hospitals', appointment.hospitalId), byId('users', appointment.patientId)])
  const formatted = { ...appointment, doctor: doctor?.name || '', specialization: doctor?.specialization || '', hospital: hospital?.name || '', fee: doctor?.consultationFee || 0, patientName: patient?.name || '' }
  if (viewerRole === 'PATIENT') delete formatted.providerNotes
  return formatted
}

async function listAppointments(req, res) {
  let results = await all('appointments')
  if (req.user.role === 'PATIENT') results = results.filter(a => same(a.patientId, req.user._id))
  if (req.user.role === 'DOCTOR') results = results.filter(a => same(a.doctorId, req.user.doctorId))
  if (req.user.role === 'HOSPITAL_ADMIN') results = results.filter(a => same(a.hospitalId, req.user.hospitalId))
  if (req.query.status) results = results.filter(a => a.status === req.query.status)
  results.sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
  return res.json(await Promise.all(results.map(item => decorate(item, req.user.role))))
}

function endTime(startTime) {
  const match = String(startTime).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return undefined
  let hour = Number(match[1]) % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0)
  let minute = Number(match[2]) + 30
  if (minute >= 60) { hour += 1; minute -= 60 }
  hour %= 24
  return `${String((hour % 12) || 12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`
}

async function bookAppointment(req, res) {
  if (req.user.role !== 'PATIENT') return res.status(403).json({ message: 'Only patients can book appointments.' })
  const { doctorId, hospitalId, date, startTime, reason } = req.body
  if (!doctorId || !hospitalId || !/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !startTime || String(reason || '').length > 500) return res.status(400).json({ message: 'Choose a hospital, doctor, valid date and time. Visit notes must be under 500 characters.' })
  if (date < todayInHyderabad()) return res.status(400).json({ message: 'Choose today or a future appointment date.' })
  const [doctor, hospital] = await Promise.all([byId('doctors', doctorId), byId('hospitals', hospitalId)])
  if (!doctor || !hospital || !same(doctor.hospitalId, hospital._id)) return res.status(400).json({ message: 'That doctor is not available at the selected hospital.' })
  if (!isFutureSlot(date, startTime)) return res.status(400).json({ message: 'Choose a future appointment time.' })
  const day = (doctor.availability || []).find(item => item.date === date)
  if (!day?.slots?.includes(startTime)) return res.status(409).json({ message: 'This doctor has no available slot at that time. Choose another date or time.' })
  const bookedMessage = `${doctor.name} is already booked on ${date} at ${startTime}. Please choose another time.`
  const current = (await all('appointments')).find(item => same(item.doctorId, doctorId) && item.date === date && item.startTime === startTime && item.activeKey !== false && ['BOOKED', 'CONFIRMED'].includes(item.status))
  if (current) return res.status(409).json({ message: bookedMessage })
  let appointment
  try {
    appointment = await create('appointments', {
      patientId: req.user._id, doctorId, hospitalId, date, startTime, endTime: endTime(startTime),
      status: 'BOOKED', activeKey: true, reason: String(reason || '').trim(),
      appointmentId: `BMA-${new Date().getFullYear()}-${crypto.randomInt(100000, 1000000)}`,
    })
  } catch (error) {
    if (error.code === 11000 && (error.keyPattern?.doctorId || /doctorId_1_date_1_startTime_1_activeKey_1/.test(error.message))) return res.status(409).json({ message: bookedMessage })
    throw error
  }
  return res.status(201).json(await decorate(appointment))
}

async function getAppointment(req, res) {
  const appointment = await byId('appointments', req.params.id)
  if (!appointment) return res.status(404).json({ message: 'Appointment not found.' })
  const allowed = req.user.role === 'PATIENT' && same(appointment.patientId, req.user._id) || req.user.role === 'DOCTOR' && same(appointment.doctorId, req.user.doctorId) || req.user.role === 'HOSPITAL_ADMIN' && same(appointment.hospitalId, req.user.hospitalId)
  if (!allowed) return res.status(403).json({ message: 'You cannot access this appointment.' })
  return res.json(await decorate(appointment, req.user.role))
}

async function cancelAppointment(req, res) {
  const appointment = await byId('appointments', req.params.id)
  if (!appointment) return res.status(404).json({ message: 'Appointment not found.' })
  const allowed = req.user.role === 'PATIENT' && same(appointment.patientId, req.user._id) || req.user.role === 'DOCTOR' && same(appointment.doctorId, req.user.doctorId) || req.user.role === 'HOSPITAL_ADMIN' && same(appointment.hospitalId, req.user.hospitalId)
  if (!allowed) return res.status(403).json({ message: 'You cannot change this appointment.' })
  if (['COMPLETED', 'CANCELLED'].includes(appointment.status)) return res.status(400).json({ message: `This appointment is already ${appointment.status.toLowerCase()}.` })
  const saved = await update('appointments', appointment._id, { status: 'CANCELLED', activeKey: false })
  return res.json(await decorate(saved, req.user.role))
}

async function updateStatus(req, res) {
  const appointment = await byId('appointments', req.params.id)
  if (!appointment) return res.status(404).json({ message: 'Appointment not found.' })
  if (!['DOCTOR', 'HOSPITAL_ADMIN'].includes(req.user.role)) return res.status(403).json({ message: 'Only a care provider can update appointment status.' })
  const allowed = req.user.role === 'DOCTOR' && same(appointment.doctorId, req.user.doctorId) || req.user.role === 'HOSPITAL_ADMIN' && same(appointment.hospitalId, req.user.hospitalId)
  if (!allowed) return res.status(403).json({ message: 'You cannot update this appointment.' })
  const status = req.body.status
  if (!['CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) return res.status(400).json({ message: 'Choose a valid appointment status.' })
  const saved = await update('appointments', appointment._id, { status, activeKey: ['BOOKED', 'CONFIRMED'].includes(status) })
  return res.json(await decorate(saved, req.user.role))
}

async function updateNotes(req, res) {
  const appointment = await byId('appointments', req.params.id)
  if (!appointment) return res.status(404).json({ message: 'Appointment not found.' })
  if (!['DOCTOR', 'HOSPITAL_ADMIN'].includes(req.user.role)) return res.status(403).json({ message: 'Only a care provider can add an appointment note.' })
  const allowed = req.user.role === 'DOCTOR' && same(appointment.doctorId, req.user.doctorId) || req.user.role === 'HOSPITAL_ADMIN' && same(appointment.hospitalId, req.user.hospitalId)
  if (!allowed) return res.status(403).json({ message: 'You cannot add notes to this appointment.' })
  if (typeof req.body.notes !== 'string' || req.body.notes.length > 1000) return res.status(400).json({ message: 'Notes must be text no longer than 1,000 characters.' })
  const saved = await update('appointments', appointment._id, { providerNotes: req.body.notes.trim() })
  return res.json(await decorate(saved, req.user.role))
}

module.exports = { listAppointments, bookAppointment, getAppointment, cancelAppointment, updateStatus, updateNotes }
