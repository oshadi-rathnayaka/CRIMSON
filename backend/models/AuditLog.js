const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorName: {
      type: String,
      required: true,
      trim: true,
    },
    actorRole: {
      type: String,
      enum: ['admin', 'officer', 'citizen', 'system'],
      default: 'system',
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    detail: {
      type: String,
      default: '',
      trim: true,
    },
    caseRef: {
      type: String,
      default: null,
      trim: true,
    },
    ipAddress: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: ['success', 'error'],
      default: 'success',
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
