const express = require('express');
const { CartModel } = require('../../models/Cart');
const { ProductModel } = require('../../models/Product');
const { auth } = require('../../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
    try {
        const cart = await CartModel.findOne({ user: req.user._id })
            .populate('items.product', 'name image price galleryImages');

        if (!cart) {
            return res.json({ items: [], totalAmount: 0 });
        }

        res.json({
            items: cart.items,
            totalAmount: cart.totalAmount,
        });
    } catch (error) {
        next(error);
    }
});

router.post('/add', auth, async (req, res, next) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || !quantity || quantity < 1) {
            return res.status(400).json({ 
                success: false,
                error: 'Product ID and quantity are required' 
            });
        }

        const product = await ProductModel.findById(productId);
        if (!product || product.status !== 'active') {
            return res.status(404).json({ 
                success: false,
                error: 'Product not found or not available' 
            });
        }

        let cart = await CartModel.findOne({ user: req.user._id });

        if (!cart) {
            cart = new CartModel({
                user: req.user._id,
                items: [],
                totalAmount: 0
            });
        }

        const existingItemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (existingItemIndex >= 0) {
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            cart.items.push({
                product: productId,
                quantity,
                price: product.price,
                addedAt: new Date(),
            });
        }

        cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

        await cart.save();

        const updatedCart = await CartModel.findOne({ user: req.user._id })
            .populate('items.product', 'name image price galleryImages');

        res.json({
            success: true,
            message: 'Item added to cart',
            items: updatedCart.items,
            totalAmount: updatedCart.totalAmount,
        });
    } catch (error) {
        next(error);
    }
});

router.put('/update', auth, async (req, res, next) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || quantity < 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Product ID and valid quantity are required' 
            });
        }

        let actualProductId = productId;
        if (typeof productId === 'object' && productId._id) {
            actualProductId = productId._id;
        }

        const cart = await CartModel.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ 
                success: false,
                error: 'Cart not found' 
            });
        }

        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === actualProductId
        );

        if (itemIndex === -1) {
            return res.status(404).json({ 
                success: false,
                error: 'Item not found in cart' 
            });
        }

        if (quantity === 0) {
            cart.items.splice(itemIndex, 1);
        } else {
            cart.items[itemIndex].quantity = quantity;
        }

        cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

        await cart.save();

        const updatedCart = await CartModel.findOne({ user: req.user._id })
            .populate('items.product', 'name image price galleryImages');

        res.json({
            success: true,
            message: 'Cart updated',
            items: updatedCart.items,
            totalAmount: updatedCart.totalAmount,
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/remove', auth, async (req, res, next) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ 
                success: false,
                error: 'Product ID is required' 
            });
        }

        let actualProductId = productId;
        if (typeof productId === 'object' && productId._id) {
            actualProductId = productId._id;
        }

        const cart = await CartModel.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ 
                success: false,
                error: 'Cart not found' 
            });
        }

        cart.items = cart.items.filter(
            item => item.product.toString() !== actualProductId
        );

        cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

        await cart.save();

        const updatedCart = await CartModel.findOne({ user: req.user._id })
            .populate('items.product', 'name image price galleryImages');

        res.json({
            success: true,
            message: 'Item removed from cart',
            items: updatedCart.items,
            totalAmount: updatedCart.totalAmount,
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/clear', auth, async (req, res, next) => {
    try {
        const cart = await CartModel.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ 
                success: false,
                error: 'Cart not found' 
            });
        }

        cart.items = [];
        cart.totalAmount = 0;
        await cart.save();

        res.json({
            success: true,
            message: 'Cart cleared',
            items: [],
            totalAmount: 0,
        });
    } catch (error) {
        next(error);
    }
});

router.get('/count', auth, async (req, res, next) => {
    try {
        const cart = await CartModel.findOne({ user: req.user._id });
        const itemCount = cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;

        res.json({ itemCount });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
