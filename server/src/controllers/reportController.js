const reportService = require('../services/reportService');
const { asyncHandler } = require('../middlewares/errorHandler');

const getUtilization = asyncHandler(async (req, res) => {
    let deptId = null;
    if (req.user.role === 'Department Head') {
        deptId = req.user.departmentId;
    }
    const data = await reportService.getUtilization(deptId);
    res.status(200).json({
        success: true,
        data
    });
});

const getMaintenanceFrequency = asyncHandler(async (req, res) => {
    let deptId = null;
    if (req.user.role === 'Department Head') {
        deptId = req.user.departmentId;
    }
    const data = await reportService.getMaintenanceFrequency(deptId);
    res.status(200).json({
        success: true,
        data
    });
});

const getDepartmentSummary = asyncHandler(async (req, res) => {
    // DepartmentSummary is org-wide, but we can restrict or serve normally
    const data = await reportService.getDepartmentSummary();
    res.status(200).json({
        success: true,
        data
    });
});

const getBookingHeatmap = asyncHandler(async (req, res) => {
    const data = await reportService.getBookingHeatmap();
    res.status(200).json({
        success: true,
        data
    });
});

module.exports = {
    getUtilization,
    getMaintenanceFrequency,
    getDepartmentSummary,
    getBookingHeatmap
};
