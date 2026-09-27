const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registrationNumber: { type: String, required: true, uppercase: true, unique: true, trim: true },
    make: { type: String, required: true }, // e.g. Honda, Toyota, Hyundai, Maruti
    model: { type: String, required: true }, // e.g. City, Fortuner, Creta, Swift
    year: { type: Number, required: true },
    color: { type: String, default: 'Black' },
    vin: { type: String, default: '' },
    fuelType: {
      type: String,
      enum: ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG'],
      default: 'PETROL',
    },
    mileage: { type: Number, default: 0 }, // Odometer reading in KM
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
