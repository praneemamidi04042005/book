const mongoose = require('mongoose')

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: String,
  status: { type: String, enum: ['BOOKED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'], default: 'BOOKED' },
  activeKey: { type: Boolean, default: true },
  reason: { type: String, maxlength: 500, trim: true },
  providerNotes: { type: String, maxlength: 1000, trim: true },
  appointmentId: { type: String, unique: true },
}, { timestamps: true })
appointmentSchema.index({ doctorId: 1, date: 1, startTime: 1, activeKey: 1 }, { unique: true, partialFilterExpression: { activeKey: true } })

module.exports = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema)
