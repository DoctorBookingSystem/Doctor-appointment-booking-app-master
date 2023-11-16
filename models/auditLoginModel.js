const mongoose = require('mongoose');

const auditLoginSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  email: { type: String, required: true },
  action: { type: String, default: 'Login Successful' },
  timestamp: { type: Date, default: Date.now },
});

const AuditLogin = mongoose.model('AuditLogin', auditLoginSchema, 'audit_login');

module.exports = AuditLogin;
