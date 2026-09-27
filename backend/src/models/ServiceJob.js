const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedByName: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
});

const serviceJobSchema = new mongoose.Schema(
  {
    jobNumber: { type: String, required: true, unique: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    advisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mechanicId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    serviceType: { type: String, required: true },
    
    // Check-in details
    checkInDetails: {
      odometer: { type: Number, required: true },
      fuelLevelPercent: { type: Number, required: true },
      existingDamages: [{ type: String }],
      checkInNotes: { type: String, default: '' },
      checkInTime: { type: Date, default: Date.now },
    },

    status: {
      type: String,
      enum: [
        'CHECKED_IN',
        'INSPECTION',
        'ESTIMATE_PENDING',
        'CUSTOMER_APPROVAL',
        'APPROVED',
        'IN_SERVICE',
        'QUALITY_CHECK',
        'READY_FOR_DELIVERY',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'CHECKED_IN',
    },

    statusHistory: [statusHistorySchema],

    // QC Details
    qcDetails: {
      passed: { type: Boolean, default: false },
      checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      checkedByName: { type: String, default: '' },
      notes: { type: String, default: '' },
      timestamp: { type: Date },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceJob', serviceJobSchema);
