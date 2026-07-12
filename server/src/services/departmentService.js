const Department = require('../models/Department');
const { AppError } = require('../middlewares/errorHandler');

const getAll = async () => {
    return await Department.find()
        .populate('headEmployeeId', 'name email')
        .populate('parentDepartmentId', 'name');
};

const create = async (data) => {
    return await Department.create(data);
};

const update = async (id, updates) => {
    const department = await Department.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true
    });
    if (!department) {
        throw new AppError('Department not found', 404);
    }
    return department;
};

module.exports = {
    getAll,
    create,
    update
};
