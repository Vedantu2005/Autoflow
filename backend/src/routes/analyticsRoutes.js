const express = require('express');
const router = express.Router();
const { getDashboardMetrics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.get('/dashboard', authorize('ADMIN', 'SERVICE_ADVISOR'), getDashboardMetrics);

module.exports = router;
