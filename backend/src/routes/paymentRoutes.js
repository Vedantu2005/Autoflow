const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayKey,
  processPayment,
  getPayments,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/razorpay-key', getRazorpayKey);
router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyRazorpayPayment);

router.route('/')
  .get(getPayments)
  .post(processPayment);

module.exports = router;
