const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/product');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

// GET /api/admin/reviews - Get all reviews with pagination and filtering
router.get('/', auth, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            rating,
            status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        let query = {};

        if (search) {
            query = Review.searchReviews(search);
        } else {
            query = Review.find({});
        }

        // Apply filters
        if (rating) {
            query = query.where('rating').equals(parseInt(rating));
        }

        if (status) {
            query = query.where('status').equals(status);
        }

        // Sort
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        query = query.sort(sortOptions);

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [reviews, totalReviews] = await Promise.all([
            query.skip(skip).limit(limitNum).populate('productId', 'name'),
            Review.countDocuments(query.getQuery())
        ]);

        const totalPages = Math.ceil(totalReviews / limitNum);

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalReviews,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1,
                    limit: limitNum
                }
            }
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews'
        });
    }
});

// GET /api/admin/reviews/stats - Get review statistics
router.get('/stats', auth, async (req, res) => {
    try {
        const stats = await Review.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching review stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch review statistics'
        });
    }
});

// GET /api/admin/reviews/:id - Get single review by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id).populate('productId', 'name');

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
        console.error('Error fetching review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch review'
        });
    }
});

// PATCH /api/admin/reviews/:id/status - Update review status
router.patch('/:id/status', auth, validate({
    status: {
        in: ['body'],
        notEmpty: true,
        isIn: {
            options: [['pending', 'approved', 'rejected']],
            errorMessage: 'Status must be pending, approved, or rejected'
        }
    },
    reason: {
        in: ['body'],
        optional: true,
        isString: true,
        isLength: {
            options: { max: 1000 },
            errorMessage: 'Reason cannot exceed 1000 characters'
        }
    }
}), async (req, res) => {
    try {
        const { status, reason } = req.body;

        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        review.status = status;
        if (reason) {
            review.adminNotes = reason;
        }

        await review.save();

        res.json({
            success: true,
            message: `Review ${status} successfully`,
            data: review
        });
    } catch (error) {
        console.error('Error updating review status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update review status'
        });
    }
});

// DELETE /api/admin/reviews/:id - Delete review
router.delete('/:id', auth, async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.json({
            success: true,
            message: 'Review deleted successfully',
            data: review
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review'
        });
    }
});

// PATCH /api/admin/reviews/bulk-update - Bulk update reviews
router.patch('/bulk-update', auth, validate({
    reviewIds: {
        in: ['body'],
        isArray: true,
        notEmpty: true,
        custom: {
            options: (value) => {
                return value.every(id => mongoose.Types.ObjectId.isValid(id));
            },
            errorMessage: 'Invalid review IDs'
        }
    },
    status: {
        in: ['body'],
        notEmpty: true,
        isIn: {
            options: [['pending', 'approved', 'rejected']],
            errorMessage: 'Status must be pending, approved, or rejected'
        }
    },
    reason: {
        in: ['body'],
        optional: true,
        isString: true,
        isLength: {
            options: { max: 1000 },
            errorMessage: 'Reason cannot exceed 1000 characters'
        }
    }
}), async (req, res) => {
    try {
        const { reviewIds, status, reason } = req.body;

        const result = await Review.updateMany(
            { _id: { $in: reviewIds } },
            {
                status,
                ...(reason && { adminNotes: reason })
            }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} reviews ${status} successfully`,
            data: {
                modifiedCount: result.modifiedCount,
                matchedCount: result.matchedCount
            }
        });
    } catch (error) {
        console.error('Error bulk updating reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk update reviews'
        });
    }
});

// GET /api/admin/reviews/export - Export reviews
router.get('/export', auth, async (req, res) => {
    try {
        const {
            format = 'csv',
            status,
            rating,
            dateFrom,
            dateTo
        } = req.query;

        // Build query
        let query = Review.find({});

        if (status) {
            query = query.where('status').equals(status);
        }

        if (rating) {
            query = query.where('rating').equals(parseInt(rating));
        }

        if (dateFrom || dateTo) {
            const dateFilter = {};
            if (dateFrom) dateFilter.$gte = new Date(dateFrom);
            if (dateTo) dateFilter.$lte = new Date(dateTo);
            query = query.where('createdAt').dateFilter;
        }

        const reviews = await query.sort({ createdAt: -1 });

        if (format === 'csv') {
            // Generate CSV
            const headers = ['ID', 'Customer Name', 'Email', 'Product', 'Rating', 'Title', 'Comment', 'Date', 'Status', 'Helpful', 'Verified'];
            const csvContent = [
                headers.join(','),
                ...reviews.map(review => [
                    review._id,
                    review.customerName,
                    review.customerEmail,
                    review.productName,
                    review.rating,
                    `"${review.title}"`,
                    `"${review.comment.replace(/"/g, '""')}"`,
                    review.createdAt.toISOString(),
                    review.status,
                    review.helpful,
                    review.verified
                ].join(','))
            ].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="reviews-${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csvContent);
        } else {
            // Return JSON
            res.json({
                success: true,
                data: reviews
            });
        }
    } catch (error) {
        console.error('Error exporting reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export reviews'
        });
    }
});

