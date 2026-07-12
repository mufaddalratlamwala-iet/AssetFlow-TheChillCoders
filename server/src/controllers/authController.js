const authService = require('../services/authService');
const { asyncHandler } = require('../middlewares/errorHandler');

const signup = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const result = await authService.signup({ name, email, password });
    res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.status(200).json(result);
});

const getMe = asyncHandler(async (req, res) => {
    const result = await authService.getMe(req.user.id);
    res.status(200).json({ user: result });
});

module.exports = {
    signup,
    login,
    getMe
};
