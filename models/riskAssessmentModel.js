const mongoose = require('mongoose');

const riskAssessmentSchema = new mongoose.Schema({
  ID: { type: mongoose.Schema.Types.ObjectId },
  risk_id: { type: String, required: true },
  description: { type: String, required: true },
  impact_level: { type: String, required: true },
  probability_level: { type: String, required: true },
  resolve: { type: String, required: true },
  completed: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const RiskAssessment = mongoose.model('RiskAssessment', riskAssessmentSchema, 'risk_assessment');

module.exports = RiskAssessment;
