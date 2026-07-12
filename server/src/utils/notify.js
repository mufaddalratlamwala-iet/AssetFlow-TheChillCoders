const Notification = require('../models/Notification');

async function notify(employeeId, type, message) {
  try {
    await Notification.create({ employeeId, type, message, read: false });
    // TODO: If WebSocket push is wired up, emit to that employee's socket room here
  } catch (error) {
    console.error('Error in notify util:', error);
  }
}

module.exports = notify;
