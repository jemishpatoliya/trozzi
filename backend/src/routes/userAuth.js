const express = require('express');
const { UserModel } = require('../models/user');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const getDisposableEmailDomains = () => {
  try {
    const list = require('disposable-email-domains');
    return Array.isArray(list) ? list : [];
  } catch (_e) {
    return null;
  }
};

const isDisposableEmail = (email) => {
  const domains = getDisposableEmailDomains();
  if (!domains) return false;
  const domain = String(email || '').split('@').pop().toLowerCase().trim();
  if (!domain) return false;
  return domains.includes(domain);
};

// Helper function to generate JWT token
const generateToken = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { 
      id: userId, 
      type: 'user'
    },
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
};

// User Register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'All required fields must be provided' 
      });
    }

    if (isDisposableEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Disposable/tempmail email addresses are not allowed',
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'User with this email already exists' 
      });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (NEVER allow admin role here)
    const user = new UserModel({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role: 'user', // Force user role
      active: true,
      emailVerified: true,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    const userPayload = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      type: 'user'
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userPayload,
      data: {
        token,
        user: userPayload,
      },
    });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }

    // Find user (include password field)
    const user = await UserModel.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(401).json({ 
        success: false,
        error: 'Account is deactivated' 
      });
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    user.lastLogin = new Date();
    user.lastActiveAt = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    const userPayload = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      type: 'user'
    };

    res.status(200).json({
      success: true,
      message: 'User login successful',
      token,
      user: userPayload,
      data: {
        token,
        user: userPayload,
      },
    });
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
