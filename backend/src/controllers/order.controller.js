const { Order } = require('../models/order');
const { Shipment } = require('../models/shipment');
const { createShipmentForOrder } = require('../services/shiprocket.service');

function getPaymentMethodForShiprocket(order) {
  const method = String(order?.paymentMethod || '').toLowerCase();
  // Shiprocket expects 'Prepaid' or 'COD'
  if (method === 'cod' || method === 'cash_on_delivery') return 'COD';
  return 'Prepaid';
}

async function createShiprocketShipmentAfterPaymentSuccess({ orderId }) {
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }

  // Idempotency: if shipment already exists, return it.
  const existing = await Shipment.findOne({ order: order._id });
  if (existing) return { ok: true, shipment: existing, created: false };

  const paymentMethod = getPaymentMethodForShiprocket(order);

  const shiprocketResult = await createShipmentForOrder(order, { paymentMethod });

  const shipment = await Shipment.create({
    order: order._id,
    shiprocketOrderId: String(shiprocketResult?.order_id || ''),
    shiprocketShipmentId: String(shiprocketResult?.shipment_id || ''),
    courierId: Number(shiprocketResult?.courier_id || 0) || 0,
    awbNumber: String(shiprocketResult?.awb_code || ''),
    courierName: String(shiprocketResult?.courier_name || ''),
    status: 'new',
    trackingUrl: shiprocketResult?.tracking_url || '',
    estimatedDelivery: shiprocketResult?.estimated_delivery_days
      ? new Date(Date.now() + Number(shiprocketResult.estimated_delivery_days) * 24 * 60 * 60 * 1000)
      : null,
    eventHistory: [{ status: 'new', at: new Date(), raw: shiprocketResult }],
  });

  return { ok: true, shipment, created: true };
}

module.exports = {
  createShiprocketShipmentAfterPaymentSuccess,
};
