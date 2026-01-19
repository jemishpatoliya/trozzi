import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user';

interface UserRequest extends Request {
  user?: any;
}

export const authenticateUser = async (req: UserRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'User access token required' 
      });
    }

    // Verify token and check if it's user type
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    if (decoded.type !== 'user') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied: User token required' 
      });
    }

    // Find user in users collection
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid user token' 
      });
    }

    if (!user.active) {
      return res.status(401).json({ 
        success: false,
        message: 'User account is deactivated' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('User auth middleware error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Invalid or expired user token' 
    });
  }
};

export const requireUser = (req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'User authentication required' 
    });
  }
  next();
};
