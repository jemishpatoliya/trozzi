const mongoose = require('mongoose');
const { Shipment } = require('../models/shipment');
const { Order } = require('../models/order');
const { createShiprocketOrder } = require('../services/shiprocket');

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

        const shiprocketPayload = {
          order_id: String(order.orderNumber || ''),
          order_date: new Date().toISOString().split('T')[0],
          pickup_location: 'Primary',
          channel_id: '',
          comment: `Retry attempt ${shipment.retryCount + 1}`,
          billing_customer_name: String(order.customer?.name || ''),
          billing_last_name: '',
          billing_address: String(order.address?.line1 || ''),
          billing_address_2: String(order.address?.line2 || ''),
          billing_city: String(order.address?.city || ''),
          billing_state: String(order.address?.state || ''),
          billing_pincode: String(order.address?.postalCode || ''),
          billing_country: String(order.address?.country || 'India'),
          billing_email: String(order.customer?.email || ''),
          billing_phone: String(order.customer?.phone || ''),
          shipping_is_billing: true,
          shipping_customer_name: '',
          shipping_last_name: '',
          shipping_address: '',
          shipping_address_2: '',
          shipping_city: '',
          shipping_state: '',
          shipping_pincode: '',
          shipping_country: '',
          shipping_email: '',
          shipping_phone: '',
          order_items: (order.items || []).map(item => ({
            name: String(item.name || ''),
            sku: String(item.sku || ''),
            units: Number(item.quantity || 1),
            selling_price: Number(item.price || 0),
            discount: Number(item.discount || 0),
            tax: Number(item.tax || 0),
            hsn: Number(item.hsn || 0),
          })),
          payment_method: 'Prepaid',
          shipping_charges: Number(order.shipping || 0),
          giftwrap_charges: 0,
          transaction_charges: 0,
          total_discount: 0,
          sub_total: Number(order.subtotal || 0),
          length: 10,
          breadth: 10,
          height: 10,
          weight: 0.5,
        };

        const shiprocketResult = await createShiprocketOrder(shiprocketPayload);
        if (shiprocketResult && shiprocketResult.order_id) {
          // Success: update shipment
          await Shipment.updateOne(
            { _id: shipment._id },
            {
              $set: {
                shiprocketOrderId: String(shiprocketResult.order_id || ''),
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
