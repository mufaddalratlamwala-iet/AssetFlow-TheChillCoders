const activityLogService = require('../services/activityLogService');
const { asyncHandler } = require('../middlewares/errorHandler');

const getLogs = asyncHandler(async (req, res) => {
    const result = await activityLogService.getAll(req.user, req.query);
    res.status(200).json({
        success: true,
        ...result
    });
});

module.exports = {
    getLogs
};
