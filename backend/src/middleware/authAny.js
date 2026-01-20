const jwt = require('jsonwebtoken');
const { UserModel } = require('../models/user');
const { AdminModel } = require('../models/admin');

async function authenticateAny(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const type = String(decoded.type || '').toLowerCase();

    if (type === 'admin') {
      const admin = await AdminModel.findById(decoded.id);
      if (!admin || !admin.active) {
        return res.status(401).json({ success: false, message: 'Invalid admin token' });
      }
      req.admin = admin;
      return next();
    }

    const user = await UserModel.findById(decoded.id);
    if (!user || !user.active) {
      return res.status(401).json({ success: false, message: 'Invalid user token' });
    }
    req.user = user;
    req.userId = String(user._id);
    return next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = { authenticateAny };
