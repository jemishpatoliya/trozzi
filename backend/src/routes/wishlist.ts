import { Router, type NextFunction, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { WishlistModel } from '../models/wishlist';
import { ProductModel } from '../models/product';
import { UserModel } from '../models/user';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

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
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Get user's wishlist
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    
    let wishlist = await WishlistModel.findOne({ user: userId })
      .populate('items.product', 'name price image sku stock');
    
    if (!wishlist) {
      return res.json({ items: [] });
    }
    
    res.json(wishlist);
  } catch (error) {
    console.error('Failed to fetch wishlist:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// Add item to wishlist
router.post('/add', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if product exists
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get or create user's wishlist
    let wishlist = await WishlistModel.findOne({ user: userId });
    
    if (!wishlist) {
      wishlist = new WishlistModel({ user: userId, items: [] });
    }

    // Check if item already exists in wishlist
    const existingItem = wishlist.items.find(item => 
      item.product.toString() === productId
    );

    if (existingItem) {
      return res.status(400).json({ error: 'Item already in wishlist' });
    }

    // Add item to wishlist
    wishlist.items.push({ product: productId, addedAt: new Date() });
    await wishlist.save();

    // Return updated wishlist
    const updatedWishlist = await WishlistModel.findById(wishlist._id)
      .populate('items.product', 'name price image sku stock');

    res.json(updatedWishlist);
  } catch (error) {
    console.error('Failed to add to wishlist:', error);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// Remove item from wishlist
router.delete('/remove/:productId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { productId } = req.params;

    const wishlist = await WishlistModel.findOne({ user: userId });
    
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    // Remove item from wishlist
    wishlist.items = wishlist.items.filter(item => 
      item.product.toString() !== productId
    );

    await wishlist.save();

    // Return updated wishlist
    const updatedWishlist = await WishlistModel.findById(wishlist._id)
      .populate('items.product', 'name price image sku stock');

    res.json(updatedWishlist);
  } catch (error) {
    console.error('Failed to remove from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// Clear wishlist
router.delete('/clear', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const wishlist = await WishlistModel.findOne({ user: userId });
    
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    wishlist.items = [];
    await wishlist.save();

    res.json({ message: 'Wishlist cleared successfully' });
  } catch (error) {
    console.error('Failed to clear wishlist:', error);
    res.status(500).json({ error: 'Failed to clear wishlist' });
  }
});

export default router;
