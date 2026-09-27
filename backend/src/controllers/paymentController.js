const crypto = require('crypto');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const ServiceJob = require('../models/ServiceJob');
const User = require('../models/User');
const razorpay = require('../config/razorpay');
const logAudit = require('../utils/auditLogger');

// @desc    Get Razorpay public key ID for checkout initialization
// @route   GET /api/payments/razorpay-key
// @access  Private
const getRazorpayKey = async (req, res) => {
  res.json({
    keyId: process.env.RAZORPAY_KEY_ID,
  });
};

// @desc    Create Razorpay Order for an invoice settlement
// @route   POST /api/payments/create-order
// @access  Private
const createRazorpayOrder = async (req, res) => {
  try {
    const { invoiceId, amount } = req.body;

    const invoice = await Invoice.findById(invoiceId).populate('customerId', 'name email phone');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.paymentStatus === 'PAID') {
      return res.status(400).json({ message: 'Invoice is already settled in full' });
    }

    // Determine amount to charge
    let payAmount = Number(amount);
    if (!payAmount || isNaN(payAmount) || payAmount <= 0) {
      payAmount = invoice.dueAmount > 0 ? invoice.dueAmount : invoice.grandTotal;
    }

    if (payAmount > invoice.dueAmount) {
      return res.status(400).json({
        message: `Amount (₹${payAmount}) exceeds invoice due amount (₹${invoice.dueAmount})`,
      });
    }

    // Amount in paise for Razorpay
    const amountInPaise = Math.round(payAmount * 100);

    // Short receipt max 40 chars
    const shortReceipt = `rcpt_${invoice.invoiceNumber || 'INV'}_${Date.now()}`.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 40);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: shortReceipt,
      notes: {
        invoiceId: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        serviceJobId: invoice.serviceJobId.toString(),
      },
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      invoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        grandTotal: invoice.grandTotal,
        paidAmount: invoice.paidAmount,
        dueAmount: invoice.dueAmount,
      },
      customer: {
        name: invoice.customerId?.name || req.user.name,
        email: invoice.customerId?.email || req.user.email,
        phone: invoice.customerId?.phone || req.user.phone || '9999999999',
      },
    });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    res.status(500).json({
      message: error?.error?.description || error.message || 'Failed to initiate Razorpay order',
    });
  }
};

// @desc    Verify Razorpay payment signature & finalize invoice settlement
// @route   POST /api/payments/verify
// @access  Private
const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      invoiceId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
    } = req.body;

    if (!invoiceId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing Razorpay verification parameters' });
    }

    // Verify HMAC-SHA256 signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'Razorpay secret key not configured on server' });
    }
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Razorpay signature verification failed. Fraud protection alert.' });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const payAmount = Number(amount) || invoice.dueAmount;
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount received' });
    }

    const count = await Payment.countDocuments();
    const paymentNumber = `PAY-${1000 + count + 1}`;

    const payment = await Payment.create({
      paymentNumber,
      invoiceId: invoice._id,
      serviceJobId: invoice.serviceJobId,
      customerId: invoice.customerId,
      amount: payAmount,
      paymentMethod: 'RAZORPAY',
      transactionRef: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
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

    // If fully paid, advance service job status to READY_FOR_DELIVERY
    const job = await ServiceJob.findById(invoice.serviceJobId);
    if (job && job.status !== 'COMPLETED' && invoice.paymentStatus === 'PAID') {
      if (job.status !== 'READY_FOR_DELIVERY') {
        job.status = 'READY_FOR_DELIVERY';
        job.statusHistory.push({
          status: 'READY_FOR_DELIVERY',
          updatedBy: req.user._id,
          updatedByName: req.user.name,
          timestamp: new Date(),
          notes: `Settled via Razorpay (Payment ID: ${razorpay_payment_id}). Ready for delivery desk.`,
        });
        await job.save();
      }
    }

    await logAudit(
      req.user,
      'PAYMENT_PROCESSED',
      'Payment',
      payment._id,
      `Settled payment of ₹${payAmount} via Razorpay (Txn: ${razorpay_payment_id}) for Invoice #${invoice.invoiceNumber}. Status: ${invoice.paymentStatus}`
    );

    res.status(200).json({
      success: true,
      message: 'Razorpay payment verified and invoice settled successfully',
      payment,
      invoice,
    });
  } catch (error) {
    console.error('Razorpay Payment Verification Error:', error);
    res.status(500).json({ message: error.message || 'Payment verification failed' });
  }
};

// @desc    Process simulated / manual payment (Cash Desk or offline fallbacks)
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
    paymentMethod: paymentMethod || 'CASH',
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

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayKey,
  processPayment,
  getPayments,
};
