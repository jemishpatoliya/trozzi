import { Schema, model, Document, Types } from 'mongoose';

export interface WishlistItemDoc {
  product: Types.ObjectId;
  addedAt: Date;
}

export interface WishlistDoc extends Document {
  user: Types.ObjectId;
  items: WishlistItemDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const WishlistItemSchema = new Schema<WishlistItemDoc>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  addedAt: { type: Date, default: Date.now },
});

const WishlistSchema = new Schema<WishlistDoc>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [WishlistItemSchema],
}, {
  timestamps: true,
});

export const WishlistModel = model<WishlistDoc>('Wishlist', WishlistSchema);
