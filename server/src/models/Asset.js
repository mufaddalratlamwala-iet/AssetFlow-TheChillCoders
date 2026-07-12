const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    assetTag: {
        type: String,
        required: [true, 'Asset tag is required'],
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Please provide an asset name'],
        trim: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AssetCategory',
        default: null
    },
    serialNumber: {
        type: String,
        default: ''
    },
    qrCode: {
        type: String,
        default: ''
    },
    acquisitionDate: {
        type: Date,
        default: null
    },
    acquisitionCost: {
        type: Number,
        default: 0
    },
    condition: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    isBookable: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'],
        default: 'Available'
    },
    photoUrl: {
        type: String,
        default: ''
    },
    documentUrls: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
});

const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset;
