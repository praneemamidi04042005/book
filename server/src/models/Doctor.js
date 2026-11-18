const mongoose = require('mongoose')

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true, trim: true },
  specialization: { type: String, required: true, index: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
  qualifications: [String],
  experienceYears: { type: Number, default: 0 },
  consultationFee: { type: Number, default: 0 },
  rating: { type: Number, min: 0, max: 5, default: 4.5 },
  availability: [{ date: String, slots: [String] }],
  initials: String,
  verified: { type: Boolean, default: true },
  isSampleData: { type: Boolean, default: false },
}, { timestamps: true })

module.exports = mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema)
