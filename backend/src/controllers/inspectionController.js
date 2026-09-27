const Inspection = require('../models/Inspection');
const ServiceJob = require('../models/ServiceJob');
const logAudit = require('../utils/auditLogger');

// @desc    Get inspection details for a service job
// @route   GET /api/inspections/job/:serviceJobId
// @access  Private
const getInspectionByJobId = async (req, res) => {
  const inspection = await Inspection.findOne({ serviceJobId: req.params.serviceJobId })
    .populate('mechanicId', 'name email phone');
  
  if (!inspection) {
    return res.status(404).json({ message: 'Inspection record not found for this service job' });
  }

  res.json(inspection);
};

// @desc    Create or update digital inspection report
// @route   POST /api/inspections
// @access  Private (Mechanic / Advisor / Admin)
const saveInspection = async (req, res) => {
  const { serviceJobId, checklist, overallDiagnosis, recommendedRepairs, inspectionImages } = req.body;

  const job = await ServiceJob.findById(serviceJobId);
  if (!job) {
    return res.status(404).json({ message: 'Service Job not found' });
  }

  let inspection = await Inspection.findOne({ serviceJobId });

  if (inspection) {
    inspection.checklist = checklist || inspection.checklist;
    inspection.overallDiagnosis = overallDiagnosis || inspection.overallDiagnosis;
    inspection.recommendedRepairs = recommendedRepairs || inspection.recommendedRepairs;
    inspection.inspectionImages = inspectionImages || inspection.inspectionImages;
    inspection.completedAt = new Date();
    await inspection.save();
  } else {
    inspection = await Inspection.create({
      serviceJobId,
      mechanicId: req.user._id,
      checklist,
      overallDiagnosis,
      recommendedRepairs: recommendedRepairs || [],
      inspectionImages: inspectionImages || [],
      completedAt: new Date(),
    });
  }

  // Move ServiceJob status to ESTIMATE_PENDING
  job.status = 'ESTIMATE_PENDING';
  job.statusHistory.push({
    status: 'ESTIMATE_PENDING',
    updatedBy: req.user._id,
    updatedByName: req.user.name,
    timestamp: new Date(),
    notes: 'Inspection completed by technician. Diagnosis recorded.',
  });
  await job.save();

  await logAudit(
    req.user,
    'INSPECTION_SUBMITTED',
    'Inspection',
    inspection._id,
    `Completed digital inspection for Job #${job.jobNumber}`
  );

  res.status(201).json(inspection);
};

module.exports = { getInspectionByJobId, saveInspection };
