const express = require('express');
const router = express.Router();
const { getEstimateByJobId, createEstimate, respondToEstimate } = require('../controllers/estimateController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/job/:serviceJobId', getEstimateByJobId);
router.post('/', authorize('SERVICE_ADVISOR', 'ADMIN'), createEstimate);
router.put('/:id/approve', respondToEstimate);

module.exports = router;
