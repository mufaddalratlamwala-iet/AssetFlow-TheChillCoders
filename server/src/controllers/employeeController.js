const employeeService = require('../services/employeeService');
const { asyncHandler } = require('../middlewares/errorHandler');

const getEmployees = asyncHandler(async (req, res) => {
    const filters = {
        department: req.query.department,
        role: req.query.role,
        status: req.query.status
    };
    const employees = await employeeService.getAll(filters);
    res.status(200).json({ employees });
});

const updateRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const employee = await employeeService.updateRole(req.params.id, role);
    res.status(200).json({ employee });
});

module.exports = {
    getEmployees,
    updateRole
};
