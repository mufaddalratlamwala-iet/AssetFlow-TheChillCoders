const mongoose = require('mongoose');
const Asset = require('../models/Asset');
const Allocation = require('../models/Allocation');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Booking = require('../models/Booking');

const getUtilization = async (departmentId = null) => {
    const pipeline = [];
    if (departmentId) {
        pipeline.push(
            {
                $lookup: {
                    from: 'allocations',
                    localField: '_id',
                    foreignField: 'assetId',
                    as: 'allocations'
                }
            },
            {
                $match: {
                    allocations: {
                        $elemMatch: {
                            departmentId: new mongoose.Types.ObjectId(departmentId),
                            status: 'Active'
                        }
                    }
                }
            }
        );
    }
    pipeline.push(
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                status: '$_id',
                count: 1
            }
        }
    );
    return await Asset.aggregate(pipeline);
};

const getMaintenanceFrequency = async (departmentId = null) => {
    const pipeline = [];
    if (departmentId) {
        pipeline.push(
            {
                $lookup: {
                    from: 'allocations',
                    localField: 'assetId',
                    foreignField: 'assetId',
                    as: 'allocations'
                }
            },
            {
                $match: {
                    allocations: {
                        $elemMatch: {
                            departmentId: new mongoose.Types.ObjectId(departmentId),
                            status: 'Active'
                        }
                    }
                }
            }
        );
    }
    pipeline.push(
        {
            $group: {
                _id: {
                    month: { $month: '$createdAt' },
                    year: { $year: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                month: '$_id.month',
                year: '$_id.year',
                count: 1
            }
        },
        {
            $sort: { year: 1, month: 1 }
        }
    );
    return await MaintenanceRequest.aggregate(pipeline);
};

const getDepartmentSummary = async () => {
    const pipeline = [
        {
            $match: {
                status: 'Active',
                departmentId: { $ne: null }
            }
        },
        {
            $group: {
                _id: '$departmentId',
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'departments',
                localField: '_id',
                foreignField: '_id',
                as: 'department'
            }
        },
        {
            $unwind: '$department'
        },
        {
            $project: {
                _id: 0,
                departmentId: '$_id',
                departmentName: '$department.name',
                count: 1
            }
        }
    ];
    return await Allocation.aggregate(pipeline);
};

const getBookingHeatmap = async () => {
    const pipeline = [
        {
            $project: {
                dayOfWeek: { $dayOfWeek: '$startTime' },
                hour: { $hour: '$startTime' }
            }
        },
        {
            $group: {
                _id: {
                    dayOfWeek: '$dayOfWeek',
                    hour: '$hour'
                },
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                dayOfWeek: '$_id.dayOfWeek',
                hour: '$_id.hour',
                count: 1
            }
        }
    ];
    return await Booking.aggregate(pipeline);
};

module.exports = {
    getUtilization,
    getMaintenanceFrequency,
    getDepartmentSummary,
    getBookingHeatmap
};
