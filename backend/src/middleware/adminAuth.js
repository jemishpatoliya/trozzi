const jwt = require('jsonwebtoken');
const { AdminModel } = require('../models/admin');

const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Admin access token required' 
      });
    }

    // Verify token and check if it's admin type
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.type !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied: Admin token required' 
      });
    }

    // Find admin in admins collection
    const admin = await AdminModel.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid admin token' 
      });
    }

    if (!admin.active) {
      return res.status(401).json({ 
        success: false,
        message: 'Admin account is deactivated' 
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Invalid or expired admin token' 
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({ 
      success: false,
      message: 'Admin authentication required' 
    });
  }
  next();
};

module.exports = { authenticateAdmin, requireAdmin };
