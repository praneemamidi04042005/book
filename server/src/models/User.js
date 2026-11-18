const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['PATIENT', 'DOCTOR', 'HOSPITAL_ADMIN'], default: 'PATIENT' },
  phone: { type: String, trim: true, maxlength: 24 },
  city: { type: String, trim: true, maxlength: 100 },
  dateOfBirth: Date,
  sex: { type: String, enum: ['FEMALE', 'MALE', 'INTERSEX', 'UNSPECIFIED'], default: 'UNSPECIFIED' },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
}, { timestamps: true })

module.exports = mongoose.models.User || mongoose.model('User', userSchema)
