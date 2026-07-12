const Employee = require('../models/Employee');
const { AppError } = require('../middlewares/errorHandler');

const getAll = async (filters = {}) => {
    const query = {};
    if (filters.department) {
        query.departmentId = filters.department;
    }
    if (filters.role) {
        query.role = filters.role;
    }
    if (filters.status) {
        query.status = filters.status;
    }

    return await Employee.find(query)
        .select('-passwordHash')
        .populate('departmentId', 'name');
};

const updateRole = async (id, newRole) => {
    const validRoles = ['Employee', 'Department Head', 'Asset Manager', 'Admin'];
    if (!validRoles.includes(newRole)) {
        throw new AppError(`Invalid role: ${newRole}. Must be one of ${validRoles.join(', ')}`, 400);
    }

    const employee = await Employee.findByIdAndUpdate(
        id,
        { role: newRole },
        { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!employee) {
        throw new AppError('Employee not found', 404);
    }

    return employee;
};

module.exports = {
    getAll,
    updateRole
};
