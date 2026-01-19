const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    orderNumber: { type: String, required: true, unique: true },
    status: {
      type: String,
      required: true,
      enum: ['new', 'processing', 'paid', 'paid_but_shipment_failed', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'new',
    },
    shiprocket: {
      type: {
        orderId: { type: String, required: false, default: '' },
        lastWebhookAt: { type: String, required: false, default: '' },
        lastEventId: { type: String, required: false, default: '' },
      },
      required: false,
      default: undefined,
    },
    statusTimestamps: { type: mongoose.Schema.Types.Mixed, required: false, default: {} },
    statusHistory: {
      type: [
        {
          status: {
            type: String,
            required: true,
            enum: ['new', 'processing', 'paid', 'paid_but_shipment_failed', 'shipped', 'delivered', 'cancelled', 'returned'],
          },
          at: { type: String, required: true },
          source: { type: String, required: false },
          error: { type: String, required: false },
        },
      ],
      required: false,
      default: [],
    },
    currency: { type: String, required: true, default: 'USD' },
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
          sku: { type: String, required: false },
          discount: { type: Number, required: false },
          tax: { type: Number, required: false },
          hsn: { type: Number, required: false },
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

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

module.exports = { Order, OrderModel: Order };
