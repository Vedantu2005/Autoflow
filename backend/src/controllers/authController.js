const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Customer = require('../models/Customer');
const logAudit = require('../utils/auditLogger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'autoflow_super_secret_jwt_key_2026', {
    expiresIn: '7d',
  });
};

// @desc    Register a new customer
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }

  const assignedRole = ['CUSTOMER', 'SERVICE_ADVISOR', 'MECHANIC'].includes(role) ? role : 'CUSTOMER';

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: assignedRole,
  });

  if (user) {
    if (assignedRole === 'CUSTOMER') {
      await Customer.create({ userId: user._id });
    }

    await logAudit(user, 'USER_REGISTERED', 'User', user._id, `Registered as ${user.role} (${user.email})`);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data provided' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    await logAudit(user, 'USER_LOGIN', 'User', user._id, `User logged in (${user.role})`);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json(user);
};

// @desc    Get all staff (Advisors & Mechanics)
// @route   GET /api/auth/staff
// @access  Private (Admin / Advisor)
const getStaff = async (req, res) => {
  const staff = await User.find({ role: { $in: ['SERVICE_ADVISOR', 'MECHANIC', 'ADMIN'] } }).sort('name');
  res.json(staff);
};

// @desc    Onboard a new Staff Member (Service Advisor or Mechanic)
// @route   POST /api/auth/staff
// @access  Private (Admin only)
const createStaffMember = async (req, res) => {
  const { name, email, password, phone, role, specialization } = req.body;

  if (!['SERVICE_ADVISOR', 'MECHANIC', 'ADMIN'].includes(role)) {
    return res.status(400).json({ message: 'Role must be SERVICE_ADVISOR, MECHANIC, or ADMIN' });
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }

  const staff = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: password || 'password123',
    phone: phone || '',
    role,
    specialization: role === 'MECHANIC' ? (specialization || 'General Technician') : '',
  });

  await logAudit(
    req.user,
    'STAFF_ONBOARDED',
    'User',
    staff._id,
    `Admin onboarded ${staff.role}: ${staff.name} (${staff.email})`
  );

  res.status(201).json(staff);
};

// @desc    Update Staff Member details
// @route   PUT /api/auth/staff/:id
// @access  Private (Admin only)
const updateStaffMember = async (req, res) => {
  const staff = await User.findById(req.params.id);
  if (!staff) {
    return res.status(404).json({ message: 'Staff member not found' });
  }

  const { name, phone, role, specialization } = req.body;
  if (name) staff.name = name.trim();
  if (phone !== undefined) staff.phone = phone.trim();
  if (role && ['SERVICE_ADVISOR', 'MECHANIC', 'ADMIN'].includes(role)) staff.role = role;
  if (specialization !== undefined) staff.specialization = specialization;

  await staff.save();

  await logAudit(
    req.user,
    'STAFF_UPDATED',
    'User',
    staff._id,
    `Admin updated profile for ${staff.name} (${staff.role})`
  );

  res.json(staff);
};

// @desc    Deactivate / Remove Staff Member
// @route   DELETE /api/auth/staff/:id
// @access  Private (Admin only)
const deleteStaffMember = async (req, res) => {
  const staff = await User.findById(req.params.id);
  if (!staff) {
    return res.status(404).json({ message: 'Staff member not found' });
  }

  if (staff._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: 'Admin cannot delete their own account' });
  }

  const name = staff.name;
  const role = staff.role;
  await staff.deleteOne();

  await logAudit(
    req.user,
    'STAFF_REMOVED',
    'User',
    staff._id,
    `Admin removed ${role}: ${name}`
  );

  res.json({ message: `Staff member ${name} (${role}) removed successfully` });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getStaff,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
};
