const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function safeVariantValue(v) {
    if (typeof v !== 'string') return '';
    return v.trim().slice(0, 64);
}

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id; // Use 'id' instead of 'userId' from our JWT
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Wishlist Schema
const WishlistSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        size: { type: String, default: '' },
        color: { type: String, default: '' },
        addedAt: { type: Date, default: Date.now }
    }]
});

const Wishlist = mongoose.models.Wishlist || mongoose.model('Wishlist', WishlistSchema);

// Get user's wishlist
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;

        let wishlist = await Wishlist.findOne({ user: userId })
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
router.post('/add', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { productId, size, color } = req.body;

        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        // Check if product exists
        const Product = mongoose.model('Product');
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Get or create user's wishlist
        let wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            wishlist = new Wishlist({ user: userId, items: [] });
        }

        // Check if item already exists in wishlist
        const existingItem = wishlist.items.find(item =>
            item.product.toString() === productId
        );

        if (existingItem) {
            existingItem.size = safeVariantValue(size);
            existingItem.color = safeVariantValue(color);
            await wishlist.save();

            const updatedWishlist = await Wishlist.findById(wishlist._id)
                .populate('items.product', 'name price image sku stock');

            return res.json(updatedWishlist);
        }

        // Add item to wishlist
        wishlist.items.push({
            product: productId,
            size: safeVariantValue(size),
            color: safeVariantValue(color),
            addedAt: new Date(),
        });
        await wishlist.save();

        // Return updated wishlist
        const updatedWishlist = await Wishlist.findById(wishlist._id)
            .populate('items.product', 'name price image sku stock');

        res.json(updatedWishlist);
    } catch (error) {
        console.error('Failed to add to wishlist:', error);
        res.status(500).json({ error: 'Failed to add to wishlist' });
    }
});

// Remove item from wishlist
router.delete('/remove/:productId', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { productId } = req.params;

        const wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            return res.status(404).json({ error: 'Wishlist not found' });
        }

        // Remove item from wishlist
        wishlist.items = wishlist.items.filter(item =>
            item.product.toString() !== productId
        );

        await wishlist.save();

        // Return updated wishlist
        const updatedWishlist = await Wishlist.findById(wishlist._id)
            .populate('items.product', 'name price image sku stock');

        res.json(updatedWishlist);
    } catch (error) {
        console.error('Failed to remove from wishlist:', error);
        res.status(500).json({ error: 'Failed to remove from wishlist' });
    }
});

// Clear wishlist
router.delete('/clear', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;

        const wishlist = await Wishlist.findOne({ user: userId });

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

// Check if product is in wishlist
router.get('/check/:productId', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { productId } = req.params;

        const wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            return res.json({ isInWishlist: false });
        }

        const isInWishlist = wishlist.items.some(item =>
            item.product.toString() === productId
        );

        res.json({ isInWishlist });
    } catch (error) {
        console.error('Failed to check wishlist:', error);
        res.status(500).json({ error: 'Failed to check wishlist' });
    }
});

module.exports = router;
