const Allocation = require('../models/Allocation');
const Asset = require('../models/Asset'); // Assuming Dev A created this
const notify = require('../utils/notify');
const logActivity = require('../utils/logActivity');

exports.allocateAsset = async (req, res) => {
  try {
    const { assetId, employeeId, departmentId, expectedReturnDate } = req.body;

    // Check if asset exists
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Check for existing active allocation
    const existingAllocation = await Allocation.findOne({ assetId, status: 'Active' }).populate('employeeId', 'name');
    if (existingAllocation) {
      return res.status(409).json({
        error: 'Asset already allocated',
        currently_held_by: {
          employeeId: existingAllocation.employeeId._id,
          name: existingAllocation.employeeId.name
        }
      });
    }

    // Create allocation
    const allocation = await Allocation.create({
      assetId,
      employeeId,
      departmentId,
      expectedReturnDate,
      status: 'Active'
    });

    // Update asset status
    asset.status = 'Allocated';
    await asset.save();

    // Notifications and Logging
    await notify(employeeId, 'Asset Assigned', `You have been allocated asset ${asset.assetTag || asset.name}`);
    await logActivity(req, 'ALLOCATE', 'Asset', assetId, { employeeId });

    // Populate and return
    await allocation.populate('assetId employeeId departmentId');
    return res.status(201).json(allocation);
  } catch (error) {
    console.error('Error allocating asset:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.returnAsset = async (req, res) => {
  try {
    const { returnConditionNotes } = req.body;
    const { id } = req.params;

    const allocation = await Allocation.findById(id);
    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    if (allocation.status !== 'Active') {
      return res.status(400).json({ error: 'Allocation is not active' });
    }

    // Role check: self-service or Asset Manager/Admin
    if (req.user.role === 'Employee' && String(allocation.employeeId) !== String(req.user.id)) {
        return res.status(403).json({ error: 'Forbidden: You can only return your own assets' });
    }

    allocation.returnedAt = new Date();
    allocation.status = 'Returned';
    allocation.returnConditionNotes = returnConditionNotes;
    await allocation.save();

    const asset = await Asset.findById(allocation.assetId);
    if (asset) {
      asset.status = 'Available';
      await asset.save();
    }

    // TODO: Notify Asset Manager (Need to know Asset Manager ID)
    await logActivity(req, 'RETURN', 'Asset', allocation.assetId);

    return res.status(200).json(allocation);
  } catch (error) {
    console.error('Error returning asset:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getOverdueAllocations = async (req, res) => {
  try {
    let scopeFilter = {};
    if (req.user.role === 'Department Head') {
      scopeFilter.departmentId = req.user.departmentId;
    }

    const query = {
      status: 'Active',
      expectedReturnDate: { $lt: new Date() },
      ...scopeFilter
    };

    const overdueAllocations = await Allocation.find(query).populate('assetId employeeId');
    
    // Optionally flip matching docs' status to 'Overdue' (compute on read approach)
    if (overdueAllocations.length > 0) {
      await Allocation.updateMany(query, { $set: { status: 'Overdue' } });
      // update in-memory objects to match response
      overdueAllocations.forEach(a => a.status = 'Overdue');
    }

    return res.status(200).json(overdueAllocations);
  } catch (error) {
    console.error('Error fetching overdue allocations:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
