const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  category: { type: String, required: true }, // e.g. Engine, Brakes, Suspension, Electrical, Tyres
  item: { type: String, required: true }, // e.g. Engine Oil Level, Front Brake Pads, Battery Voltage
  condition: { type: String, enum: ['GOOD', 'FAIR', 'NEEDS_ATTENTION', 'REPLACE'], required: true },
  notes: { type: String, default: '' },
});

const requestedPartSchema = new mongoose.Schema({
  partId: { type: mongoose.Schema.Types.ObjectId, ref: 'Part', required: true },
  quantity: { type: Number, default: 1, min: 1 },
  notes: { type: String, default: '' },
});

const inspectionSchema = new mongoose.Schema(
  {
    serviceJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceJob', required: true, unique: true },
    mechanicId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    checklist: [checklistItemSchema],
    overallDiagnosis: { type: String, required: true },
    recommendedRepairs: [{ type: String }],
    requestedParts: [requestedPartSchema],
    inspectionImages: [{ type: String }],
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inspection', inspectionSchema);
