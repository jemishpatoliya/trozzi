import mongoose, { Schema, Types } from "mongoose";

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  selectedSize?: string;
  selectedColor?: string;
  selectedImage?: string;
};

export type OrderStatus = "new" | "processing" | "paid" | "paid_but_shipment_failed" | "shipped" | "delivered" | "cancelled" | "returned";

export type OrderStatusHistoryItem = {
  status: OrderStatus;
  at: string;
  source?: string;
};

export type OrderDoc = {
  user?: Types.ObjectId;
  orderNumber: string;
  status: OrderStatus;
  shiprocket?: {
    orderId?: string;
    lastWebhookAt?: string;
    lastEventId?: string;
  };
  statusTimestamps?: Partial<Record<OrderStatus, string>>;
  statusHistory?: OrderStatusHistoryItem[];
  currency: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  items: OrderItem[];
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAtIso: string;
};

const OrderSchema = new Schema<OrderDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: false, index: true },
    orderNumber: { type: String, required: true, unique: true },
    status: {
      type: String,
      required: true,
      enum: ["new", "processing", "paid", "paid_but_shipment_failed", "shipped", "delivered", "cancelled", "returned"],
      default: "new",
    },
    shiprocket: {
      type: {
        orderId: { type: String, required: false, default: "" },
        lastWebhookAt: { type: String, required: false, default: "" },
        lastEventId: { type: String, required: false, default: "" },
      },
      required: false,
      default: undefined,
    },
    statusTimestamps: { type: Schema.Types.Mixed, required: false, default: {} },
    statusHistory: {
      type: [
        {
          status: {
            type: String,
            required: true,
            enum: ["new", "processing", "paid", "shipped", "delivered", "cancelled", "returned"],
          },
          at: { type: String, required: true },
          source: { type: String, required: false },
        },
      ],
      required: false,
      default: [],
    },
    currency: { type: String, required: true, default: "USD" },
    subtotal: { type: Number, required: true, default: 0 },
    shipping: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    items: {
      type: [
        {
          productId: { type: String, required: true },
          name: { type: String, required: true },
          price: { type: Number, required: true },
          quantity: { type: Number, required: true },
          image: { type: String, required: false },
          selectedSize: { type: String, required: false, default: '' },
          selectedColor: { type: String, required: false, default: '' },
          selectedImage: { type: String, required: false, default: '' },
        },
      ],
      required: true,
      default: [],
    },
    customer: {
      type: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: false },
      },
      required: true,
    },
    address: {
      type: {
        line1: { type: String, required: true },
        line2: { type: String, required: false },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
      },
      required: true,
    },
    createdAtIso: { type: String, required: true },
  },
  { timestamps: true },
);

export const OrderModel =
  (mongoose.models.Order as mongoose.Model<OrderDoc> | undefined) || mongoose.model<OrderDoc>("Order", OrderSchema);
