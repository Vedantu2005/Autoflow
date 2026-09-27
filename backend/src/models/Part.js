const mongoose = require('mongoose');

const partSchema = new mongoose.Schema(
  {
    partNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['Engine', 'Brakes', 'Suspension', 'Electrical', 'Fluids', 'Transmission', 'Body', 'General'],
      default: 'General',
    },
    supplier: { type: String, default: 'AutoFlow OEM Parts' },
    purchasePrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    currentStock: { type: Number, required: true, default: 0 },
    minStockLevel: { type: Number, required: true, default: 5 },
    unit: { type: String, default: 'pcs' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Part', partSchema);
