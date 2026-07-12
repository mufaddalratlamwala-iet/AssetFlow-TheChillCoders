const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const requireRole = require('../middlewares/requireRole');
const { protect } = require('../middlewares/auth');
const scopeToDepartment = require('../middlewares/scopeToDepartment');
const Booking = require('../models/Booking');

// For ownership/scope checks on cancellation and rescheduling
const getBookingDeptId = async (req) => {
  const booking = await Booking.findById(req.params.id).populate('bookedBy');
  return booking ? booking.bookedBy.departmentId : null;
};

// Custom middleware to check if user owns the booking or has higher role
const checkBookingOwnership = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    if (String(booking.bookedBy) === String(req.user.id) || ['Admin', 'Asset Manager'].includes(req.user.role)) {
      return next();
    }
    
    // If Dept Head, fallback to scopeToDepartment logic
    if (req.user.role === 'Department Head') {
      return scopeToDepartment(getBookingDeptId)(req, res, next);
    }
    
    return res.status(403).json({ error: 'Forbidden: You do not own this booking' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

router.use(protect); // Secure all routes

router.get('/', bookingController.getBookings);
router.post('/', bookingController.createBooking);
router.patch('/:id/cancel', checkBookingOwnership, bookingController.cancelBooking);
router.patch('/:id/reschedule', checkBookingOwnership, bookingController.rescheduleBooking);

module.exports = router;
