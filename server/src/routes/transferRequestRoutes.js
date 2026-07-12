const express = require('express');
const router = express.Router();
const transferRequestController = require('../controllers/transferRequestController');
const requireRole = require('../middlewares/requireRole');
const { protect } = require('../middlewares/auth');
const scopeToDepartment = require('../middlewares/scopeToDepartment');
const TransferRequest = require('../models/TransferRequest');

const getTransferDeptId = async (req) => {
  const tr = await TransferRequest.findById(req.params.id).populate('fromEmployeeId');
  return tr ? tr.fromEmployeeId.departmentId : null;
};

router.use(protect); // Secure all routes

router.post('/', transferRequestController.createTransferRequest);

router.patch('/:id/approve', 
  requireRole('Admin', 'Asset Manager', 'Department Head'),
  scopeToDepartment(getTransferDeptId),
  transferRequestController.approveTransferRequest
);

router.patch('/:id/reject', 
  requireRole('Admin', 'Asset Manager', 'Department Head'),
  scopeToDepartment(getTransferDeptId),
  transferRequestController.rejectTransferRequest
);

module.exports = router;
