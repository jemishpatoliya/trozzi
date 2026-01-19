const express = require('express');
const { AdminModel } = require('../models/admin');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to generate JWT token
const generateToken = (adminId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { 
      id: adminId, 
      type: 'admin'
    },
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
};

// Admin Login
router.post('/login', async (req, res) => {
  try {
    console.log('Admin login request:', req.body);
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }

    // Find admin (include password field)
    console.log('Finding admin with email:', email);
    const admin = await AdminModel.findOne({ email }).select('+password');
    console.log('Admin found:', !!admin);
    if (!admin) {
      console.log('Admin not found in database');
      return res.status(401).json({ 
        success: false,
        error: 'Invalid admin credentials' 
      });
    }

    // Check if admin is active
    if (!admin.active) {
      return res.status(401).json({ 
        success: false,
        error: 'Admin account is deactivated' 
      });
    }

    // Verify password
    console.log('Comparing password');
    const isPasswordValid = await admin.comparePassword(password);
    console.log('Password valid:', isPasswordValid);
    if (!isPasswordValid) {
      console.log('Password comparison failed');
      return res.status(401).json({ 
        success: false,
        error: 'Invalid admin credentials' 
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateToken(admin._id.toString());

    const adminPayload = {
      id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      role: admin.role,
      type: 'admin'
    };

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: adminPayload,
      data: {
        token,
        admin: adminPayload,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get Admin Profile
router.get('/profile', async (req, res) => {
  try {
    // This would need admin middleware - for now just return error
    res.status(401).json({ 
      success: false,
      error: 'Authentication required' 
    });
  } catch (error) {
    console.error('Admin profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