// Customer-facing routes

// GET /api/products/:productId/reviews - Get product reviews
router.get('/products/:productId/reviews', async (req, res) => {
    try {
        const { productId } = req.params;
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Verify product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Build query - only show approved reviews to customers
        let query = Review.find({ productId, status: 'approved' });

        // Sort
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        query = query.sort(sortOptions);

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [reviews, totalReviews] = await Promise.all([
            query.skip(skip).limit(limitNum),
            Review.countDocuments({ productId, status: 'approved' })
        ]);

        const totalPages = Math.ceil(totalReviews / limitNum);

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalReviews,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1,
                    limit: limitNum
                }
            }
        });
    } catch (error) {
        console.error('Error fetching product reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product reviews'
        });
    }
});

// POST /api/products/:productId/reviews - Submit product review
router.post('/products/:productId/reviews', validate({
    rating: {
        in: ['body'],
        notEmpty: true,
        isInt: true,
        min: 1,
        max: 5,
        errorMessage: 'Rating must be an integer between 1 and 5'
    },
    title: {
        in: ['body'],
        notEmpty: true,
        isString: true,
        isLength: {
            options: { min: 1, max: 200 },
            errorMessage: 'Title must be between 1 and 200 characters'
        }
    },
    comment: {
        in: ['body'],
        notEmpty: true,
        isString: true,
        isLength: {
            options: { min: 1, max: 2000 },
            errorMessage: 'Comment must be between 1 and 2000 characters'
        }
    },
    customerName: {
        in: ['body'],
        notEmpty: true,
        isString: true,
        isLength: {
            options: { min: 1, max: 100 },
            errorMessage: 'Customer name must be between 1 and 100 characters'
        }
    },
    customerEmail: {
        in: ['body'],
        notEmpty: true,
        isEmail: true,
        normalizeEmail: true,
        errorMessage: 'Please provide a valid email address'
    }
}), async (req, res) => {
    try {
        const { productId } = req.params;
        const reviewData = req.body;

        // Verify product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({
            productId,
            customerEmail: reviewData.customerEmail
        });

        if (existingReview) {
            return res.status(409).json({
                success: false,
                message: 'You have already reviewed this product'
            });
        }

        // Create new review
        const review = new Review({
            productId,
            productName: product.name,
            ...reviewData
        });

        await review.save();

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: review
        });
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit review'
        });
    }
});

// POST /api/reviews/:id/upvote - Upvote review
router.post('/:id/upvote', async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        await review.incrementHelpful();

        res.json({
            success: true,
            message: 'Review upvoted successfully',
            data: {
                helpful: review.helpful
            }
        });
    } catch (error) {
        console.error('Error upvoting review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upvote review'
        });
    }
});

// POST /api/reviews/:id/report - Report review
router.post('/:id/report', validate({
    reason: {
        in: ['body'],
        notEmpty: true,
        isString: true,
        isLength: {
            options: { min: 1, max: 500 },
            errorMessage: 'Reason must be between 1 and 500 characters'
        }
    }
}), async (req, res) => {
    try {
        const { reason } = req.body;

        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        await review.report(reason);

        res.json({
            success: true,
            message: 'Review reported successfully',
            data: review
        });
    } catch (error) {
        console.error('Error reporting review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to report review'
        });
    }
});

module.exports = router;
