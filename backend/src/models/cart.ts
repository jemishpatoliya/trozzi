import { Schema, model, Document, Types } from 'mongoose';

export interface CartItemDoc {
  product: Types.ObjectId;
  quantity: number;
  price: number;
  name?: string;
  sku?: string;
  image?: string;
  size?: string;
  color?: string;
  addedAt: Date;
}

export interface CartDoc extends Document {
  user: Types.ObjectId;
  items: CartItemDoc[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<CartItemDoc>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  name: { type: String },
  sku: { type: String },
  image: { type: String },
  size: { type: String },
  color: { type: String },
  addedAt: { type: Date, default: Date.now },
});

const CartSchema = new Schema<CartDoc>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [CartItemSchema],
  totalAmount: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Calculate total amount before saving
CartSchema.pre('save', function(next) {
  this.totalAmount = this.items.reduce((total: number, item: CartItemDoc) => {
    return total + (item.price * item.quantity);
  }, 0);
  next();
});

export const CartModel = model<CartDoc>('Cart', CartSchema);
