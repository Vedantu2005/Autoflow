const ServiceJob = require('../models/ServiceJob');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Invoice = require('../models/Invoice');
const Estimate = require('../models/Estimate');
const logAudit = require('../utils/auditLogger');

// @desc    Get all service jobs with filters
// @route   GET /api/service-jobs
// @access  Private
const getServiceJobs = async (req, res) => {
  let query = {};

  if (req.user.role === 'CUSTOMER') {
    query.customerId = req.user._id;
  } else if (req.user.role === 'MECHANIC') {
    if (req.query.scope !== 'all') {
      query.mechanicId = req.user._id;
    }
  }

  if (req.query.status) {
    query.status = req.query.status;
  }

  const jobs = await ServiceJob.find(query)
    .populate('customerId', 'name email phone')
    .populate('vehicleId')
    .populate('advisorId', 'name email phone')
    .populate('mechanicId', 'name email phone specialization')
    .sort('-createdAt');

  res.json(jobs);
};

// @desc    Get single service job by ID
// @route   GET /api/service-jobs/:id
// @access  Private
const getServiceJobById = async (req, res) => {
  const job = await ServiceJob.findById(req.params.id)
    .populate('customerId', 'name email phone')
    .populate('vehicleId')
    .populate('advisorId', 'name email phone')
    .populate('mechanicId', 'name email phone specialization');

  if (!job) {
    return res.status(404).json({ message: 'Service Job not found' });
  }

  res.json(job);
};

// @desc    Create service job card (Vehicle Check-in)
// @route   POST /api/service-jobs
// @access  Private (Service Advisor / Admin)
const createServiceJob = async (req, res) => {
  const { bookingId, vehicleId, customerId, mechanicId, serviceType, odometer, fuelLevelPercent, existingDamages, checkInNotes } = req.body;

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    return res.status(404).json({ message: 'Vehicle not found' });
  }

  // Update vehicle mileage
  if (odometer) {
    vehicle.mileage = odometer;
    await vehicle.save();
  }

  const count = await ServiceJob.countDocuments();
  const jobNumber = `SJ-${1000 + count + 1}`;

  const job = await ServiceJob.create({
    jobNumber,
    bookingId: bookingId || null,
    vehicleId,
    customerId: customerId || vehicle.customerId,
    advisorId: req.user._id,
    mechanicId: mechanicId || null,
    serviceType: serviceType || 'General Service',
    checkInDetails: {
      odometer: odometer || vehicle.mileage || 0,
      fuelLevelPercent: fuelLevelPercent || 50,
      existingDamages: existingDamages || [],
      checkInNotes: checkInNotes || '',
      checkInTime: new Date(),
    },
    status: 'CHECKED_IN',
    statusHistory: [
      {
        status: 'CHECKED_IN',
        updatedBy: req.user._id,
        updatedByName: req.user.name,
        timestamp: new Date(),
        notes: 'Vehicle checked in at service desk.',
      },
    ],
  });

  if (bookingId) {
    await Booking.findByIdAndUpdate(bookingId, { status: 'CHECKED_IN' });
  }

  await logAudit(
    req.user,
    'SERVICE_JOB_CREATED',
    'ServiceJob',
    job._id,
    `Checked in vehicle ${vehicle.registrationNumber} - Created Job Card #${jobNumber}`
  );

  const populatedJob = await ServiceJob.findById(job._id)
    .populate('customerId', 'name email phone')
    .populate('vehicleId')
    .populate('advisorId', 'name')
    .populate('mechanicId', 'name');

  res.status(201).json(populatedJob);
};

