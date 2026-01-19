import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user';
import { PaymentModel } from '../models/payment';
import { CartModel } from '../models/cart';
import { OrderModel } from '../models/order';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token for admin
const authenticateAdmin = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string; id?: string };
    req.userId = decoded.userId ?? decoded.id;
    if (!req.userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    UserModel.findById(req.userId)
      .then((user) => {
        if (!user) return res.status(401).json({ error: 'Invalid token' });
        if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
        next();
      })
      .catch(() => res.status(401).json({ error: 'Invalid token' }));
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get all users (admin only)
router.get('/', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    
    // Build filter
    const filter: any = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) {
      filter.role = role;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      UserModel.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      UserModel.countDocuments(filter)
    ]);

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID (admin only)
router.get('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's stats
    const [orderCount, totalSpent, cartItems] = await Promise.all([
      OrderModel.countDocuments({ 'customer.email': user.email }),
      PaymentModel.aggregate([
        { $match: { user: user._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      CartModel.findOne({ user: user._id }).populate('items.product')
    ]);

    res.json({
      user,
      stats: {
        orderCount,
        totalSpent: totalSpent[0]?.total || 0,
        cartItems: cartItems?.items?.length || 0
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user (admin only)
router.put('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, role, active } = req.body;
    
    const user = await UserModel.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, phone, role, active },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Clean up user's related data
    await Promise.all([
      CartModel.deleteOne({ user: req.params.id }),
      PaymentModel.deleteMany({ user: req.params.id }),
    ]);

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user's order history (admin only)
router.get('/:id/orders', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [orders, total] = await Promise.all([
      OrderModel.find({ 'customer.email': user.email })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      OrderModel.countDocuments({ 'customer.email': user.email })
    ]);

    res.json({
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: 'Failed to fetch user orders' });
  }
});

// Get user's payment history (admin only)
router.get('/:id/payments', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
      PaymentModel.find({ user: req.params.id })
        .populate('order', 'orderNumber status total')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      PaymentModel.countDocuments({ user: req.params.id })
    ]);

    res.json({
      payments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({ error: 'Failed to fetch user payments' });
  }
});

// Toggle user active status (admin only)
router.patch('/:id/toggle-active', authenticateAdmin, async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.active = !user.active;
    await user.save();

    res.json({
      message: `User ${user.active ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        active: user.active,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
});

export default router;
