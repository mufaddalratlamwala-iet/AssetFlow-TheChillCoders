const assetCategoryService = require('../services/assetCategoryService');
const { asyncHandler } = require('../middlewares/errorHandler');

const getCategories = asyncHandler(async (req, res) => {
    const categories = await assetCategoryService.getAll();
    res.status(200).json({ categories });
});

const createCategory = asyncHandler(async (req, res) => {
    const category = await assetCategoryService.create(req.body);
    res.status(201).json({ category });
});

const updateCategory = asyncHandler(async (req, res) => {
    const category = await assetCategoryService.update(req.params.id, req.body);
    res.status(200).json({ category });
});

module.exports = {
    getCategories,
    createCategory,
    updateCategory
};
