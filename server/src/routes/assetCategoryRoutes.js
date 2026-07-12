const express = require('express');
const assetCategoryController = require('../controllers/assetCategoryController');
const { protect, authorize } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/activityLogger');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.get('/', assetCategoryController.getCategories);
router.post('/', logActivity('AssetCategory'), assetCategoryController.createCategory);
router.patch('/:id', logActivity('AssetCategory'), assetCategoryController.updateCategory);

module.exports = router;
