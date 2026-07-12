const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const { AppError } = require('../middlewares/errorHandler');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

const signup = async ({ name, email, password }) => {
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
        throw new AppError('Email is already in use', 409);
    }

    const employee = await Employee.create({
        name,
        email,
        passwordHash: password
    });

    const token = generateToken(employee._id, employee.role);

    const user = employee.toObject();
    delete user.passwordHash;

    return { token, user };
};

const login = async ({ email, password }) => {
    const employee = await Employee.findOne({ email });
    if (!employee || !employee.comparePassword(password)) {
        throw new AppError('Invalid email or password', 401);
    }

    if (employee.status !== 'Active') {
        throw new AppError('User account is inactive. Please contact an administrator.', 403);
    }

    const token = generateToken(employee._id, employee.role);

    const user = employee.toObject();
    delete user.passwordHash;

    return { token, user };
};

const getMe = async (userId) => {
    const employee = await Employee.findById(userId).select('-passwordHash');
    if (!employee) {
        throw new AppError('User not found', 404);
    }
    return employee;
};

module.exports = {
    signup,
    login,
    getMe
};
