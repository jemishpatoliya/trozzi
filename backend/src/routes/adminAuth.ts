import { Router, type Request, type Response } from 'express';
import { AdminModel } from '../models/admin';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to generate JWT token
const generateToken = (adminId: string) => {
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
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }

    // Find admin (include password field)
    const admin = await AdminModel.findOne({ email }).select('+password');
    if (!admin) {
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
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
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
router.get('/profile', async (req: Request, res: Response) => {
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

export default router;
