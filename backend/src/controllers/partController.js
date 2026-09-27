const Part = require('../models/Part');
const logAudit = require('../utils/auditLogger');

// @desc    Get all parts inventory
// @route   GET /api/parts
// @access  Private
const getParts = async (req, res) => {
  const { category, search } = req.query;
  let query = {};

  if (category) {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { partNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const parts = await Part.find(query).sort('name');
  res.json(parts);
};

// @desc    Get low stock parts below minStockLevel
// @route   GET /api/parts/low-stock
// @access  Private (Advisor / Admin)
const getLowStockParts = async (req, res) => {
  const lowStockParts = await Part.find({
    $expr: { $lte: ['$currentStock', '$minStockLevel'] },
  }).sort('currentStock');

  res.json(lowStockParts);
};

// @desc    Create new inventory part
// @route   POST /api/parts
// @access  Private (Admin)
const createPart = async (req, res) => {
  const { partNumber, name, category, supplier, purchasePrice, sellingPrice, currentStock, minStockLevel, unit } = req.body;

  const existingPart = await Part.findOne({ partNumber: partNumber.toUpperCase().trim() });
  if (existingPart) {
    return res.status(400).json({ message: `Part number ${partNumber} already exists in inventory` });
  }

  const part = await Part.create({
    partNumber: partNumber.toUpperCase().trim(),
    name,
    category,
    supplier,
    purchasePrice,
    sellingPrice,
    currentStock,
    minStockLevel,
    unit: unit || 'pcs',
  });

  await logAudit(
    req.user,
    'PART_CREATED',
    'Part',
    part._id,
    `Added new part: ${part.name} (${part.partNumber}) with stock ${part.currentStock}`
  );

  res.status(201).json(part);
};

// @desc    Update part details or stock level
// @route   PUT /api/parts/:id
// @access  Private (Admin / Advisor)
const updatePart = async (req, res) => {
  const part = await Part.findById(req.params.id);
  if (!part) {
    return res.status(404).json({ message: 'Part not found' });
  }

  const { name, category, supplier, purchasePrice, sellingPrice, currentStock, minStockLevel } = req.body;

  part.name = name || part.name;
  part.category = category || part.category;
  part.supplier = supplier || part.supplier;
  part.purchasePrice = purchasePrice !== undefined ? purchasePrice : part.purchasePrice;
  part.sellingPrice = sellingPrice !== undefined ? sellingPrice : part.sellingPrice;
  part.currentStock = currentStock !== undefined ? currentStock : part.currentStock;
  part.minStockLevel = minStockLevel !== undefined ? minStockLevel : part.minStockLevel;

  const updatedPart = await part.save();

  await logAudit(
    req.user,
    'PART_UPDATED',
    'Part',
    part._id,
    `Updated part ${part.name} - Stock: ${part.currentStock}`
  );

  res.json(updatedPart);
};

// @desc    Delete part from inventory
// @route   DELETE /api/parts/:id
// @access  Private (Admin)
const deletePart = async (req, res) => {
  const part = await Part.findById(req.params.id);
  if (!part) {
    return res.status(404).json({ message: 'Part not found' });
  }

  await part.deleteOne();

  await logAudit(req.user, 'PART_DELETED', 'Part', part._id, `Deleted part ${part.name} (${part.partNumber})`);

  res.json({ message: 'Part deleted successfully' });
};

module.exports = { getParts, getLowStockParts, createPart, updatePart, deletePart };
