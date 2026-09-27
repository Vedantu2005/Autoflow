const AuditLog = require('../models/AuditLog');

const logAudit = async (user, action, entity, entityId, details) => {
  try {
    await AuditLog.create({
      userId: user ? user._id : null,
      userName: user ? user.name : 'System',
      userRole: user ? user.role : 'SYSTEM',
      action,
      entity,
      entityId: String(entityId || ''),
      details,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to log audit event:', error.message);
  }
};

module.exports = logAudit;
