const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { protect, authorize } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/activityLogger');

router.use(protect);

router.route('/')
    .get(assetController.getAssets)
    .post(
        authorize('Admin', 'Asset Manager'), 
        logActivity('Asset'), 
        assetController.createAsset
    );

router.route('/:id')
    .get(assetController.getAsset)
    .patch(
        authorize('Admin', 'Asset Manager'), 
        logActivity('Asset'), 
        assetController.updateAsset
    );

router.route('/:id/status')
    .patch(
        authorize('Admin', 'Asset Manager'), 
        logActivity('Asset'), 
        assetController.updateAssetStatus
    );

module.exports = router;
