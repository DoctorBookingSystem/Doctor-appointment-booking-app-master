const mongoose = require('mongoose');

const auditChangesSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  email: { type: String, required: true },
  action: { type: String, default: 'PHI Changes made.' },
  timestamp: { type: Date, default: Date.now },
});

const AuditChanges = mongoose.model('AuditChanges', auditChangesSchema, 'audit_changes');

module.exports = AuditChanges;
