const { all, byId, create, update } = require('../services/repository')
const { todayInHyderabad, isFutureSlot } = require('../services/localDate')

function isActiveBooking(appointment) {
  return appointment.activeKey !== false && ['BOOKED', 'CONFIRMED'].includes(appointment.status)
}

function withHospital(doctor, hospitals) {
  const hospital = hospitals.find(h => String(h._id) === String(doctor.hospitalId))
  return { ...doctor, hospital: hospital?.name || '', city: hospital?.city || '', area: hospital?.area || '' }
}

async function listHospitals(req, res) {
  const { city, q, specialty } = req.query
  const query = String(q || '').toLowerCase()
  let hospitals = (await all('hospitals')).filter(hospital => !hospital.isSampleData || hospital.city === 'Hyderabad')
  if (city) hospitals = hospitals.filter(h => h.city?.toLowerCase().includes(String(city).toLowerCase()))
  if (query) hospitals = hospitals.filter(h => `${h.name} ${h.area} ${h.city} ${h.address}`.toLowerCase().includes(query))
  if (specialty) hospitals = hospitals.filter(h => h.departments?.some(department => department.toLowerCase().includes(String(specialty).toLowerCase())))
  const doctors = await all('doctors'); const appointments = await all('appointments')
  const date = req.query.date || todayInHyderabad()
  res.json(hospitals.map(h => ({ ...h, departments: h.departments || [], openSlots: doctors.filter(d => String(d.hospitalId) === String(h._id)).reduce((sum, doctor) => {
    const slots = doctor.availability?.find(day => day.date === date)?.slots || []
    const booked = appointments.filter(appointment => String(appointment.doctorId) === String(doctor._id) && appointment.date === date && isActiveBooking(appointment)).map(appointment => appointment.startTime)
    return sum + slots.filter(slot => !booked.includes(slot) && isFutureSlot(date, slot)).length
  }, 0) })))
}

async function getHospital(req, res) {
  const hospital = await byId('hospitals', req.params.id)
  if (!hospital) return res.status(404).json({ message: 'Hospital not found.' })
  const doctors = (await all('doctors')).filter(d => String(d.hospitalId) === String(hospital._id))
  return res.json({ ...hospital, doctors })
}

async function listDoctors(req, res) {
  const { city, hospitalId, specialty, q } = req.query
  const hospitals = await all('hospitals')
  let doctors = (await all('doctors')).map(d => withHospital(d, hospitals)).filter(doctor => !doctor.isSampleData || doctor.city === 'Hyderabad')
  if (city) doctors = doctors.filter(d => d.city?.toLowerCase().includes(String(city).toLowerCase()))
  if (hospitalId) doctors = doctors.filter(d => String(d.hospitalId) === String(hospitalId))
  if (specialty) doctors = doctors.filter(d => d.specialization?.toLowerCase().includes(String(specialty).toLowerCase()))
  if (q) doctors = doctors.filter(d => `${d.name} ${d.specialization} ${d.hospital}`.toLowerCase().includes(String(q).toLowerCase()))
  const date = req.query.date || todayInHyderabad()
  const appointments = await all('appointments')
  res.json(doctors.map(d => {
    const booked = appointments.filter(appointment => String(appointment.doctorId) === String(d._id) && appointment.date === date && isActiveBooking(appointment)).map(appointment => appointment.startTime)
    const slots = d.availability?.find(day => day.date === date)?.slots || []
    return { ...d, fee: d.consultationFee, experience: `${d.experienceYears || 0} years`, initials: d.initials || d.name.split(' ').slice(-2).map(w => w[0]).join(''), slots: slots.filter(slot => !booked.includes(slot) && isFutureSlot(date, slot)) }
  }))
}

async function getDoctor(req, res) {
  const doctor = await byId('doctors', req.params.id)
  if (!doctor) return res.status(404).json({ message: 'Doctor not found.' })
  const hospital = await byId('hospitals', doctor.hospitalId)
  return res.json({ ...doctor, hospital: hospital?.name || '', fee: doctor.consultationFee, experience: `${doctor.experienceYears || 0} years` })
}

async function availability(req, res) {
  const doctor = await byId('doctors', req.params.id)
  if (!doctor) return res.status(404).json({ message: 'Doctor not found.' })
  const requested = req.query.date
  const slots = doctor.availability || []
  const booked = (await all('appointments')).filter(a => String(a.doctorId) === String(doctor._id) && isActiveBooking(a))
  const result = slots.filter(day => !requested || day.date === requested).map(day => {
    const dayBookings = booked.filter(appointment => appointment.date === day.date).map(appointment => appointment.startTime)
    const futureTimes = day.slots.filter(time => isFutureSlot(day.date, time))
    return {
      date: day.date,
      slots: futureTimes.filter(time => !dayBookings.includes(time)),
      bookedSlots: futureTimes.filter(time => dayBookings.includes(time)),
    }
  })
  return res.json(result)
}

async function createHospital(req, res) {
  const required = ['name', 'address', 'city']
  if (required.some(key => !String(req.body[key] || '').trim())) return res.status(400).json({ message: 'Hospital name, address and city are required.' })
  res.status(201).json(await create('hospitals', { ...req.body, name: req.body.name.trim(), city: req.body.city.trim() }))
}

async function createDoctor(req, res) {
  const { name, specialization, hospitalId } = req.body
  if (req.user.role === 'HOSPITAL_ADMIN' && String(req.user.hospitalId) !== String(hospitalId)) return res.status(403).json({ message: 'You can only add doctors to your hospital.' })
  const hospital = await byId('hospitals', hospitalId)
  if (!name?.trim() || !specialization?.trim() || !hospital) return res.status(400).json({ message: 'Enter a doctor name, specialty and valid hospital.' })
  res.status(201).json(withHospital(await create('doctors', req.body), await all('hospitals')))
}

async function updateAvailability(req, res) {
  const doctor = await byId('doctors', req.params.id)
  if (!doctor) return res.status(404).json({ message: 'Doctor not found.' })
  if (req.user.role === 'DOCTOR' && String(req.user.doctorId) !== String(doctor._id)) return res.status(403).json({ message: 'You can only manage your own availability.' })
  if (req.user.role === 'HOSPITAL_ADMIN' && String(req.user.hospitalId) !== String(doctor.hospitalId)) return res.status(403).json({ message: 'You can only manage availability at your hospital.' })
  const { date, slots } = req.body
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !Array.isArray(slots) || slots.length > 30 || slots.some(s => typeof s !== 'string' || s.length > 20)) return res.status(400).json({ message: 'Provide a valid date and list of time slots.' })
  const availability = [...(doctor.availability || []).filter(day => day.date !== date), { date, slots: [...new Set(slots)] }].sort((a, b) => a.date.localeCompare(b.date))
  await update('doctors', doctor._id, { availability })
  res.json({ date, slots: availability.find(day => day.date === date).slots })
}

module.exports = { listHospitals, getHospital, listDoctors, getDoctor, availability, createHospital, createDoctor, updateAvailability }
