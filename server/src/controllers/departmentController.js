const departmentService = require('../services/departmentService');
const { asyncHandler } = require('../middlewares/errorHandler');

const getDepartments = asyncHandler(async (req, res) => {
    const departments = await departmentService.getAll();
    res.status(200).json({ departments });
});

const createDepartment = asyncHandler(async (req, res) => {
    const department = await departmentService.create(req.body);
    res.status(201).json({ department });
});

const updateDepartment = asyncHandler(async (req, res) => {
    const department = await departmentService.update(req.params.id, req.body);
    res.status(200).json({ department });
});

module.exports = {
    getDepartments,
    createDepartment,
    updateDepartment
};
