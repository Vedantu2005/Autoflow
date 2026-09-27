const express = require('express');
const router = express.Router();
const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleHistory,
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getVehicles)
  .post(createVehicle);

router.route('/:id')
  .get(getVehicleById)
  .put(updateVehicle)
  .delete(deleteVehicle);

router.get('/:id/history', getVehicleHistory);

module.exports = router;
