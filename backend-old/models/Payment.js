const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, required: true, enum: ['phonepe', 'paytm', 'upi'] },
    providerOrderId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'INR' },
    status: { 
        type: String, 
        required: true, 
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: { type: String, required: true },
    providerPaymentId: { type: String },
    providerSignature: { type: String }
}, { timestamps: true });

const PaymentModel = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);

module.exports = { PaymentModel };
