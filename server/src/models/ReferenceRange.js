const mongoose = require('mongoose')

const referenceRangeSchema = new mongoose.Schema({
  parameter: { type: String, required: true, index: true },
  unit: { type: String, required: true },
  lower: Number,
  upper: Number,
  population: { type: String, required: true },
  source: { type: String, required: true },
  informationalOnly: { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.models.ReferenceRange || mongoose.model('ReferenceRange', referenceRangeSchema)
