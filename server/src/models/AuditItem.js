const mongoose = require('mongoose');

const auditItemSchema = new mongoose.Schema({
    auditCycleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AuditCycle',
        required: true
    },
    assetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: true
    },
    verification: {
        type: String,
        enum: ['Verified', 'Missing', 'Damaged'],
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    checkedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    checkedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const AuditItem = mongoose.model('AuditItem', auditItemSchema);

module.exports = AuditItem;
