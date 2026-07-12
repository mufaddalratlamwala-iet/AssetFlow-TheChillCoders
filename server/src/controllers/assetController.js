const assetService = require('../services/assetService');
const { asyncHandler } = require('../middlewares/errorHandler');

const getAssets = asyncHandler(async (req, res) => {
    const assets = await assetService.getAll(req.query, req.user);
    res.status(200).json({ assets });
});

const getAsset = asyncHandler(async (req, res) => {
    const assetDetails = await assetService.getById(req.params.id);
    res.status(200).json(assetDetails);
});

const createAsset = asyncHandler(async (req, res) => {
    const asset = await assetService.create(req.body, req.user.id);
    res.status(201).json({ asset });
});

const updateAsset = asyncHandler(async (req, res) => {
    const asset = await assetService.update(req.params.id, req.body);
    res.status(200).json({ asset });
});

const updateAssetStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const asset = await assetService.updateStatus(req.params.id, status);
    res.status(200).json({ asset });
});

module.exports = {
    getAssets,
    getAsset,
    createAsset,
    updateAsset,
    updateAssetStatus
};
