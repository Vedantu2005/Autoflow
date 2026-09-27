const Invoice = require('../models/Invoice');
const ServiceJob = require('../models/ServiceJob');
const Estimate = require('../models/Estimate');
const logAudit = require('../utils/auditLogger');

// @desc    Get all invoices or customer invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
  let query = {};
  if (req.user.role === 'CUSTOMER') {
    query.customerId = req.user._id;
  }

  const invoices = await Invoice.find(query)
    .populate('customerId', 'name email phone')
    .populate('vehicleId')
    .populate('serviceJobId')
    .sort('-createdAt');

  res.json(invoices);
};

// @desc    Get single invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('customerId', 'name email phone')
    .populate('vehicleId')
    .populate('serviceJobId')
    .populate('estimateId');

  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  res.json(invoice);
};

// @desc    Generate final invoice from completed estimate
// @route   POST /api/invoices
// @access  Private (Advisor / Admin)
const generateInvoice = async (req, res) => {
  const { serviceJobId } = req.body;

  const job = await ServiceJob.findById(serviceJobId);
  if (!job) {
    return res.status(404).json({ message: 'Service Job not found' });
  }

  const estimate = await Estimate.findOne({ serviceJobId });
  if (!estimate || estimate.status !== 'APPROVED') {
    return res.status(400).json({ message: 'Cannot generate invoice without an APPROVED estimate' });
  }

  let existingInvoice = await Invoice.findOne({ serviceJobId });
  if (existingInvoice) {
    return res.json(existingInvoice);
  }

  const count = await Invoice.countDocuments();
  const invoiceNumber = `INV-${1000 + count + 1}`;

  const invoice = await Invoice.create({
    invoiceNumber,
    serviceJobId,
    estimateId: estimate._id,
    customerId: job.customerId,
    vehicleId: job.vehicleId,
    partsSubtotal: estimate.partsSubtotal,
    labourSubtotal: estimate.labourSubtotal,
    taxPercent: estimate.taxPercent,
    taxAmount: estimate.taxAmount,
    discountAmount: estimate.discountAmount,
    grandTotal: estimate.grandTotal,
    paymentStatus: 'PENDING',
    paidAmount: 0,
    dueAmount: estimate.grandTotal,
    issuedAt: new Date(),
  });

  await logAudit(
    req.user,
    'INVOICE_GENERATED',
    'Invoice',
    invoice._id,
    `Issued Invoice #${invoice.invoiceNumber} for ₹${estimate.grandTotal}`
  );

  res.status(201).json(invoice);
};

module.exports = { getInvoices, getInvoiceById, generateInvoice };
