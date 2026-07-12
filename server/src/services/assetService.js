const Asset = require('../models/Asset');
const Allocation = require('../models/Allocation');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Employee = require('../models/Employee');
const generateAssetTag = require('../utils/generateAssetTag');
const { createNotification } = require('../utils/notificationHelper');
const { AppError } = require('../middlewares/errorHandler');

const getAll = async (query, user) => {
    const filter = {};

    // 1. Search & Filter query params
    if (query.search) {
        const searchRegex = new RegExp(query.search, 'i');
        filter.$or = [
            { name: searchRegex },
            { assetTag: searchRegex },
            { serialNumber: searchRegex }
        ];
    }

    if (query.category) {
        filter.categoryId = query.category;
    }

    if (query.status) {
        filter.status = query.status;
    }

    if (query.location) {
        filter.location = new RegExp(query.location, 'i');
    }

    // 2. Role-based scoping
    if (user.role === 'Department Head') {
        const employees = await Employee.find({ departmentId: user.departmentId });
        const employeeIds = employees.map(emp => emp._id);
        const activeAllocations = await Allocation.find({ 
            employeeId: { $in: employeeIds }, 
            status: 'Active' 
        });
        const assetIds = activeAllocations.map(alloc => alloc.assetId);
        filter._id = { $in: assetIds };
    } else if (user.role === 'Employee') {
        const activeAllocations = await Allocation.find({ 
            employeeId: user.id, 
            status: 'Active' 
        });
        const assetIds = activeAllocations.map(alloc => alloc.assetId);
        filter._id = { $in: assetIds };
    }

    return await Asset.find(filter).populate('categoryId');
};

const getById = async (id) => {
    const asset = await Asset.findById(id).populate('categoryId');
    if (!asset) {
        throw new AppError('Asset not found', 404);
    }

    const allocationHistory = await Allocation.find({ assetId: id })
        .populate('employeeId', 'name email')
        .populate('departmentId', 'name');

    const maintenanceHistory = await MaintenanceRequest.find({ assetId: id })
        .populate('raisedBy', 'name email')
        .populate('approvedBy', 'name email');

    return {
        asset,
        allocationHistory,
        maintenanceHistory
    };
};

const create = async (data, creatorId) => {
    const assetTag = await generateAssetTag();
    
    // Ensure assetTag cannot be overridden by input
    const cleanData = { ...data, assetTag };
    delete cleanData._id;

    const asset = await Asset.create(cleanData);

    // Call notification helper
    try {
        await createNotification({
            employeeId: creatorId,
            type: 'Asset Created',
            message: `Asset ${asset.name} (${asset.assetTag}) was successfully registered.`
        });
    } catch (err) {
        console.error('Failed to create notification on asset registration:', err);
    }

    return asset;
};

const update = async (id, updates) => {
    // Strip assetTag from updates (immutable)
    const cleanUpdates = { ...updates };
    delete cleanUpdates.assetTag;
    delete cleanUpdates._id;

    const asset = await Asset.findByIdAndUpdate(id, cleanUpdates, {
        new: true,
        runValidators: true
    });

    if (!asset) {
        throw new AppError('Asset not found', 404);
    }

    return asset;
};

const updateStatus = async (id, status) => {
    const allowedStatuses = ['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'];
    if (!allowedStatuses.includes(status)) {
        throw new AppError('Invalid asset status value', 400);
    }

    const asset = await Asset.findByIdAndUpdate(
        id, 
        { status }, 
        { new: true, runValidators: true }
    );

    if (!asset) {
        throw new AppError('Asset not found', 404);
    }

    return asset;
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    updateStatus
};
