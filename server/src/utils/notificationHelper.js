const Notification = require('../models/Notification');

const createNotification = async ({ employeeId, type, message }) => {
    try {
        const notification = await Notification.create({
            employeeId,
            type,
            message
        });
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

module.exports = {
    createNotification
};
