const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const ServiceJob = require('../models/ServiceJob');
const logAudit = require('../utils/auditLogger');

// @desc    Process simulated payment for an invoice
// @route   POST /api/payments
// @access  Private
const processPayment = async (req, res) => {
  const { invoiceId, amount, paymentMethod, transactionRef } = req.body;

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  const payAmount = Number(amount);
  if (isNaN(payAmount) || payAmount <= 0) {
    return res.status(400).json({ message: 'Invalid payment amount' });
  }

  const count = await Payment.countDocuments();
  const paymentNumber = `PAY-${1000 + count + 1}`;
  const ref = transactionRef || `TXN-${Date.now()}`;

  const payment = await Payment.create({
    paymentNumber,
    invoiceId,
    serviceJobId: invoice.serviceJobId,
    customerId: invoice.customerId,
    amount: payAmount,
    paymentMethod: paymentMethod || 'UPI',
    transactionRef: ref,
    status: 'SUCCESS',
    paidAt: new Date(),
  });

  // Update Invoice payment progress
  invoice.paidAmount += payAmount;
  invoice.dueAmount = Math.max(0, invoice.grandTotal - invoice.paidAmount);

  if (invoice.paidAmount >= invoice.grandTotal) {
    invoice.paymentStatus = 'PAID';
  } else {
    invoice.paymentStatus = 'PARTIAL';
  }

  await invoice.save();

  // If fully paid, update job status to READY_FOR_DELIVERY (if not already completed)
  const job = await ServiceJob.findById(invoice.serviceJobId);
  if (job && job.status !== 'COMPLETED' && invoice.paymentStatus === 'PAID') {
    if (job.status !== 'READY_FOR_DELIVERY') {
      job.status = 'READY_FOR_DELIVERY';
      job.statusHistory.push({
        status: 'READY_FOR_DELIVERY',
        updatedBy: req.user._id,
        updatedByName: req.user.name,
        timestamp: new Date(),
        notes: `Payment settled in full via ${payment.paymentMethod}. Ready for delivery desk.`,
      });
      await job.save();
    }
  }

  await logAudit(
    req.user,
    'PAYMENT_PROCESSED',
    'Payment',
    payment._id,
    `Processed payment of ₹${payAmount} via ${payment.paymentMethod} for Invoice #${invoice.invoiceNumber}. Status: ${invoice.paymentStatus}`
  );

  res.status(201).json({
    payment,
    invoice,
  });
};

// @desc    Get payment history for an invoice or customer
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
  let query = {};
  if (req.user.role === 'CUSTOMER') {
    query.customerId = req.user._id;
  }
  if (req.query.invoiceId) {
    query.invoiceId = req.query.invoiceId;
  }

  const payments = await Payment.find(query)
    .populate('customerId', 'name email phone')
    .populate('invoiceId')
    .sort('-createdAt');

  res.json(payments);
};

module.exports = { processPayment, getPayments };
