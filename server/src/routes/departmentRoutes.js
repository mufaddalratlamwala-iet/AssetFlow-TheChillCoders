const express = require('express');
const departmentController = require('../controllers/departmentController');
const { protect, authorize } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/activityLogger');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.get('/', departmentController.getDepartments);
router.post('/', logActivity('Department'), departmentController.createDepartment);
router.patch('/:id', logActivity('Department'), departmentController.updateDepartment);

module.exports = router;
