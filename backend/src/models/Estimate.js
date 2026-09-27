const mongoose = require('mongoose');

const estimatePartSchema = new mongoose.Schema({
  partId: { type: mongoose.Schema.Types.ObjectId, ref: 'Part', required: true },
  partName: { type: String, required: true },
  partNumber: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
});

const estimateLabourSchema = new mongoose.Schema({
  description: { type: String, required: true },
  hours: { type: Number, required: true, min: 0.1 },
  ratePerHour: { type: Number, required: true },
  totalCost: { type: Number, required: true },
});

const estimateSchema = new mongoose.Schema(
  {
    estimateNumber: { type: String, required: true, unique: true },
    serviceJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceJob', required: true },
    parts: [estimatePartSchema],
    labour: [estimateLabourSchema],
    partsSubtotal: { type: Number, required: true, default: 0 },
    labourSubtotal: { type: Number, required: true, default: 0 },
    taxPercent: { type: Number, default: 18 },
    taxAmount: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'REVISED'],
      default: 'PENDING',
    },
    customerNotes: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Estimate', estimateSchema);
