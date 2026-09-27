const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    action: { type: String, required: true }, // e.g. "APPROVED_ESTIMATE", "CHECKED_IN_VEHICLE", "DELETED_PART"
    entity: { type: String, required: true }, // e.g. "ServiceJob", "Estimate", "Part", "Invoice"
    entityId: { type: String, default: '' },
    details: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
