const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const logAudit = require('../utils/auditLogger');

// @desc    Get bookings (Customer gets own, Admin/Advisor gets all)
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res) => {
  let query = {};
  if (req.user.role === 'CUSTOMER') {
    query.customerId = req.user._id;
  }
  const bookings = await Booking.find(query)
    .populate('customerId', 'name email phone')
    .populate('vehicleId')
    .sort('-createdAt');
  res.json(bookings);
};

// @desc    Create service booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  const { vehicleId, serviceType, preferredDate, preferredTimeSlot, customerComments } = req.body;

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    return res.status(404).json({ message: 'Vehicle not found' });
  }

  // Generate unique booking number
  const count = await Booking.countDocuments();
  const bookingNumber = `BK-${1000 + count + 1}`;

  const booking = await Booking.create({
    bookingNumber,
    customerId: req.user._id,
    vehicleId,
    serviceType,
    preferredDate,
    preferredTimeSlot,
    customerComments: customerComments || '',
    status: 'BOOKED',
  });

  await logAudit(
    req.user,
    'BOOKING_CREATED',
    'Booking',
    booking._id,
    `Booked ${serviceType} for ${vehicle.registrationNumber} on ${preferredDate}`
  );

  const populatedBooking = await Booking.findById(booking._id)
    .populate('customerId', 'name email phone')
    .populate('vehicleId');

  res.status(201).json(populatedBooking);
};

// @desc    Update booking status (e.g. Cancel or Check-in)
// @route   PUT /api/bookings/:id/status
// @access  Private
const updateBookingStatus = async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  booking.status = status;
  await booking.save();

  await logAudit(req.user, 'BOOKING_STATUS_CHANGED', 'Booking', booking._id, `Booking #${booking.bookingNumber} status changed to ${status}`);

  res.json(booking);
};

module.exports = { getBookings, createBooking, updateBookingStatus };
