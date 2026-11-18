const fs = require('fs/promises')
const path = require('path')
const { all, byId, create, update } = require('../services/repository')
const { extractText } = require('../ai/ocr')
const { parseParameters } = require('../ai/reportParser')
const { explainReport } = require('../ai/rag/reportExplanation')
const { recommendSpecialist } = require('../ai/specialistRecommendation')
const { storeReport, authenticatedUrl } = require('../services/fileStorage')

function idEquals(left, right) { return String(left) === String(right) }

async function hasAppointment(user, patientId) {
  const doctorId = user.doctorId
  const hospitalId = user.hospitalId
  const appointments = await all('appointments')
  return appointments.some(item => idEquals(item.patientId, patientId) && item.activeKey !== false && (
    user.role === 'DOCTOR' && idEquals(item.doctorId, doctorId) ||
    user.role === 'HOSPITAL_ADMIN' && idEquals(item.hospitalId, hospitalId)
  ))
}

async function canReadReport(user, report) {
  if (user.role === 'PATIENT') return idEquals(user._id, report.patientId)
  if (idEquals(user._id, report.uploadedBy)) return true
  return (report.sharedWith || []).some(shared => idEquals(shared, user._id))
}

async function visibleReports(user, patientId) {
  const reports = await all('reports')
  if (user.role === 'PATIENT') return reports.filter(r => idEquals(r.patientId, user._id))
  if (patientId && !await hasAppointment(user, patientId) && !reports.some(r => idEquals(r.patientId, patientId) && idEquals(r.uploadedBy, user._id))) return null
  return reports.filter(r => (!patientId || idEquals(r.patientId, patientId)) && (idEquals(r.uploadedBy, user._id) || (r.sharedWith || []).some(shared => idEquals(shared, user._id))))
}

async function listReports(req, res) {
  const reports = await visibleReports(req.user)
  return res.json(reports.sort((a, b) => String(b.uploadDate).localeCompare(String(a.uploadDate))))
}

async function listPatientReports(req, res) {
  if (req.user.role === 'PATIENT' && !idEquals(req.user._id, req.params.userId)) return res.status(403).json({ message: 'You can only access your own reports.' })
  const reports = await visibleReports(req.user, req.params.userId)
  if (!reports) return res.status(403).json({ message: 'The patient must authorize access to their reports.' })
  return res.json(reports.sort((a, b) => String(b.uploadDate).localeCompare(String(a.uploadDate))))
}

async function getReport(req, res) {
  const report = await byId('reports', req.params.id)
  if (!report) return res.status(404).json({ message: 'Report not found.' })
  if (!await canReadReport(req.user, report)) return res.status(403).json({ message: 'The patient has not shared this report with you.' })
  return res.json(report)
}

async function processReport(report, filePath) {
  await update('reports', report._id, { processingStatus: 'PROCESSING', processingError: null })
  try {
    const extracted = await extractText(filePath, report.mimeType)
    const values = await parseParameters(extracted.text)
    const analysis = await explainReport({ reportType: report.reportType, extractedText: extracted.text, extractedParameters: values })
    const result = await update('reports', report._id, {
      extractedText: extracted.text.slice(0, 60000),
      extractedParameters: values,
      abnormalParameters: analysis.abnormalParameters,
      summary: analysis.summary,
      explanation: analysis.explanation,
      riskCategory: analysis.riskCategory,
      recommendedSpecialist: analysis.recommendedSpecialist,
      processingStatus: 'COMPLETED',
      ocrEngine: extracted.engine,
    })
    return result
  } catch (error) {
    return update('reports', report._id, { processingStatus: 'FAILED', processingError: error.message, summary: 'The report could not be analyzed automatically. Please review the uploaded document with a healthcare professional.' })
  }
}

