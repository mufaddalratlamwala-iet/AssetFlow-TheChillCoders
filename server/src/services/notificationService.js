const Notification = require('../models/Notification');
const { AppError } = require('../middlewares/errorHandler');

const getByEmployee = async (employeeId, role, query = {}) => {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    
    // Scoping check: Admins see all notifications, others see only their own
    if (role !== 'Admin') {
        filter.employeeId = employeeId;
    } else if (query.employeeId) {
        // Admins can filter by specific employeeId
        filter.employeeId = query.employeeId;
    }

    if (query.type) {
        filter.type = query.type;
    }

    if (query.read !== undefined) {
        filter.read = query.read === 'true';
    }

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('employeeId', 'name email role');

    return {
        notifications,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
    };
};

const markAsRead = async (id, employeeId, role) => {
    const notification = await Notification.findById(id);
    if (!notification) {
        throw new AppError('Notification not found', 404);
    }

    // Authorization: User must own the notification, or be an Admin
    if (notification.employeeId.toString() !== employeeId.toString() && role !== 'Admin') {
        throw new AppError('You are not authorized to mark this notification as read', 403);
    }

    notification.read = true;
    await notification.save();
    return notification;
};

module.exports = {
    getByEmployee,
    markAsRead
};
