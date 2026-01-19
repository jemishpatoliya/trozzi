const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true },
    comment: { type: String, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    date: { type: String, required: true },
    verifiedPurchase: { type: Boolean, required: true, default: false },
    helpful: { type: Number, required: true, default: 0 },
    status: { type: String, required: true, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

const ReviewModel = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

module.exports = { ReviewModel };
