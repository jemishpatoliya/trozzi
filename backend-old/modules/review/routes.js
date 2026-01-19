const express = require('express');
const { ReviewModel } = require('../../models/Review');
const { ProductModel } = require('../../models/Product');
const { auth, authorize } = require('../../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const { productId, status, page = 1, limit = 20 } = req.query;

        const query = {};
        
        if (productId) {
            query.product = productId;
        }

        if (status && status !== 'all') {
            query.status = status;
        } else {
            query.status = 'approved';
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const reviews = await ReviewModel.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('user', 'name email')
            .populate('product', 'name')
            .lean();

        const total = await ReviewModel.countDocuments(query);

        res.json({
            success: true,
            data: reviews,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const review = await ReviewModel.findById(id)
            .populate('user', 'name email')
            .populate('product', 'name')
            .lean();

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.json({
            success: true,
            data: review
        });
    } catch (error) {
        next(error);
    }
});

router.post('/', auth, async (req, res, next) => {
    try {
        const { productId, rating, title, comment } = req.body;

        if (!productId || !rating || !title || !comment) {
            return res.status(400).json({
                success: false,
                error: 'Product ID, rating, title, and comment are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: 'Rating must be between 1 and 5'
            });
        }

        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        const existingReview = await ReviewModel.findOne({
            product: productId,
            user: req.user._id
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                error: 'You have already reviewed this product'
            });
        }

        const review = new ReviewModel({
            product: productId,
            user: req.user._id,
            rating,
            title,
            comment,
            customerName: req.user.name,
            customerEmail: req.user.email,
            date: new Date().toISOString().split('T')[0],
            verifiedPurchase: false,
            status: 'pending'
        });

        await review.save();

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully. It will be visible after approval.',
            data: review
        });
    } catch (error) {
        next(error);
    }
});

router.put('/:id', auth, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rating, title, comment } = req.body;

        const review = await ReviewModel.findById(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        if (String(review.user) !== String(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                success: false,
                error: 'Rating must be between 1 and 5'
            });
        }

        if (rating) review.rating = rating;
        if (title) review.title = title;
        if (comment) review.comment = comment;

        await review.save();

        res.json({
            success: true,
            message: 'Review updated successfully',
            data: review
        });
    } catch (error) {
        next(error);
    }
});

router.put('/:id/status', auth, authorize('admin'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }

        const review = await ReviewModel.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.json({
            success: true,
            message: 'Review status updated successfully',
            data: review
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', auth, async (req, res, next) => {
    try {
        const { id } = req.params;

        const review = await ReviewModel.findById(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        if (String(review.user) !== String(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        await ReviewModel.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
