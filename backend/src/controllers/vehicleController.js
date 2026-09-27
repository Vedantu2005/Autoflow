const Vehicle = require('../models/Vehicle');
const ServiceJob = require('../models/ServiceJob');
const logAudit = require('../utils/auditLogger');

// @desc    Get vehicles (Customer gets own, Admin/Advisor gets all or filtered)
// @route   GET /api/vehicles
// @access  Private
const getVehicles = async (req, res) => {
  let query = {};
  if (req.user.role === 'CUSTOMER') {
    query.customerId = req.user._id;
  }
  const vehicles = await Vehicle.find(query).populate('customerId', 'name email phone').sort('-createdAt');
  res.json(vehicles);
};

// @desc    Get single vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Private
const getVehicleById = async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id).populate('customerId', 'name email phone');
  if (!vehicle) {
    return res.status(404).json({ message: 'Vehicle not found' });
  }
  res.json(vehicle);
};

// @desc    Add new vehicle
// @route   POST /api/vehicles
// @access  Private
const createVehicle = async (req, res) => {
  const { registrationNumber, make, model, year, fuelType, mileage, vin, customerId } = req.body;

  const regNumUpper = registrationNumber.toUpperCase().trim();
  const existingVehicle = await Vehicle.findOne({ registrationNumber: regNumUpper });

  if (existingVehicle) {
    return res.status(400).json({ message: `Vehicle with registration number ${regNumUpper} is already registered` });
  }

  // If customer is registering, assign to themselves; if staff, assign to provided customerId or themselves
  const targetCustomer = req.user.role === 'CUSTOMER' ? req.user._id : (customerId || req.user._id);

  const vehicle = await Vehicle.create({
    customerId: targetCustomer,
    registrationNumber: regNumUpper,
    make,
    model,
    year,
    fuelType: fuelType || 'PETROL',
    mileage: mileage || 0,
    vin: vin || '',
  });

  await logAudit(req.user, 'VEHICLE_REGISTERED', 'Vehicle', vehicle._id, `Registered vehicle ${vehicle.registrationNumber} (${vehicle.make} ${vehicle.model})`);

  res.status(201).json(vehicle);
};

// @desc    Update vehicle details
// @route   PUT /api/vehicles/:id
// @access  Private
const updateVehicle = async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    return res.status(404).json({ message: 'Vehicle not found' });
  }

  if (req.user.role === 'CUSTOMER' && vehicle.customerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Unauthorized to modify this vehicle' });
  }

  const { registrationNumber, make, model, year, fuelType, mileage, vin } = req.body;

  if (registrationNumber) {
    vehicle.registrationNumber = registrationNumber.toUpperCase().trim();
  }
  vehicle.make = make || vehicle.make;
  vehicle.model = model || vehicle.model;
  vehicle.year = year || vehicle.year;
  vehicle.fuelType = fuelType || vehicle.fuelType;
  vehicle.mileage = mileage !== undefined ? mileage : vehicle.mileage;
  vehicle.vin = vin || vehicle.vin;

  const updatedVehicle = await vehicle.save();
  await logAudit(req.user, 'VEHICLE_UPDATED', 'Vehicle', vehicle._id, `Updated details for ${vehicle.registrationNumber}`);

  res.json(updatedVehicle);
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private
const deleteVehicle = async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    return res.status(404).json({ message: 'Vehicle not found' });
  }

  if (req.user.role === 'CUSTOMER' && vehicle.customerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Unauthorized to delete this vehicle' });
  }

  // Check if vehicle has active service jobs (in progress)
  const activeJobs = await ServiceJob.find({
    vehicleId: vehicle._id,
    status: { $nin: ['COMPLETED', 'CANCELLED'] },
  });

  if (activeJobs.length > 0) {
    return res.status(400).json({
      message: `Cannot delete vehicle with active service jobs in progress (#${activeJobs.map((j) => j.jobNumber).join(', ')})`,
    });
  }

  const regNo = vehicle.registrationNumber;
  await vehicle.deleteOne();
  await logAudit(req.user, 'VEHICLE_DELETED', 'Vehicle', vehicle._id, `Deleted vehicle ${regNo}`);

  res.json({ message: `Vehicle ${regNo} removed successfully` });
};

// @desc    Get vehicle service history
// @route   GET /api/vehicles/:id/history
// @access  Private
const getVehicleHistory = async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    return res.status(404).json({ message: 'Vehicle not found' });
  }

  const jobs = await ServiceJob.find({ vehicleId: vehicle._id })
    .populate('mechanicId', 'name email phone')
    .sort('-createdAt');

  res.json({
    vehicle,
    jobs,
  });
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleHistory,
};
