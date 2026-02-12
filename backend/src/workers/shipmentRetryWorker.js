const mongoose = require('mongoose');
const { Shipment } = require('../models/shipment');
const { Order } = require('../models/order');
const { createShipmentForOrder } = require('../services/shiprocket.service');

function toShiprocketPaymentMethod(order) {
  const raw = String(order?.paymentMethod || '').toLowerCase();
  if (raw === 'cod' || raw === 'cash_on_delivery') return 'COD';
  return 'Prepaid';
}

async function retryFailedShipments() {
  try {
    const now = new Date();
    const failedShipments = await Shipment.find({
      status: 'failed',
      nextRetryAfter: { $lte: now },
      retryCount: { $lt: 5 }, // max 5 retries
    });

    for (const shipment of failedShipments) {
      try {
        console.log(`Retrying shipment for order ${shipment.order}, attempt ${shipment.retryCount + 1}`);
        const order = await Order.findById(shipment.order);
        if (!order) continue;

        const paymentMethod = toShiprocketPaymentMethod(order);
        const shiprocketResult = await createShipmentForOrder(order, { paymentMethod });
        if (shiprocketResult && shiprocketResult.order_id) {
          // Success: update shipment
          await Shipment.updateOne(
            { _id: shipment._id },
            {
              $set: {
                shiprocketOrderId: String(shiprocketResult.order_id || ''),
                shiprocketShipmentId: String(shiprocketResult.shipment_id || ''),
                courierId: Number(shiprocketResult.courier_id || 0) || 0,
                awbNumber: String(shiprocketResult.awb_code || ''),
                courierName: String(shiprocketResult.courier_name || ''),
                status: 'new',
                trackingUrl: shiprocketResult.tracking_url || '',
                estimatedDelivery: shiprocketResult.estimated_delivery_days ? new Date(Date.now() + shiprocketResult.estimated_delivery_days * 24 * 60 * 60 * 1000) : null,
                retryCount: 0,
                lastError: '',
                lastRetryAt: null,
                nextRetryAfter: null,
                updatedAt: new Date(),
              },
              $push: {
                eventHistory: { status: 'new', at: new Date(), raw: shiprocketResult },
              },
            }
          );
          // Update order status to paid if it was paid_but_shipment_failed
          if (order.status === 'paid_but_shipment_failed') {
            await Order.updateOne(
              { _id: order._id },
              {
                $set: { status: 'paid' },
                $push: {
                  statusHistory: { status: 'paid', at: new Date().toISOString(), source: 'shiprocket_retry' },
                },
              }
            );
          }
        } else {
          // Still failed: schedule next retry with exponential backoff
          const nextRetryMinutes = Math.min(60, 5 * Math.pow(2, shipment.retryCount)); // 5, 10, 20, 40, 60
          await Shipment.updateOne(
            { _id: shipment._id },
            {
              $set: {
                retryCount: shipment.retryCount + 1,
                lastError: 'Shiprocket API error',
                lastRetryAt: new Date(),
                nextRetryAfter: new Date(Date.now() + nextRetryMinutes * 60 * 1000),
              },
              $push: {
                eventHistory: { status: 'failed', at: new Date(), raw: { error: 'Shiprocket API error' } },
              },
            }
          );
        }
      } catch (e) {
        console.error(`Retry failed for shipment ${shipment._id}:`, e);
        await Shipment.updateOne(
          { _id: shipment._id },
          {
            $set: {
              retryCount: shipment.retryCount + 1,
              lastError: e.message,
              lastRetryAt: new Date(),
            },
            $push: {
              eventHistory: { status: 'failed', at: new Date(), raw: { error: e.message } },
            },
          }
        );
      }
    }
  } catch (e) {
    console.error('Retry worker error:', e);
  }
}

module.exports = { retryFailedShipments };
