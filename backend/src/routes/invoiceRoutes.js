const express = require('express');
const router = express.Router();
const { getInvoices, getInvoiceById, generateInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getInvoices)
  .post(authorize('SERVICE_ADVISOR', 'ADMIN'), generateInvoice);

router.get('/:id', getInvoiceById);

module.exports = router;