// @desc    Update Service Job status (Workflow State Machine)
// @route   PUT /api/service-jobs/:id/status
// @access  Private
const updateJobStatus = async (req, res) => {
  const { status, notes } = req.body;
  const job = await ServiceJob.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ message: 'Service Job not found' });
  }

  // Business Rule Validations for State Transitions
  if (status === 'IN_SERVICE') {
    if (job.status !== 'APPROVED') {
      return res.status(400).json({
        message: `BUSINESS RULE VIOLATION: Service cannot move to IN_SERVICE. Current status is ${job.status}. Wrench-time requires explicit Customer Approval on Estimate!`,
      });
    }
  }

  if (status === 'COMPLETED') {
    // Check if invoice payment is PAID
    const invoice = await Invoice.findOne({ serviceJobId: job._id });
    if (!invoice || invoice.paymentStatus !== 'PAID') {
      return res.status(400).json({
        message: `BUSINESS RULE VIOLATION: Vehicle delivery blocked! Payment status is ${invoice ? invoice.paymentStatus : 'UNBILLED'}. Payment must be settled (PAID) prior to delivery.`,
      });
    }
  }

  job.status = status;
  job.statusHistory.push({
    status,
    updatedBy: req.user._id,
    updatedByName: req.user.name,
    timestamp: new Date(),
    notes: notes || `Status changed to ${status}`,
  });

  await job.save();

  if (status === 'READY_FOR_DELIVERY') {
    const existingInv = await Invoice.findOne({ serviceJobId: job._id });
    if (!existingInv) {
      const estimate = await Estimate.findOne({ serviceJobId: job._id });
      const count = await Invoice.countDocuments();
      const invoiceNumber = `INV-${1000 + count + 1}`;
      const amount = (estimate && estimate.grandTotal > 0) ? estimate.grandTotal : 2100;
      await Invoice.create({
        invoiceNumber,
        serviceJobId: job._id,
        estimateId: estimate ? estimate._id : null,
        customerId: job.customerId,
        vehicleId: job.vehicleId,
        partsSubtotal: estimate ? estimate.partsSubtotal : 1200,
        labourSubtotal: estimate ? estimate.labourSubtotal : 600,
        taxPercent: 18,
        taxAmount: Math.round(amount * 0.18 * 100) / 100,
        discountAmount: 0,
        grandTotal: amount,
        paymentStatus: 'PENDING',
        paidAmount: 0,
        dueAmount: amount,
        issuedAt: new Date(),
      });
    }
  }

  await logAudit(
    req.user,
    'JOB_STATUS_UPDATED',
    'ServiceJob',
    job._id,
    `Job #${job.jobNumber} transitioned to ${status}`
  );

  res.json(job);
};

// @desc    Assign / Reassign Mechanic
// @route   PUT /api/service-jobs/:id/assign
// @access  Private (Advisor / Admin)
const assignMechanic = async (req, res) => {
  const { mechanicId } = req.body;
  const job = await ServiceJob.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ message: 'Service Job not found' });
  }

  job.mechanicId = mechanicId;
  await job.save();

  await logAudit(
    req.user,
    'MECHANIC_ASSIGNED',
    'ServiceJob',
    job._id,
    `Assigned mechanic to Job #${job.jobNumber}`
  );

  const updatedJob = await ServiceJob.findById(job._id)
    .populate('customerId', 'name email phone')
    .populate('vehicleId')
    .populate('advisorId', 'name')
    .populate('mechanicId', 'name email phone specialization');

  res.json(updatedJob);
};

// @desc    Submit Quality Check (QC)
// @route   PUT /api/service-jobs/:id/qc
// @access  Private (Advisor / Admin)
const submitQC = async (req, res) => {
  const { passed, notes } = req.body;
  const job = await ServiceJob.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ message: 'Service Job not found' });
  }

  job.qcDetails = {
    passed: passed !== undefined ? passed : true,
    checkedBy: req.user._id,
    checkedByName: req.user.name,
    notes: notes || 'Quality check passed successfully.',
    timestamp: new Date(),
  };

  if (passed) {
    job.status = 'READY_FOR_DELIVERY';
    job.statusHistory.push({
      status: 'READY_FOR_DELIVERY',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date(),
      notes: 'QC Passed. Vehicle ready for delivery desk.',
    });
  }

  await job.save();

  await logAudit(
    req.user,
    'QC_SUBMITTED',
    'ServiceJob',
    job._id,
    `Passed Quality Check for Job #${job.jobNumber}`
  );

  res.json(job);
};

module.exports = {
  getServiceJobs,
  getServiceJobById,
  createServiceJob,
  updateJobStatus,
  assignMechanic,
  submitQC,
};
