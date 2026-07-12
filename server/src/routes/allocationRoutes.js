const express = require('express');
const router = express.Router();
const allocationController = require('../controllers/allocationController');
const requireRole = require('../middlewares/requireRole');
const { protect } = require('../middlewares/auth');
const scopeToDepartment = require('../middlewares/scopeToDepartment');
const Allocation = require('../models/Allocation'); // Used in scopeToDepartment

router.use(protect); // Secure all routes

router.post('/', requireRole('Admin', 'Asset Manager'), allocationController.allocateAsset);
router.post('/:id/return', allocationController.returnAsset);

router.get('/overdue', 
  requireRole('Admin', 'Asset Manager', 'Department Head'), 
  allocationController.getOverdueAllocations
);

module.exports = router;
