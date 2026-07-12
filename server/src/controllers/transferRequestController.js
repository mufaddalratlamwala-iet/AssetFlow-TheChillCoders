const TransferRequest = require('../models/TransferRequest');
const Allocation = require('../models/Allocation');
const notify = require('../utils/notify');
const logActivity = require('../utils/logActivity');

exports.createTransferRequest = async (req, res) => {
  try {
    const { assetId, fromEmployeeId, toEmployeeId, reason } = req.body;

    // Role Guard: Employee can only request if fromEmployeeId is their own ID
    if (req.user.role === 'Employee' && String(fromEmployeeId) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Employees can only request transfers for their own assets' });
    }

    const transferRequest = await TransferRequest.create({
      assetId,
      fromEmployeeId,
      toEmployeeId,
      reason,
      status: 'Requested',
      requestedBy: req.user.id
    });

    // Notify Asset Manager (Assuming we have a way to find one, or just skipping specific ID for now in stub)
    // await notify(assetManagerId, 'Transfer Requested', `Transfer requested for asset ${assetId}`);
    await logActivity(req, 'CREATE_TRANSFER_REQUEST', 'TransferRequest', transferRequest._id);

    return res.status(201).json(transferRequest);
  } catch (error) {
    console.error('Error creating transfer request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.approveTransferRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const transferRequest = await TransferRequest.findById(id);
    if (!transferRequest) {
      return res.status(404).json({ error: 'Transfer request not found' });
    }

    if (transferRequest.status !== 'Requested') {
      return res.status(400).json({ error: 'Transfer request is not in Requested status' });
    }

    // Close the old allocation
    const oldAllocation = await Allocation.findOne({ assetId: transferRequest.assetId, employeeId: transferRequest.fromEmployeeId, status: 'Active' });
    if (oldAllocation) {
      oldAllocation.status = 'Returned';
      oldAllocation.returnedAt = new Date();
      await oldAllocation.save();
    }

    // Get the toEmployee's department id (mocking it if we don't fetch from DB in this stub)
    // In a real app we'd populate toEmployeeId to get departmentId
    let deptId = null;

    // Create the new allocation
    const newAllocation = await Allocation.create({
      assetId: transferRequest.assetId,
      employeeId: transferRequest.toEmployeeId,
      departmentId: deptId, // Ideally fetched from Employee model
      status: 'Active'
    });

    transferRequest.status = 'Approved';
    transferRequest.approvedBy = req.user.id;
    await transferRequest.save();

    await notify(transferRequest.toEmployeeId, 'Asset Assigned', `You have been transferred an asset`);
    await notify(transferRequest.fromEmployeeId, 'Transfer Approved', `Your transfer request was approved`);
    await logActivity(req, 'APPROVE_TRANSFER', 'TransferRequest', transferRequest._id);

    // Update to 'Reallocated' as per Phase 1 logic
    transferRequest.status = 'Reallocated';
    await transferRequest.save();

    return res.status(200).json({ transferRequest, newAllocation });
  } catch (error) {
    console.error('Error approving transfer request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.rejectTransferRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const transferRequest = await TransferRequest.findById(id);
    if (!transferRequest) {
      return res.status(404).json({ error: 'Transfer request not found' });
    }

    transferRequest.status = 'Rejected';
    transferRequest.approvedBy = req.user.id;
    await transferRequest.save();

    await notify(transferRequest.requestedBy, 'Transfer Rejected', `Your transfer request was rejected`);
    await logActivity(req, 'REJECT_TRANSFER', 'TransferRequest', transferRequest._id);

    return res.status(200).json(transferRequest);
  } catch (error) {
    console.error('Error rejecting transfer request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
