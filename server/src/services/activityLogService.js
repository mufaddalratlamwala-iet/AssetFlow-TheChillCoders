const ActivityLog = require('../models/ActivityLog');
const Employee = require('../models/Employee');

const getAll = async (user, query = {}) => {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    // Role scoping:
    // Admin: sees all activity logs
    // Department Head: sees activity logs of employees in their department
    // Employee: sees only their own activity logs
    if (user.role === 'Admin') {
        if (query.employeeId) {
            filter.employeeId = query.employeeId;
        }
    } else if (user.role === 'Department Head' || user.role === 'Asset Manager') {
        // If it's Asset Manager, does the spec say they see all or own?
        // Spec says: "Admin: all. Dept Head: logs where employee is in their dept. Employee: own only."
        // We'll treat Department Head as seeing their department, and Asset Manager as seeing their department (or all, but let's stick exactly to the spec. Asset Manager is non-Admin, so they see department if assigned or own. Wait, let's treat Asset Manager same as Dept Head, or if no department, see own. Let's write standard logic:
        if (user.role === 'Department Head' && user.departmentId) {
            const employeesInDept = await Employee.find({ departmentId: user.departmentId }).select('_id');
            const employeeIds = employeesInDept.map(emp => emp._id);
            filter.employeeId = { $in: employeeIds };
        } else {
            filter.employeeId = user.id;
        }
    } else {
        filter.employeeId = user.id;
    }

    if (query.entityType) {
        filter.entityType = query.entityType;
    }

    if (query.action) {
        filter.action = query.action;
    }

    const total = await ActivityLog.countDocuments(filter);
    const logs = await ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('employeeId', 'name email role');

    return {
        logs,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
    };
};

module.exports = {
    getAll
};