async function uploadReport(req, res) {
  if (!req.file) return res.status(400).json({ message: 'Choose a report file to upload.' })
  let patientId = req.user._id
  if (req.user.role !== 'PATIENT') {
    patientId = req.body.patientId
    if (!patientId) { await fs.unlink(req.file.path).catch(() => {}); return res.status(400).json({ message: 'Choose a patient for this report.' }) }
    if (!await hasAppointment(req.user, patientId)) { await fs.unlink(req.file.path).catch(() => {}); return res.status(403).json({ message: 'A current appointment relationship is required before uploading a report for this patient.' }) }
  }
  const cleanType = String(req.body.reportType || path.basename(req.file.originalname, path.extname(req.file.originalname))).replace(/[<>]/g, '').trim().slice(0, 100) || 'Medical report'
  const report = await create('reports', {
    patientId, uploadedBy: req.user._id, uploadedByRole: req.user.role, filePath: req.file.path,
    fileName: req.file.originalname.slice(0, 180), fileSize: req.file.size, mimeType: req.file.mimetype,
    reportType: cleanType, uploadDate: new Date().toISOString().slice(0, 10), processingStatus: 'UPLOADED', sharedWith: [],
  })
  const analyzed = await processReport(report, req.file.path)
  try {
    const storage = await storeReport(req.file.path, req.file.mimetype)
    if (storage.url) {
      await update('reports', report._id, { fileUrl: storage.url, cloudinaryPublicId: storage.publicId, filePath: null })
      await fs.unlink(req.file.path).catch(() => {})
    }
  } catch (error) {
    console.warn('Cloudinary upload failed; keeping the report in local protected storage:', error.message)
  }
  const result = await byId('reports', report._id)
  return res.status(201).json({ ...result, fileUrl: `/api/reports/${report._id}/file` })
}

async function analyzeReport(req, res) {
  const report = await byId('reports', req.params.id)
  if (!report) return res.status(404).json({ message: 'Report not found.' })
  if (!await canReadReport(req.user, report)) return res.status(403).json({ message: 'The patient has not shared this report with you.' })
  if (!report.filePath) return res.status(400).json({ message: 'The stored source file is not available for reanalysis.' })
  const result = await processReport(report, report.filePath)
  return res.json(result)
}

async function shareReport(req, res) {
  const report = await byId('reports', req.params.id)
  if (!report) return res.status(404).json({ message: 'Report not found.' })
  if (req.user.role !== 'PATIENT' || !idEquals(report.patientId, req.user._id)) return res.status(403).json({ message: 'Only the patient who owns this report can grant access.' })
  const providerUser = await byId('users', req.body.userId)
  if (!providerUser || !['DOCTOR', 'HOSPITAL_ADMIN'].includes(providerUser.role)) return res.status(400).json({ message: 'Choose a valid care provider account.' })
  const sharedWith = [...new Set([...(report.sharedWith || []).map(String), String(providerUser._id)])]
  const updated = await update('reports', report._id, { sharedWith })
  return res.json({ message: `Report shared with ${providerUser.name}.`, report: updated })
}

async function revokeReportAccess(req, res) {
  const report = await byId('reports', req.params.id)
  if (!report) return res.status(404).json({ message: 'Report not found.' })
  if (req.user.role !== 'PATIENT' || !idEquals(report.patientId, req.user._id)) return res.status(403).json({ message: 'Only the patient who owns this report can change access.' })
  const sharedWith = (report.sharedWith || []).filter(id => !idEquals(id, req.params.userId))
  await update('reports', report._id, { sharedWith })
  return res.json({ message: 'Report access revoked.' })
}

async function readReportFile(req, res) {
  const report = await byId('reports', req.params.id)
  if (!report) return res.status(404).json({ message: 'Report not found.' })
  if (!await canReadReport(req.user, report)) return res.status(403).json({ message: 'The patient has not shared this report with you.' })
  if (report.cloudinaryPublicId) return res.redirect(authenticatedUrl(report.cloudinaryPublicId))
  if (!report.filePath) return res.status(404).json({ message: 'The source document is not available.' })
  res.setHeader('Content-Type', report.mimeType || 'application/octet-stream')
  res.setHeader('Content-Disposition', `inline; filename="${path.basename(report.fileName || 'report')}"`)
  return res.sendFile(path.resolve(report.filePath))
}

async function uploadForPatient(req, res) {
  return uploadReport(req, res)
}

module.exports = { listReports, listPatientReports, getReport, uploadReport, uploadForPatient, analyzeReport, shareReport, revokeReportAccess, readReportFile }
