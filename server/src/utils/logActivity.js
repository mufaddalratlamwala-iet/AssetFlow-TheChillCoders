const ActivityLog = require('../models/ActivityLog');

async function logActivity(req, action, entityType, entityId, metadata = {}) {
  try {
    if (!req.user || !req.user.id) return;
    
    await ActivityLog.create({
      employeeId: req.user.id,
      action,
      entityType,
      entityId,
      metadata
    });
  } catch (error) {
    console.error('Error in logActivity util:', error);
  }
}

module.exports = logActivity;
