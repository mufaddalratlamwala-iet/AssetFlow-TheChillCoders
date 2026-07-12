const mongoose = require('mongoose');

const assetCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide an asset category name'],
        unique: true,
        trim: true
    },
    customFields: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

const AssetCategory = mongoose.model('AssetCategory', assetCategorySchema);

module.exports = AssetCategory;
