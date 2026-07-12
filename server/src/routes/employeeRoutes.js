const express = require('express');
const employeeController = require('../controllers/employeeController');
const { protect, authorize } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/activityLogger');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.get('/', employeeController.getEmployees);
router.patch('/:id/role', logActivity('Employee'), employeeController.updateRole);

module.exports = router;
