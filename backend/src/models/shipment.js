const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  shiprocketOrderId: { type: String, required: true },
  awbNumber: { type: String, required: true },
  courierName: { type: String, required: true },
  status: { type: String, required: true, enum: ['new', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'], default: 'new' },
  trackingUrl: { type: String },
  estimatedDelivery: { type: Date },
  shippedAt: { type: Date },
  deliveredAt: { type: Date },
  cancelledAt: { type: Date },
  returnedAt: { type: Date },
  // Retry and fail-safe fields
  retryCount: { type: Number, default: 0 },
  lastError: { type: String },
  lastRetryAt: { type: Date },
  nextRetryAfter: { type: Date },
  eventHistory: [{
    status: { type: String, required: true },
    at: { type: Date, required: true },
    raw: { type: mongoose.Schema.Types.Mixed },
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

shipmentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Shipment = mongoose.models.Shipment || mongoose.model('Shipment', shipmentSchema);

module.exports = { Shipment, ShipmentModel: Shipment };
