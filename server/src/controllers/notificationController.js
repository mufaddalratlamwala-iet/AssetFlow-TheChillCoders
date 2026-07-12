const notificationService = require('../services/notificationService');
const { asyncHandler } = require('../middlewares/errorHandler');

const getNotifications = asyncHandler(async (req, res) => {
    const result = await notificationService.getByEmployee(req.user.id, req.user.role, req.query);
    res.status(200).json({
        success: true,
        ...result
    });
});

const markRead = asyncHandler(async (req, res) => {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id, req.user.role);
    res.status(200).json({
        success: true,
        data: notification
    });
});

module.exports = {
    getNotifications,
    markRead
};
