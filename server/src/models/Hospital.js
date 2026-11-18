const mongoose = require('mongoose')

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true },
  area: String,
  city: { type: String, required: true, index: true },
  state: String,
  pincode: String,
  location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0, 0] } },
  departments: [String],
  contact: String,
  rating: { type: Number, min: 0, max: 5, default: 4.5 },
  isSampleData: { type: Boolean, default: false },
}, { timestamps: true })
hospitalSchema.index({ location: '2dsphere' })

module.exports = mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema)
