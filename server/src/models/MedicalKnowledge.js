const mongoose = require('mongoose')

const knowledgeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  source: { type: String, default: 'Curated project educational content' },
  category: { type: String, index: true },
  text: { type: String, required: true },
  embedding: [Number],
  active: { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.models.MedicalKnowledge || mongoose.model('MedicalKnowledge', knowledgeSchema)
