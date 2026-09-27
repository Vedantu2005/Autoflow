const express = require('express');
const router = express.Router();
const { getParts, getLowStockParts, createPart, updatePart, deletePart } = require('../controllers/partController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/low-stock', authorize('SERVICE_ADVISOR', 'ADMIN'), getLowStockParts);

router.route('/')
  .get(getParts)
  .post(authorize('ADMIN'), createPart);

router.route('/:id')
  .put(authorize('SERVICE_ADVISOR', 'ADMIN'), updatePart)
  .delete(authorize('ADMIN'), deletePart);

module.exports = router;
