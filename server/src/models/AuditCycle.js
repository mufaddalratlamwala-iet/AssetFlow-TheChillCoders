const mongoose = require('mongoose');

const auditCycleSchema = new mongoose.Schema({
    scopeDepartmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        default: null
    },
    scopeLocation: {
        type: String,
        default: ''
    },
    dateRangeStart: {
        type: Date,
        required: true
    },
    dateRangeEnd: {
        type: Date,
        required: true
    },
    auditorIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    }],
    status: {
        type: String,
        enum: ['Open', 'Closed'],
        default: 'Open'
    },
    closedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

const AuditCycle = mongoose.model('AuditCycle', auditCycleSchema);

module.exports = AuditCycle;
