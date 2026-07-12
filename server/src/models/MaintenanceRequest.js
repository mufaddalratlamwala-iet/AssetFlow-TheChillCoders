const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema({
    assetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: [true, 'Asset reference is required']
    },
    raisedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'Employee who raised the request is required']
    },
    issueDescription: {
        type: String,
        required: [true, 'Please provide an issue description']
    },
    photoUrl: {
        type: String,
        default: ''
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Technician Assigned', 'In Progress', 'Resolved'],
        default: 'Pending'
    },
    technicianName: {
        type: String,
        default: ''
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null
    },
    resolvedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

const MaintenanceRequest = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);

module.exports = MaintenanceRequest;
