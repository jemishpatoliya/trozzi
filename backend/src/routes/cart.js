const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { authenticateUser, requireUser } = require('../middleware/userAuth');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function safeVariantValue(v) {
    if (typeof v !== 'string') return '';
    return v.trim().slice(0, 64);
}

function safeUrlValue(v) {
    if (typeof v !== 'string') return '';
    const s = v.trim();
    return s.length > 2000 ? s.slice(0, 2000) : s;
}

function safeNumberValue(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function findCartItemIndex(cart, productId, size, color) {
    const pid = String(productId);
    const s = safeVariantValue(size);
    const c = safeVariantValue(color);

    if (s || c) {
        return cart.items.findIndex(
            (item) => item.product.toString() === pid && safeVariantValue(item.size) === s && safeVariantValue(item.color) === c,
        );
    }

    const matches = cart.items
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => item.product.toString() === pid);

    if (matches.length === 1) return matches[0].idx;
    return matches.length > 1 ? -2 : -1; // -2 => ambiguous without variant
}

// Cart Schema
const CartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        size: { type: String, default: '' },
        color: { type: String, default: '' },
        image: { type: String, default: '' },
        addedAt: { type: Date, default: Date.now }
    }],
    totalAmount: { type: Number, default: 0 }
});

const Cart = mongoose.models.Cart || mongoose.model('Cart', CartSchema);

