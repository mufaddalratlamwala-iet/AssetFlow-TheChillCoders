const AuditCycle = require('../models/AuditCycle');
const AuditItem = require('../models/AuditItem');
const Asset = require('../models/Asset');
const Employee = require('../models/Employee');

// Create a new audit cycle
exports.createAuditCycle = async (req, res) => {
  try {
    const { scopeDepartmentId, scopeLocation, dateRangeStart, dateRangeEnd } = req.body;

    if (!dateRangeStart || !dateRangeEnd) {
      return res.status(400).json({ error: 'dateRangeStart and dateRangeEnd are required' });
    }

    const newCycle = new AuditCycle({
      scopeDepartmentId: scopeDepartmentId || null,
      scopeLocation: scopeLocation || '',
      dateRangeStart,
      dateRangeEnd,
      auditorIds: [],
      status: 'Open'
    });

    await newCycle.save();
    res.status(201).json({ message: 'Audit cycle created successfully', cycle: newCycle });
  } catch (error) {
    console.error('Error creating audit cycle:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Assign auditors to a cycle
exports.addAuditors = async (req, res) => {
  try {
    const { id } = req.params;
    const { auditorIds } = req.body;

    if (!Array.isArray(auditorIds)) {
      return res.status(400).json({ error: 'auditorIds must be an array' });
    }

    const cycle = await AuditCycle.findById(id);
    if (!cycle) {
      return res.status(404).json({ error: 'Audit cycle not found' });
    }

    if (cycle.status !== 'Open') {
      return res.status(400).json({ error: 'Cannot add auditors to a closed cycle' });
    }

    // Use $addToSet to prevent duplicates
    const updatedCycle = await AuditCycle.findByIdAndUpdate(
      id,
      { $addToSet: { auditorIds: { $each: auditorIds } } },
      { new: true }
    );

    res.status(200).json({ message: 'Auditors assigned successfully', cycle: updatedCycle });
  } catch (error) {
    console.error('Error adding auditors:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add or update an audit item
exports.addAuditItem = async (req, res) => {
  try {
    const { auditCycleId, assetId, verification, notes } = req.body;

    if (!auditCycleId || !assetId || !verification) {
      return res.status(400).json({ error: 'auditCycleId, assetId, and verification are required' });
    }

    const cycle = await AuditCycle.findById(auditCycleId);
    if (!cycle) {
      return res.status(404).json({ error: 'Audit cycle not found' });
    }

    if (cycle.status !== 'Open') {
      return res.status(400).json({ error: 'Cannot add items to a closed cycle' });
    }

    // Role check: If employee, they must be in auditorIds
    if (req.user.role === 'Employee') {
      if (!cycle.auditorIds.includes(req.user.id)) {
        return res.status(403).json({ error: 'You are not assigned as an auditor for this cycle' });
      }
    }

    // Upsert the item
    const item = await AuditItem.findOneAndUpdate(
      { auditCycleId, assetId },
      { verification, notes: notes || '', checkedBy: req.user.id, checkedAt: new Date() },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Audit item recorded', item });
  } catch (error) {
    console.error('Error recording audit item:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Close an audit cycle
exports.closeAuditCycle = async (req, res) => {
  try {
    const { id } = req.params;

    const cycle = await AuditCycle.findById(id);
    if (!cycle) {
      return res.status(404).json({ error: 'Audit cycle not found' });
    }

    if (cycle.status !== 'Open') {
      return res.status(400).json({ error: 'Cycle is already closed' });
    }

    // Find all items marked as 'Missing' for this cycle
    const missingItems = await AuditItem.find({ auditCycleId: id, verification: 'Missing' });

    // Update the actual asset records to 'Lost'
    const missingAssetIds = missingItems.map(item => item.assetId);
    if (missingAssetIds.length > 0) {
      await Asset.updateMany(
        { _id: { $in: missingAssetIds } },
        { $set: { status: 'Lost' } }
      );
    }

    cycle.status = 'Closed';
    cycle.closedAt = new Date();
    await cycle.save();

    // Fetch Discrepancy Summary
    const discrepancyReport = await AuditItem.find({ 
      auditCycleId: id, 
      verification: { $in: ['Missing', 'Damaged'] } 
    }).populate('assetId').populate('checkedBy', 'name email');

    res.status(200).json({ 
      message: 'Audit cycle closed successfully', 
      cycle,
      discrepancies: discrepancyReport
    });
  } catch (error) {
    console.error('Error closing audit cycle:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get discrepancy report
exports.getDiscrepancyReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real app, department heads would only see their department's assets, but here we just return the cycle's items
    const discrepancies = await AuditItem.find({ 
      auditCycleId: id, 
      verification: { $in: ['Missing', 'Damaged'] } 
    }).populate('assetId').populate('checkedBy', 'name email');

    // Group by verification type
    const grouped = {
      Missing: discrepancies.filter(item => item.verification === 'Missing'),
      Damaged: discrepancies.filter(item => item.verification === 'Damaged')
    };

    res.status(200).json({ discrepancies: grouped });
  } catch (error) {
    console.error('Error fetching discrepancy report:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all audit cycles (added for the UI to list them)
exports.getAuditCycles = async (req, res) => {
  try {
    const cycles = await AuditCycle.find().populate('scopeDepartmentId').sort({ createdAt: -1 });
    res.status(200).json({ cycles });
  } catch (error) {
    console.error('Error fetching audit cycles:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
