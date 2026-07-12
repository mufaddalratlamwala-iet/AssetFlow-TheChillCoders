const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    resourceAssetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: [true, 'Resource asset reference is required']
    },
    bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'Employee who booked is required']
    },
    startTime: {
        type: Date,
        required: [true, 'Start time is required']
    },
    endTime: {
        type: Date,
        required: [true, 'End time is required']
    },
    status: {
        type: String,
        enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
        default: 'Upcoming'
    }
}, {
    timestamps: true
});

// Compound index for booking overlaps checking and faster queries
bookingSchema.index({ resourceAssetId: 1, startTime: 1, endTime: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
