const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  getStaff,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

router.get('/staff', protect, getStaff);
router.post('/staff', protect, authorize('ADMIN'), createStaffMember);
router.put('/staff/:id', protect, authorize('ADMIN'), updateStaffMember);
router.delete('/staff/:id', protect, authorize('ADMIN'), deleteStaffMember);

module.exports = router;
