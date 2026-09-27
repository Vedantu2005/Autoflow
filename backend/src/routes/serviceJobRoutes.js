const express = require('express');
const router = express.Router();
const {
  getServiceJobs,
  getServiceJobById,
  createServiceJob,
  updateJobStatus,
  assignMechanic,
  submitQC,
} = require('../controllers/serviceJobController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getServiceJobs)
  .post(authorize('SERVICE_ADVISOR', 'ADMIN'), createServiceJob);

router.route('/:id')
  .get(getServiceJobById);

router.put('/:id/status', updateJobStatus);
router.put('/:id/assign', authorize('SERVICE_ADVISOR', 'ADMIN', 'MECHANIC'), assignMechanic);
router.put('/:id/qc', authorize('SERVICE_ADVISOR', 'ADMIN'), submitQC);

module.exports = router;
