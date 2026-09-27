const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    serviceType: { type: String, required: true }, // e.g., General Service, Brake Inspection, AC Overhaul
    preferredDate: { type: Date, required: true },
    preferredTimeSlot: { type: String, required: true }, // e.g. "10:00 AM - 12:00 PM"
    customerComments: { type: String, default: '' },
    problemImages: [{ type: String }],
    status: {
      type: String,
      enum: ['BOOKED', 'CHECKED_IN', 'CANCELLED'],
      default: 'BOOKED',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
