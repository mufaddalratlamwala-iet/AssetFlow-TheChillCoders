const mongoose = require('mongoose');

const transferRequestSchema = new mongoose.Schema({
    assetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: true
    },
    fromEmployeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    toEmployeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    reason: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Requested', 'Approved', 'Rejected', 'Reallocated'],
        default: 'Requested'
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null
    }
}, {
    timestamps: true
});

const TransferRequest = mongoose.model('TransferRequest', transferRequestSchema);

module.exports = TransferRequest;
