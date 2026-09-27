const Estimate = require('../models/Estimate');
const ServiceJob = require('../models/ServiceJob');
const Part = require('../models/Part');
const logAudit = require('../utils/auditLogger');

// @desc    Get estimate by Service Job ID
// @route   GET /api/estimates/job/:serviceJobId
// @access  Private
const getEstimateByJobId = async (req, res) => {
  const estimate = await Estimate.findOne({ serviceJobId: req.params.serviceJobId })
    .populate('parts.partId')
    .sort('-createdAt');
  
  if (!estimate) {
    return res.status(404).json({ message: 'Estimate not found for this service job' });
  }

  res.json(estimate);
};

// @desc    Create or update Service Estimate
// @route   POST /api/estimates
// @access  Private (Advisor / Admin)
const createEstimate = async (req, res) => {
  const { serviceJobId, parts, labour, taxPercent, discountAmount } = req.body;

  const job = await ServiceJob.findById(serviceJobId);
  if (!job) {
    return res.status(404).json({ message: 'Service Job not found' });
  }

  // Calculate Parts items & subtotals
  let processedParts = [];
  let partsSubtotal = 0;

  if (parts && parts.length > 0) {
    for (const p of parts) {
      const partDoc = await Part.findById(p.partId);
      if (!partDoc) {
        return res.status(400).json({ message: `Part ID ${p.partId} not found in inventory` });
      }

      // Stock check validation
      if (partDoc.currentStock < p.quantity) {
        return res.status(400).json({
          message: `INVENTORY SHORTAGE ALERT: Cannot add ${p.quantity} units of ${partDoc.name}. Available stock: ${partDoc.currentStock}`,
        });
      }

      const unitPrice = p.unitPrice !== undefined ? p.unitPrice : partDoc.sellingPrice;
      const totalPrice = unitPrice * p.quantity;
      partsSubtotal += totalPrice;

      processedParts.push({
        partId: partDoc._id,
        partName: partDoc.name,
        partNumber: partDoc.partNumber,
        quantity: p.quantity,
        unitPrice,
        totalPrice,
      });
    }
  }

  // Calculate Labour items & subtotals
  let processedLabour = [];
  let labourSubtotal = 0;

  if (labour && labour.length > 0) {
    for (const l of labour) {
      const totalCost = l.hours * l.ratePerHour;
      labourSubtotal += totalCost;
      processedLabour.push({
        description: l.description,
        hours: l.hours,
        ratePerHour: l.ratePerHour,
        totalCost,
      });
    }
  }

  const tax = taxPercent !== undefined ? taxPercent : 18;
  const taxableAmount = Math.max(0, partsSubtotal + labourSubtotal - (discountAmount || 0));
  const taxAmount = (taxableAmount * tax) / 100;
  const grandTotal = taxableAmount + taxAmount;

  const count = await Estimate.countDocuments();
  const estimateNumber = `EST-${1000 + count + 1}`;

  let estimate = await Estimate.findOne({ serviceJobId });

  if (estimate) {
    estimate.parts = processedParts;
    estimate.labour = processedLabour;
    estimate.partsSubtotal = partsSubtotal;
    estimate.labourSubtotal = labourSubtotal;
    estimate.taxPercent = tax;
    estimate.taxAmount = taxAmount;
    estimate.discountAmount = discountAmount || 0;
    estimate.grandTotal = grandTotal;
    estimate.status = 'PENDING';
    await estimate.save();
  } else {
    estimate = await Estimate.create({
      estimateNumber,
      serviceJobId,
      parts: processedParts,
      labour: processedLabour,
      partsSubtotal,
      labourSubtotal,
      taxPercent: tax,
      taxAmount,
      discountAmount: discountAmount || 0,
      grandTotal,
      status: 'PENDING',
    });
  }

  // Update ServiceJob status to CUSTOMER_APPROVAL
  job.status = 'CUSTOMER_APPROVAL';
  job.statusHistory.push({
    status: 'CUSTOMER_APPROVAL',
    updatedBy: req.user._id,
    updatedByName: req.user.name,
    timestamp: new Date(),
    notes: `Estimate #${estimate.estimateNumber} generated (₹${grandTotal.toLocaleString('en-IN')}). Sent to customer for approval.`,
  });
  await job.save();

  await logAudit(
    req.user,
    'ESTIMATE_CREATED',
    'Estimate',
    estimate._id,
    `Generated Estimate #${estimate.estimateNumber} for Job #${job.jobNumber} total ₹${grandTotal}`
  );

  res.status(201).json(estimate);
};

