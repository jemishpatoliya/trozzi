import { Router, type NextFunction, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { CartModel } from '../models/cart';
import { ProductModel } from '../models/product';
import { UserModel } from '../models/user';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Extend Request interface to include userId
interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Middleware to verify JWT token
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });

  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string; id?: string };
    req.userId = decoded.userId ?? decoded.id;
    if (!req.userId) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    next();
  } catch (_error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

function normalizeProductId(input: unknown): string | null {
  if (!input) return null;
  if (typeof input === 'string') return input;
  if (typeof input === 'object') {
    const anyObj = input as any;
    if (typeof anyObj._id === 'string') return anyObj._id;
    if (typeof anyObj.id === 'string') return anyObj.id;
  }
  return null;
}

// Get user's cart
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cart = await CartModel.findOne({ user: req.userId })
      .populate('items.product', 'name image price codAvailable codCharge freeShipping weight dimensions');
    
    if (!cart) {
      return res.json({ items: [], totalAmount: 0 });
    }

    res.json({
      items: cart.items,
      totalAmount: cart.totalAmount,
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Add item to cart
router.post('/add', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, quantity } = req.body as any;
    const actualProductId = normalizeProductId(productId);

    if (!actualProductId || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'Product ID and quantity are required' });
    }

    // Verify product exists and get price
    const product = await ProductModel.findById(actualProductId);
    if (!product || product.status !== 'active') {
      return res.status(404).json({ error: 'Product not found or not available' });
    }

    // Find or create user's cart
    let cart = await CartModel.findOne({ user: req.userId });
    
    if (!cart) {
      cart = new CartModel({
        user: req.userId,
        items: [],
      });
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === actualProductId
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        product: new Types.ObjectId(actualProductId),
        quantity,
        price: product.price,
        addedAt: new Date(),
      });
    }

    await cart.save();

    // Return updated cart with populated product details
    const updatedCart = await CartModel.findOne({ user: req.userId })
      .populate('items.product', 'name image price codAvailable codCharge freeShipping weight dimensions');

    if (!updatedCart) {
      return res.status(500).json({ error: 'Failed to retrieve updated cart' });
    }

    res.json({
      message: 'Item added to cart',
      items: updatedCart.items,
      totalAmount: updatedCart.totalAmount,
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Update cart item quantity
router.put('/update', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, quantity } = req.body as any;
    const actualProductId = normalizeProductId(productId);

    if (!actualProductId || quantity < 0) {
      return res.status(400).json({ error: 'Product ID and valid quantity are required' });
    }

    const cart = await CartModel.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === actualProductId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    if (quantity === 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    // Return updated cart with populated product details
    const updatedCart = await CartModel.findOne({ user: req.userId })
      .populate('items.product', 'name image price codAvailable codCharge freeShipping weight dimensions');

    if (!updatedCart) {
      return res.status(500).json({ error: 'Failed to retrieve updated cart' });
    }

    res.json({
      message: 'Cart updated',
      items: updatedCart.items,
      totalAmount: updatedCart.totalAmount,
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Remove item from cart
router.delete(
  '/remove/:productId',
  authenticateToken,
  async (req: AuthenticatedRequest & { params: { productId: string } }, res: Response) => {
    try {
      const { productId } = req.params;

    if (productId === '[object Object]') {
      return res.status(400).json({
        error: 'Invalid product ID format. Please send a productId string (or use DELETE /api/cart/remove with JSON body).',
      });
    }

    const actualProductId = normalizeProductId(productId);
    if (!actualProductId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const cart = await CartModel.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== actualProductId
    );

    await cart.save();

    // Return updated cart with populated product details
    const updatedCart = await CartModel.findOne({ user: req.userId })
      .populate('items.product', 'name image price codAvailable codCharge freeShipping weight dimensions');

    if (!updatedCart) {
      return res.status(500).json({ error: 'Failed to retrieve updated cart' });
    }

      res.json({
        message: 'Item removed from cart',
        items: updatedCart.items,
        totalAmount: updatedCart.totalAmount,
      });
    } catch (error) {
      console.error('Remove from cart error:', error);
      res.status(500).json({ error: 'Failed to remove item from cart' });
    }
  },
);

// Remove item from cart (body-based)
router.delete('/remove', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.body as any;
    const actualProductId = normalizeProductId(productId);

    if (!actualProductId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const cart = await CartModel.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = cart.items.filter((item) => item.product.toString() !== actualProductId);
    await cart.save();

    const updatedCart = await CartModel.findOne({ user: req.userId })
      .populate('items.product', 'name image price codAvailable codCharge freeShipping weight dimensions');

    if (!updatedCart) {
      return res.status(500).json({ error: 'Failed to retrieve updated cart' });
    }

    res.json({
      message: 'Item removed from cart',
      items: updatedCart.items,
      totalAmount: updatedCart.totalAmount,
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// Clear cart
router.delete('/clear', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cart = await CartModel.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();

    res.json({
      message: 'Cart cleared',
      items: [],
      totalAmount: 0,
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export default router;
