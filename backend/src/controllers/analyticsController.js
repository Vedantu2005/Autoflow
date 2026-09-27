const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const ServiceJob = require('../models/ServiceJob');
const Part = require('../models/Part');
const Invoice = require('../models/Invoice');
const Estimate = require('../models/Estimate');

// @desc    Get executive dashboard metrics & charts
// @route   GET /api/analytics/dashboard
// @access  Private (Admin / Advisor)
const getDashboardMetrics = async (req, res) => {
  const totalCustomers = await User.countDocuments({ role: 'CUSTOMER' });
  const totalVehicles = await Vehicle.countDocuments();
  const totalMechanics = await User.countDocuments({ role: 'MECHANIC' });

  const activeServiceJobs = await ServiceJob.countDocuments({
    status: { $nin: ['COMPLETED', 'CANCELLED'] },
  });

  const completedJobsCount = await ServiceJob.countDocuments({ status: 'COMPLETED' });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todaysBookings = await Booking.countDocuments({
    createdAt: { $gte: startOfDay },
  });

  const pendingApprovals = await ServiceJob.countDocuments({ status: 'CUSTOMER_APPROVAL' });
  const readyForDelivery = await ServiceJob.countDocuments({ status: 'READY_FOR_DELIVERY' });

  const lowStockParts = await Part.find({
    $expr: { $lte: ['$currentStock', '$minStockLevel'] },
  });

  // Calculate Total Revenue from paid invoices
  const invoices = await Invoice.find({ paymentStatus: { $in: ['PAID', 'PARTIAL'] } });
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

  // Status breakdown distribution
  const allJobs = await ServiceJob.find().select('status');
  const statusCounts = {};
  allJobs.forEach((job) => {
    statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
  });

  const statusDistribution = Object.keys(statusCounts).map((key) => ({
    name: key.replace(/_/g, ' '),
    status: key,
    value: statusCounts[key],
  }));

  // Popular vehicle makes
  const vehicles = await Vehicle.find().select('make model');
  const makeCounts = {};
  vehicles.forEach((v) => {
    makeCounts[v.make] = (makeCounts[v.make] || 0) + 1;
  });

  const vehicleDistribution = Object.keys(makeCounts).map((make) => ({
    make,
    count: makeCounts[make],
  }));

  res.json({
    metrics: {
      totalCustomers,
      totalVehicles,
      totalMechanics,
      activeServiceJobs,
      completedJobsCount,
      todaysBookings,
      pendingApprovals,
      readyForDelivery,
      lowStockCount: lowStockParts.length,
      totalRevenue,
    },
    statusDistribution,
    vehicleDistribution,
    lowStockParts,
  });
};

module.exports = { getDashboardMetrics };
