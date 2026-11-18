const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const { databaseReady } = require('../config/database')
const User = require('../models/User')
const Doctor = require('../models/Doctor')
const Hospital = require('../models/Hospital')
const Appointment = require('../models/Appointment')
const MedicalReport = require('../models/MedicalReport')
const MedicalKnowledge = require('../models/MedicalKnowledge')
const ReferenceRange = require('../models/ReferenceRange')
const demo = require('../data/demoData')
const { dateInHyderabad, todayInHyderabad } = require('./localDate')

const DEMO_PASSWORD = process.env.DEMO_PASSWORD
const DEMO_PASSWORD_HASH = DEMO_PASSWORD ? bcrypt.hashSync(DEMO_PASSWORD, 12) : null
const models = { users: User, doctors: Doctor, hospitals: Hospital, appointments: Appointment, reports: MedicalReport, knowledge: MedicalKnowledge, ranges: ReferenceRange }
const memory = Object.fromEntries(Object.entries(demo).map(([key, value]) => [({ demoUsers: 'users', demoDoctors: 'doctors', demoHospitals: 'hospitals', demoAppointments: 'appointments', demoReports: 'reports', demoKnowledge: 'knowledge', demoReferenceRanges: 'ranges' })[key], value.map(x => ({ ...x }))]))
for (const user of memory.users) {
  if (DEMO_PASSWORD_HASH) user.password = DEMO_PASSWORD_HASH
}

function accountForDoctor(doctor) {
  const existing = demo.demoUsers.find(account => String(account.doctorId) === String(doctor._id))
  if (existing) return existing
  const slug = doctor.name.replace(/^Dr\.?\s*/i, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '.')
  return { name: doctor.name, email: `doctor.${slug}@bookmyappointment.demo`, role: 'DOCTOR', doctorId: doctor._id, hospitalId: doctor.hospitalId }
}

const hyderabadDemoDoctors = demo.demoDoctors.filter(doctor => demo.demoHospitals.some(hospital => String(hospital._id) === String(doctor.hospitalId) && hospital.city === 'Hyderabad'))
const hyderabadDoctorAccounts = hyderabadDemoDoctors.map(accountForDoctor)
for (const account of hyderabadDoctorAccounts) {
  const doctor = memory.doctors.find(item => String(item._id) === String(account.doctorId))
  const existingAccount = memory.users.find(user => user.email === account.email)
  if (existingAccount) {
    if (doctor) doctor.userId = existingAccount._id
    continue
  }
  const seededAccount = { ...account, _id: crypto.randomBytes(12).toString('hex'), password: DEMO_PASSWORD_HASH }
  memory.users.push(seededAccount)
  if (doctor) doctor.userId = seededAccount._id
}