// @desc    Customer Approve or Reject Estimate
// @route   PUT /api/estimates/:id/approve
// @access  Private (Customer / Advisor / Admin)
const respondToEstimate = async (req, res) => {
  const { action, rejectionReason, customerNotes } = req.body; // action: 'APPROVE' or 'REJECT'
  const estimate = await Estimate.findById(req.params.id);

  if (!estimate) {
    return res.status(404).json({ message: 'Estimate not found' });
  }

  const job = await ServiceJob.findById(estimate.serviceJobId);
  if (!job) {
    return res.status(404).json({ message: 'Associated Service Job not found' });
  }

  if (action === 'APPROVE') {
    estimate.status = 'APPROVED';
    estimate.approvedAt = new Date();
    if (customerNotes) estimate.customerNotes = customerNotes;
    await estimate.save();

    // UPDATE SERVICE JOB STATUS TO APPROVED
    job.status = 'APPROVED';
    job.statusHistory.push({
      status: 'APPROVED',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date(),
      notes: 'Customer approved repair estimate. Repairs authorized to begin.',
    });
    await job.save();

    // AUTOMATIC INVENTORY STOCK DECREMENT
    let stockLogNotes = [];
    for (const item of estimate.parts) {
      const partDoc = await Part.findById(item.partId);
      if (partDoc) {
        partDoc.currentStock = Math.max(0, partDoc.currentStock - item.quantity);
        await partDoc.save();

        stockLogNotes.push(`${partDoc.name} (-${item.quantity}, new stock: ${partDoc.currentStock})`);

        if (partDoc.currentStock <= partDoc.minStockLevel) {
          await logAudit(
            req.user,
            'LOW_STOCK_ALERT',
            'Part',
            partDoc._id,
            `WARNING: Part ${partDoc.name} (${partDoc.partNumber}) fell to low stock level: ${partDoc.currentStock} units!`
          );
        }
      }
    }

    await logAudit(
      req.user,
      'ESTIMATE_APPROVED',
      'Estimate',
      estimate._id,
      `Customer approved Estimate #${estimate.estimateNumber}. Stock decremented: ${stockLogNotes.join(', ')}`
    );

    return res.json({
      message: 'Estimate approved successfully. Parts inventory updated.',
      estimate,
      job,
    });
  } else if (action === 'REJECT') {
    estimate.status = 'REJECTED';
    estimate.rejectionReason = rejectionReason || 'Customer declined estimate.';
    await estimate.save();

    job.status = 'ESTIMATE_PENDING';
    job.statusHistory.push({
      status: 'ESTIMATE_PENDING',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date(),
      notes: `Customer rejected estimate. Reason: ${estimate.rejectionReason}`,
    });
    await job.save();

    await logAudit(
      req.user,
      'ESTIMATE_REJECTED',
      'Estimate',
      estimate._id,
      `Customer rejected Estimate #${estimate.estimateNumber}: ${estimate.rejectionReason}`
    );

    return res.json({
      message: 'Estimate rejected. Returned to Advisor for revision.',
      estimate,
      job,
    });
  } else {
    return res.status(400).json({ message: "Invalid action. Use 'APPROVE' or 'REJECT'" });
  }
};

module.exports = { getEstimateByJobId, createEstimate, respondToEstimate };
