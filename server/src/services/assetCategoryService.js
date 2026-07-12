const AssetCategory = require('../models/AssetCategory');
const { AppError } = require('../middlewares/errorHandler');

const getAll = async () => {
    return await AssetCategory.find();
};

const create = async (data) => {
    try {
        return await AssetCategory.create(data);
    } catch (error) {
        if (error.code === 11000) {
            throw new AppError('Asset category with this name already exists', 409);
        }
        throw error;
    }
};

const update = async (id, updates) => {
    try {
        const category = await AssetCategory.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        });
        if (!category) {
            throw new AppError('Asset category not found', 404);
        }
        return category;
    } catch (error) {
        if (error.code === 11000) {
            throw new AppError('Asset category with this name already exists', 409);
        }
        throw error;
    }
};

module.exports = {
    getAll,
    create,
    update
};
