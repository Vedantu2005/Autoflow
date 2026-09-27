const express = require('express');
const router = express.Router();
const { getBookings, createBooking, updateBookingStatus } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getBookings)
  .post(createBooking);

router.put('/:id/status', updateBookingStatus);

module.exports = router;
