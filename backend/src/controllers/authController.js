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
  const staff = await User.find({ role: { $in: ['SERVICE_ADVISOR', 'MECHANIC'] } }).sort('name');
  res.json(staff);
};

module.exports = { registerUser, loginUser, getMe, getStaff };
