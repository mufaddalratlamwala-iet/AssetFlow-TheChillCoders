const Booking = require('../models/Booking');
const Asset = require('../models/Asset');
const logActivity = require('../utils/logActivity');

exports.getBookings = async (req, res) => {
  try {
    const { resource_asset_id, date } = req.query;
    
    let filter = {};
    if (resource_asset_id) {
      filter.resourceAssetId = resource_asset_id;
    }
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      filter.startTime = { $gte: startOfDay, $lte: endOfDay };
    }

    const bookings = await Booking.find(filter).populate('bookedBy', 'name email');
    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const { resourceAssetId, startTime, endTime } = req.body;

    // Validate times
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ error: 'startTime must be before endTime' });
    }

    // Check if asset exists
    const asset = await Asset.findById(resourceAssetId);
    if (!asset) {
      return res.status(400).json({ error: 'Asset not found' });
    }

    // Check for overlaps
    const overlap = await Booking.findOne({
      resourceAssetId,
      status: { $ne: 'Cancelled' },
      startTime: { $lt: new Date(endTime) },
      endTime: { $gt: new Date(startTime) }
    }).populate('bookedBy', 'name');

    if (overlap) {
      return res.status(409).json({
        error: 'Overlapping booking',
        conflicting_booking: {
          startTime: overlap.startTime,
          endTime: overlap.endTime,
          bookedBy: overlap.bookedBy.name
        }
      });
    }

    // Allow Admin/Asset Manager/Dept Head to override bookedBy, otherwise it's self
    let bookedBy = req.user.id;
    if (req.body.bookedBy && ['Admin', 'Asset Manager', 'Department Head'].includes(req.user.role)) {
      bookedBy = req.body.bookedBy;
    }

    const booking = await Booking.create({
      resourceAssetId,
      bookedBy,
      startTime,
      endTime,
      status: 'Upcoming'
    });

    await logActivity(req, 'CREATE_BOOKING', 'Booking', booking._id);

    return res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    booking.status = 'Cancelled';
    await booking.save();
    
    await logActivity(req, 'CANCEL_BOOKING', 'Booking', booking._id);
    return res.status(200).json(booking);
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.rescheduleBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime } = req.body;
    
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ error: 'startTime must be before endTime' });
    }

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Check for overlaps excluding self
    const overlap = await Booking.findOne({
      _id: { $ne: id },
      resourceAssetId: booking.resourceAssetId,
      status: { $ne: 'Cancelled' },
      startTime: { $lt: new Date(endTime) },
      endTime: { $gt: new Date(startTime) }
    }).populate('bookedBy', 'name');

    if (overlap) {
      return res.status(409).json({
        error: 'Overlapping booking',
        conflicting_booking: {
          startTime: overlap.startTime,
          endTime: overlap.endTime,
          bookedBy: overlap.bookedBy.name
        }
      });
    }

    booking.startTime = startTime;
    booking.endTime = endTime;
    await booking.save();
    
    await logActivity(req, 'RESCHEDULE_BOOKING', 'Booking', booking._id);
    return res.status(200).json(booking);
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
