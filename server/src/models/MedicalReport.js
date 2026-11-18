const mongoose = require('mongoose')

const parameterSchema = new mongoose.Schema({
  name: String,
  value: mongoose.Schema.Types.Mixed,
  unit: String,
  status: { type: String, enum: ['LOW', 'HIGH', 'NORMAL', 'REVIEW'], default: 'REVIEW' },
  referenceRange: String,
  rangeNote: String,
}, { _id: false })

const reportSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedByRole: { type: String, enum: ['PATIENT', 'DOCTOR', 'HOSPITAL_ADMIN'], required: true },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  fileUrl: String,
  cloudinaryPublicId: String,
  filePath: String,
  fileName: String,
  fileSize: Number,
  mimeType: String,
  reportType: { type: String, default: 'Medical report' },
  uploadDate: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  extractedText: String,
  extractedParameters: [parameterSchema],
  summary: String,
  explanation: String,
  riskCategory: String,
  abnormalParameters: [parameterSchema],
  recommendedSpecialist: String,
  processingStatus: { type: String, enum: ['UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'UPLOADED' },
  processingError: String,
  ocrEngine: String,
}, { timestamps: true })

module.exports = mongoose.models.MedicalReport || mongoose.model('MedicalReport', reportSchema)
