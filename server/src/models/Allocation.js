const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
    assetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: [true, 'Asset reference is required']
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'Employee reference is required']
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        default: null
    },
    allocatedAt: {
        type: Date,
        default: Date.now
    },
    expectedReturnDate: {
        type: Date,
        default: null
    },
    returnedAt: {
        type: Date,
        default: null
    },
    returnConditionNotes: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Active', 'Returned', 'Overdue'],
        default: 'Active'
    }
}, {
    timestamps: true
});

// Partial unique index: only allow one active allocation per asset
allocationSchema.index(
    { assetId: 1 },
    { 
        unique: true, 
        partialFilterExpression: { status: 'Active' } 
    }
);

const Allocation = mongoose.model('Allocation', allocationSchema);

module.exports = Allocation;
