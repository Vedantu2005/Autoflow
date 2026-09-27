const AuditLog = require('../models/AuditLog');

// @desc    Get system audit log entries
// @route   GET /api/audit-logs
// @access  Private (Admin)
const getAuditLogs = async (req, res) => {
  const { entity, search } = req.query;
  let query = {};

  if (entity) {
    query.entity = entity;
  }

  if (search) {
    query.$or = [
      { userName: { $regex: search, $options: 'i' } },
      { action: { $regex: search, $options: 'i' } },
      { details: { $regex: search, $options: 'i' } },
    ];
  }

  const logs = await AuditLog.find(query).sort('-timestamp').limit(200);
  res.json(logs);
};

module.exports = { getAuditLogs };
