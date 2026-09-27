const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    serviceJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceJob', required: true, unique: true },
    estimateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Estimate', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    
    partsSubtotal: { type: Number, required: true },
    labourSubtotal: { type: Number, required: true },
    taxPercent: { type: Number, default: 18 },
    taxAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PARTIAL', 'PAID'],
      default: 'PENDING',
    },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, required: true },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
