const express = require('express');
const router = express.Router();
const { getInspectionByJobId, saveInspection } = require('../controllers/inspectionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/job/:serviceJobId', getInspectionByJobId);
router.post('/', saveInspection);

module.exports = router;
