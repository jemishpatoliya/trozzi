const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
        maxlength: [100, 'Customer name cannot exceed 100 characters']
    },
    customerEmail: {
        type: String,
        required: [true, 'Customer email is required'],
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Product ID is required'],
        ref: 'Product'
    },
    productName: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5'],
        validate: {
            validator: Number.isInteger,
            message: 'Rating must be an integer'
        }
    },
    title: {
        type: String,
        required: [true, 'Review title is required'],
        trim: true,
        maxlength: [200, 'Review title cannot exceed 200 characters']
    },
    comment: {
        type: String,
        required: [true, 'Review comment is required'],
        trim: true,
        maxlength: [2000, 'Review comment cannot exceed 2000 characters']
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true
    },
    helpful: {
        type: Number,
        default: 0,
        min: [0, 'Helpful count cannot be negative']
    },
    verified: {
        type: Boolean,
        default: false
    },
    reported: {
        type: Boolean,
        default: false
    },
    reportReason: {
        type: String,
        trim: true,
        maxlength: [500, 'Report reason cannot exceed 500 characters']
    },
    adminNotes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
reviewSchema.index({ productId: 1, status: 1 });
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ rating: 1, status: 1 });
reviewSchema.index({ customerEmail: 1 });
reviewSchema.index({ createdAt: -1 });

// Virtual for formatted date
reviewSchema.virtual('formattedDate').get(function () {
    return this.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
});

// Static method to get review statistics
reviewSchema.statics.getStats = async function () {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                totalReviews: { $sum: 1 },
                averageRating: { $avg: '$rating' },
                pendingReviews: {
                    $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                },
                approvedReviews: {
                    $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
                },
                rejectedReviews: {
                    $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
                },
                ratingDistribution: {
                    $push: '$rating'
                }
            }
        }
    ]);

    if (stats.length === 0) {
        return {
            totalReviews: 0,
            averageRating: 0,
            pendingReviews: 0,
            approvedReviews: 0,
            rejectedReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
    }

    const result = stats[0];

    // Calculate rating distribution
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result.ratingDistribution.forEach(rating => {
        ratingCounts[rating]++;
    });

    return {
        totalReviews: result.totalReviews,
        averageRating: Math.round(result.averageRating * 10) / 10,
        pendingReviews: result.pendingReviews,
        approvedReviews: result.approvedReviews,
        rejectedReviews: result.rejectedReviews,
        ratingDistribution: ratingCounts
    };
};

// Static method to search reviews
reviewSchema.statics.searchReviews = function (query, filters = {}) {
    const searchQuery = {
        ...(query && {
            $or: [
                { customerName: { $regex: query, $options: 'i' } },
                { customerEmail: { $regex: query, $options: 'i' } },
                { productName: { $regex: query, $options: 'i' } },
                { title: { $regex: query, $options: 'i' } },
                { comment: { $regex: query, $options: 'i' } }
            ]
        }),
        ...filters
    };

    return this.find(searchQuery);
};

// Method to update helpful count
reviewSchema.methods.incrementHelpful = function () {
    this.helpful += 1;
    return this.save();
};

// Method to report review
reviewSchema.methods.report = function (reason) {
    this.reported = true;
    this.reportReason = reason;
    return this.save();
};

// Pre-save middleware
reviewSchema.pre('save', function (next) {
    // Auto-approve 5-star reviews (optional business logic)
    if (this.rating === 5 && this.status === 'pending') {
        this.status = 'approved';
    }
    next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
