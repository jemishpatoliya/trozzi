import { Schema, model, Document, Types } from 'mongoose';

export interface PaymentDoc extends Document {
  order?: Types.ObjectId;
  user: Types.ObjectId;
  provider: 'razorpay' | 'phonepe' | 'paytm' | 'upi';
  providerOrderId?: string;
  providerPaymentId?: string;
  providerSignature?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'razorpay' | 'phonepe' | 'paytm' | 'upi';
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<PaymentDoc>({
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: false },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: String, enum: ['razorpay', 'phonepe', 'paytm', 'upi'], default: 'upi', required: true },
  providerOrderId: { type: String, unique: true, sparse: true },
  providerPaymentId: { type: String },
  providerSignature: { type: String },
  razorpayOrderId: { type: String, unique: true, sparse: true },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: 'INR' },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'], 
    default: 'pending' 
  },
  paymentMethod: { type: String, enum: ['razorpay', 'phonepe', 'paytm', 'upi'], default: 'upi' },
  metadata: { type: Schema.Types.Mixed, required: false },
}, {
  timestamps: true,
});

export const PaymentModel = model<PaymentDoc>('Payment', PaymentSchema);
