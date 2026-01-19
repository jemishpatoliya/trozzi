const mongoose = require('mongoose');

// Minimal Payment schema for JS runtime (mirrors src/models/payment.ts + fields used in routes/payments.js)
const PaymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, enum: ['razorpay', 'phonepe', 'paytm', 'upi'], default: 'upi', required: true },

    providerOrderId: { type: String, unique: true, sparse: true },
    providerPaymentId: { type: String },
    providerSignature: { type: String },

    razorpayOrderId: { type: String, unique: true, sparse: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    transactionId: { type: String },
    paymentMode: { type: String },
    providerStatus: { type: String },

    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'INR' },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    paymentMethod: { type: String, enum: ['razorpay', 'phonepe', 'paytm', 'upi'], default: 'upi' },

    metadata: { type: mongoose.Schema.Types.Mixed, required: false },

    paidAtIso: { type: String },
    failedAtIso: { type: String },
    refundedAtIso: { type: String },

    eventHistory: [
      {
        provider: { type: String },
        event: { type: String },
        state: { type: String },
        at: { type: String },
        orderId: { type: String },
        merchantOrderId: { type: String },
        transactionId: { type: String },
        paymentMode: { type: String },
        amount: { type: mongoose.Schema.Types.Mixed },
        timestamp: { type: mongoose.Schema.Types.Mixed },
        raw: { type: mongoose.Schema.Types.Mixed },
      },
    ],
  },
  { timestamps: true },
);

const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);

module.exports = { Payment, PaymentModel: Payment };
