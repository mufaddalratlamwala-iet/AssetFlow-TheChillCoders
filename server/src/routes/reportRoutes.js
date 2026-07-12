const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.use(authorize('Admin', 'Asset Manager', 'Department Head'));

router.get('/utilization', reportController.getUtilization);
router.get('/maintenance-frequency', reportController.getMaintenanceFrequency);
router.get('/department-summary', reportController.getDepartmentSummary);
router.get('/booking-heatmap', reportController.getBookingHeatmap);

module.exports = router;
