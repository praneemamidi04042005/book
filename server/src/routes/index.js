const express = require('express')
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const rateLimit = require('express-rate-limit')
const { authenticate, requireRole } = require('../middleware/auth')
const auth = require('../controllers/authController')
const catalog = require('../controllers/catalogController')
const appointments = require('../controllers/appointmentController')
const reports = require('../controllers/reportController')
const ai = require('../controllers/aiController')

const router = express.Router()
const { isDatabaseReady } = require('../services/repository')
function requireDatabase(req, res, next) {
  if (!isDatabaseReady()) return res.status(503).json({ message: 'The booking database is unavailable. Please try again when the service reconnects.' })
  next()
}
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many attempts. Please wait and try again.' } })
const uploadDirectory = path.resolve(__dirname, '../../uploads')
fs.mkdirSync(uploadDirectory, { recursive: true })
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, done) => done(null, uploadDirectory),
    filename: (_req, file, done) => done(null, `${Date.now()}-${require('crypto').randomBytes(10).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: Math.max(1, Number.parseInt(process.env.MAX_UPLOAD_MB || '10', 10)) * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, done) => {
    const extension = path.extname(file.originalname).toLowerCase()
    const allowed = { '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' }
    if (allowed[extension] === file.mimetype) return done(null, true)
    return done(Object.assign(new Error('Upload a PDF, JPG, JPEG or PNG report.'), { statusCode: 400 }))
  },
})

router.get('/health', (_req, res) => res.json({ status: 'ok', service: 'BookMyAppointment AI API', mode: require('../services/repository').isDatabaseReady() ? 'mongodb' : 'demo', timestamp: new Date().toISOString() }))

router.use('/hospitals', requireDatabase)
router.use('/doctors', requireDatabase)
router.use('/appointments', requireDatabase)

router.post('/auth/register', authLimiter, auth.register)
router.post('/auth/login', authLimiter, auth.login)
router.get('/users/profile', authenticate, auth.profile)
router.put('/users/profile', authenticate, auth.updateProfile)

router.get('/symptoms/recommend-specialist', authenticate, (req, res) => res.status(405).json({ message: 'Use POST to submit symptoms.' }))
router.post('/symptoms/recommend-specialist', authenticate, ai.recommend)
router.post('/ai/recommend-specialist', authenticate, ai.recommend)
router.post('/ai/analyze-report', authenticate, ai.analyze)
router.get('/health-trends/:patientId', authenticate, ai.healthTrends)
router.get('/medical/reference-ranges', authenticate, ai.listRanges)
router.put('/medical/reference-ranges/:parameter', authenticate, requireRole('HOSPITAL_ADMIN'), ai.updateRange)

router.get('/hospitals', catalog.listHospitals)
router.get('/hospitals/:id', catalog.getHospital)
router.post('/hospitals', authenticate, requireRole('HOSPITAL_ADMIN'), catalog.createHospital)
router.get('/doctors', catalog.listDoctors)
router.get('/doctors/:id/availability', catalog.availability)
router.post('/doctors/:id/availability', authenticate, requireRole('DOCTOR', 'HOSPITAL_ADMIN'), catalog.updateAvailability)
router.get('/doctors/:id', catalog.getDoctor)
router.post('/doctors', authenticate, requireRole('HOSPITAL_ADMIN'), catalog.createDoctor)

router.get('/appointments', authenticate, appointments.listAppointments)
router.post('/appointments', authenticate, appointments.bookAppointment)
router.post('/appointments/book', authenticate, appointments.bookAppointment)
router.get('/appointments/:id', authenticate, appointments.getAppointment)
router.post('/appointments/:id/cancel', authenticate, appointments.cancelAppointment)
router.patch('/appointments/:id/status', authenticate, requireRole('DOCTOR', 'HOSPITAL_ADMIN'), appointments.updateStatus)
router.patch('/appointments/:id/notes', authenticate, requireRole('DOCTOR', 'HOSPITAL_ADMIN'), appointments.updateNotes)

router.get('/reports', authenticate, reports.listReports)
router.get('/reports/user/:userId', authenticate, reports.listPatientReports)
router.post('/reports/upload', authenticate, upload.single('report'), reports.uploadReport)
router.post('/reports/:id/upload', authenticate, requireRole('DOCTOR', 'HOSPITAL_ADMIN'), upload.single('report'), reports.uploadForPatient)
router.get('/reports/:id/file', authenticate, reports.readReportFile)
router.get('/reports/:id', authenticate, reports.getReport)
router.post('/reports/:id/analyze', authenticate, reports.analyzeReport)
router.post('/reports/:id/share', authenticate, reports.shareReport)
router.delete('/reports/:id/share/:userId', authenticate, reports.revokeReportAccess)

module.exports = router
