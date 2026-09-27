const express = require('express');
const router = express.Router();
const { processPayment, getPayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getPayments)
  .post(processPayment);

module.exports = router;