async function seedDatabase() {
  if (!databaseReady()) return

  const hospitals = demo.demoHospitals.filter(hospital => hospital.city === 'Hyderabad')
  const hospitalIds = new Set(hospitals.map(hospital => String(hospital._id)))
  for (const hospital of hospitals) {
    await Hospital.updateOne({ _id: hospital._id }, { $setOnInsert: hospital, $set: { isSampleData: true } }, { upsert: true })
  }
  for (const hospital of demo.demoHospitals.filter(item => item.city !== 'Hyderabad')) {
    await Hospital.updateOne({ _id: hospital._id }, { $set: { isSampleData: true } })
  }

  const doctors = demo.demoDoctors.filter(doctor => hospitalIds.has(String(doctor.hospitalId)))
  for (const doctor of doctors) {
    const { verified, isSampleData, ...seededDoctor } = doctor
    const availability = Array.from({ length: 14 }, (_, day) => ({
      date: dateInHyderabad(day),
      slots: [...doctor.availability[0].slots],
    }))
    await Doctor.updateOne({ _id: doctor._id }, { $setOnInsert: { ...seededDoctor, availability }, $set: { isSampleData: true, verified: false } }, { upsert: true })

    // Roll expired schedules forward for these sample records, but preserve any schedule
    // that still contains a current or future date edited by a provider.
    const saved = await Doctor.findById(doctor._id).select('availability').lean()
    const days = saved?.availability || []
    if (days.length && !days.some(day => day.date >= todayInHyderabad())) {
      await Doctor.updateOne({ _id: doctor._id }, { $set: { availability } })
    }
  }
  for (const doctor of demo.demoDoctors.filter(item => !hospitalIds.has(String(item.hospitalId)))) {
    await Doctor.updateOne({ _id: doctor._id }, { $set: { isSampleData: true, verified: false } })
  }

  if (process.env.NODE_ENV !== 'production' && DEMO_PASSWORD) {
    const demoPasswordHash = await bcrypt.hash(DEMO_PASSWORD, 12)
    const nonDoctorAccounts = demo.demoUsers.filter(account => account.role !== 'DOCTOR')
    for (const account of [...nonDoctorAccounts, ...hyderabadDoctorAccounts]) {
      await User.updateOne(
        { email: account.email },
        { $setOnInsert: { ...account, password: demoPasswordHash } },
        { upsert: true },
      )
    }
    for (const doctorAccount of hyderabadDoctorAccounts) {
      await User.updateOne(
        { email: doctorAccount.email },
        { $set: { name: doctorAccount.name, role: 'DOCTOR', doctorId: doctorAccount.doctorId, hospitalId: doctorAccount.hospitalId } },
      )
      const savedAccount = await User.findOne({ email: doctorAccount.email }).select('_id').lean()
      if (savedAccount) await Doctor.updateOne({ _id: doctorAccount.doctorId }, { $set: { userId: savedAccount._id } })
    }
  }

  await Appointment.updateMany({ _id: { $in: demo.demoAppointments.map(appointment => appointment._id) } }, { $set: { status: 'CANCELLED', activeKey: false } })
  await Appointment.updateMany({ status: { $in: ['CANCELLED', 'COMPLETED'] }, activeKey: true }, { $set: { activeKey: false } })
  await Appointment.init()
  console.log(`Hyderabad catalog ready in MongoDB: ${hospitals.length} hospitals, ${doctors.length} doctors.`)
}

function plain(doc) { return doc?.toObject ? doc.toObject() : doc }
async function all(name) {
  if (databaseReady()) return (await models[name].find({}).lean()).map(plain)
  return memory[name].map(item => ({ ...item }))
}
async function byId(name, id) {
  if (databaseReady()) {
    try { return plain(await models[name].findById(id).select(name === 'users' ? '+password' : '').lean()) } catch { return null }
  }
  const item = memory[name].find(x => String(x._id) === String(id))
  return item ? { ...item } : null
}
async function create(name, input) {
  if (databaseReady()) return plain(await models[name].create(input))
  const item = { _id: crypto.randomBytes(12).toString('hex'), createdAt: new Date(), updatedAt: new Date(), ...input }
  memory[name].unshift(item)
  return { ...item }
}
async function update(name, id, changes) {
  if (databaseReady()) return plain(await models[name].findByIdAndUpdate(id, { $set: changes }, { new: true, runValidators: true }))
  const item = memory[name].find(x => String(x._id) === String(id))
  if (!item) return null
  Object.assign(item, changes, { updatedAt: new Date() })
  return { ...item }
}
async function findUserByEmail(email, includePassword = false) {
  if (databaseReady()) return plain(await User.findOne({ email: email.toLowerCase() }).select(includePassword ? '+password' : '').lean())
  const user = memory.users.find(x => x.email.toLowerCase() === email.toLowerCase())
  return user ? { ...user } : null
}
function replaceMemory(name, items) { memory[name] = items.map(item => ({ ...item })) }

module.exports = { models, memory, seedDatabase, all, byId, create, update, findUserByEmail, replaceMemory, isDatabaseReady: databaseReady }
