const mongoose = require('mongoose');

const aiJobSchema = new mongoose.Schema({
    feature: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'succeeded', 'failed'],
        default: 'pending'
    },
    inputRef: {
        type: String,
        default: ''
    },
    output: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    completedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

const AiJob = mongoose.model('AiJob', aiJobSchema);

module.exports = AiJob;