// Get user's cart
router.get('/', authenticateUser, requireUser, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id })
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
router.post('/add', authenticateUser, requireUser, async (req, res) => {
    try {
        const { productId, quantity, size, color, image, price } = req.body;

        if (!productId || !quantity || quantity < 1) {
            return res.status(400).json({ error: 'Product ID and quantity are required' });
        }

        // Verify product exists and get price
        const Product = mongoose.model('Product');
        const product = await Product.findById(productId);
        if (!product || product.status !== 'active') {
            return res.status(404).json({ error: 'Product not found or not available' });
        }

        // Find or create user's cart
        let cart = await Cart.findOne({ user: req.userId });

        if (!cart) {
            cart = new Cart({
                user: req.userId,
                items: [],
                totalAmount: 0
            });
        }

        // Check if product+variant already in cart
        const existingItemIndex = findCartItemIndex(cart, productId, size, color);

        if (existingItemIndex === -2) {
            return res.status(400).json({
                error: 'Multiple variants of this product exist in cart. Please include size/color to add/update the correct item.',
            });
        }

        const incomingPrice = safeNumberValue(price);

        if (existingItemIndex >= 0) {
            // Update quantity
            cart.items[existingItemIndex].quantity += quantity;
            const incomingImage = safeUrlValue(image);
            if (incomingImage) {
                cart.items[existingItemIndex].image = incomingImage;
            }

            if (incomingPrice !== null && incomingPrice >= 0) {
                cart.items[existingItemIndex].price = incomingPrice;
            }
        } else {
            // Add new item
            cart.items.push({
                product: productId,
                quantity,
                price: (incomingPrice !== null && incomingPrice >= 0) ? incomingPrice : product.price,
                size: safeVariantValue(size),
                color: safeVariantValue(color),
                image: safeUrlValue(image),
                addedAt: new Date(),
            });
        }

        // Recalculate total amount
        cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

        await cart.save();

        // Return updated cart with populated product details
        const updatedCart = await Cart.findOne({ user: req.userId })
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
router.put('/update', authenticateUser, requireUser, async (req, res) => {
    try {
        const { productId, quantity, size, color } = req.body;

        if (!productId || quantity < 0) {
            return res.status(400).json({ error: 'Product ID and valid quantity are required' });
        }

        // Handle if productId is an object (from frontend serialization issue)
        let actualProductId = productId;
        if (typeof productId === 'object' && productId._id) {
            actualProductId = productId._id;
        }

        const cart = await Cart.findOne({ user: req.userId });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const itemIndex = findCartItemIndex(cart, actualProductId, size, color);

        if (itemIndex === -2) {
            return res.status(400).json({
                error: 'Multiple variants of this product exist in cart. Please include size/color to update the correct item.',
            });
        }

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

        // Recalculate total amount
        cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

        await cart.save();

        // Return updated cart with populated product details
        const updatedCart = await Cart.findOne({ user: req.userId })
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
router.delete('/remove/:productId', authenticateUser, requireUser, async (req, res) => {
    try {
        let { productId } = req.params;

        // Handle if productId is [object Object] (from frontend serialization issue)
        if (productId === '[object Object]') {
            return res.status(400).json({
                error: 'Invalid product ID format. Please send the actual product ID string.',
                hint: 'The frontend is sending [object Object] instead of the product ID. Check your frontend code.'
            });
        }

        const cart = await Cart.findOne({ user: req.userId });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        cart.items = cart.items.filter(
            item => item.product.toString() !== productId
        );

        // Recalculate total amount
        cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

        await cart.save();

        // Return updated cart with populated product details
        const updatedCart = await Cart.findOne({ user: req.userId })
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

// Alternative remove endpoint that accepts productId in request body
router.delete('/remove', authenticateUser, requireUser, async (req, res) => {
    try {
        const { productId, size, color } = req.body;

        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        // Handle if productId is an object (from frontend serialization issue)
        let actualProductId = productId;
        if (typeof productId === 'object' && productId._id) {
            actualProductId = productId._id;
        }

        const cart = await Cart.findOne({ user: req.userId });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const idx = findCartItemIndex(cart, actualProductId, size, color);
        if (idx === -2) {
            return res.status(400).json({
                error: 'Multiple variants of this product exist in cart. Please include size/color to remove the correct item.',
            });
        }

        if (idx >= 0) {
            cart.items.splice(idx, 1);
        } else {
            cart.items = cart.items.filter(
                item => item.product.toString() !== actualProductId
            );
        }

        // Recalculate total amount
        cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

        await cart.save();

        // Return updated cart with populated product details
        const updatedCart = await Cart.findOne({ user: req.userId })
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

// Special endpoint to handle [object Object] issue from frontend
router.delete('/remove-by-object', authenticateUser, requireUser, async (req, res) => {
    try {
        const { productId, product } = req.body;

        // Try to extract ID from various possible formats
        let actualProductId = null;

        if (productId) {
            if (typeof productId === 'string') {
                actualProductId = productId;
            } else if (typeof productId === 'object' && productId._id) {
                actualProductId = productId._id;
            } else if (typeof productId === 'object' && productId.id) {
                actualProductId = productId.id;
            }
        }

        if (product) {
            if (typeof product === 'object' && product._id) {
                actualProductId = product._id;
            } else if (typeof product === 'object' && product.id) {
                actualProductId = product.id;
            }
        }

        if (!actualProductId) {
            return res.status(400).json({
                error: 'Could not extract product ID. Please provide productId or product object.',
                received: { productId, product }
            });
        }

        const cart = await Cart.findOne({ user: req.userId });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Remove item from cart
        const initialCount = cart.items.length;
        cart.items = cart.items.filter(
            item => item.product.toString() !== actualProductId
        );

        if (cart.items.length === initialCount) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        // Recalculate total amount
        cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

        await cart.save();

        // Return updated cart with populated product details
        const updatedCart = await Cart.findOne({ user: req.userId })
            .populate('items.product', 'name image price codAvailable codCharge freeShipping weight dimensions');

        if (!updatedCart) {
            return res.status(500).json({ error: 'Failed to retrieve updated cart' });
        }

        res.json({
            message: 'Item removed from cart',
            items: updatedCart.items,
            totalAmount: updatedCart.totalAmount,
            extractedProductId: actualProductId
        });
    } catch (error) {
        console.error('Remove by object error:', error);
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
});

// Update endpoint that can handle object productId
router.put('/update-by-object', authenticateUser, requireUser, async (req, res) => {
    try {
        const { productId, quantity, product } = req.body;

        if (quantity < 0) {
            return res.status(400).json({ error: 'Valid quantity is required' });
        }

        // Try to extract ID from various possible formats
        let actualProductId = null;

        if (productId) {
            if (typeof productId === 'string') {
                actualProductId = productId;
            } else if (typeof productId === 'object' && productId._id) {
                actualProductId = productId._id;
            } else if (typeof productId === 'object' && productId.id) {
                actualProductId = productId.id;
            }
        }

        if (product && !actualProductId) {
            if (typeof product === 'object' && product._id) {
                actualProductId = product._id;
            } else if (typeof product === 'object' && product.id) {
                actualProductId = product.id;
            }
        }

        if (!actualProductId) {
            return res.status(400).json({
                error: 'Could not extract product ID. Please provide productId or product object.',
                received: { productId, product }
            });
        }

        const cart = await Cart.findOne({ user: req.userId });
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

        // Recalculate total amount
        cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

        await cart.save();

        // Return updated cart with populated product details
        const updatedCart = await Cart.findOne({ user: req.userId })
            .populate('items.product', 'name image price codAvailable codCharge freeShipping weight dimensions');

        if (!updatedCart) {
            return res.status(500).json({ error: 'Failed to retrieve updated cart' });
        }

        res.json({
            message: 'Cart updated',
            items: updatedCart.items,
            totalAmount: updatedCart.totalAmount,
            extractedProductId: actualProductId
        });
    } catch (error) {
        console.error('Update by object error:', error);
        res.status(500).json({ error: 'Failed to update cart' });
    }
});
router.delete('/clear', authenticateUser, requireUser, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.userId });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        cart.items = [];
        cart.totalAmount = 0;
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

// Get cart item count
router.get('/count', authenticateUser, requireUser, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.userId });
        const itemCount = cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;

        res.json({ itemCount });
    } catch (error) {
        console.error('Get cart count error:', error);
        res.status(500).json({ error: 'Failed to get cart count' });
    }
});

module.exports = router;
