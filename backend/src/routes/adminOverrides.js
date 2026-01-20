const express = require('express');
const mongoose = require('mongoose');
const { Shipment } = require('../models/shipment');
const { Order } = require('../models/order');
const { Payment } = require('../models/payment');
const { createShiprocketOrder } = require('../services/shiprocket');
const { verifyShiprocketSignature, ensureIdempotency, logWebhookFailure } = require('../middleware/webhookSecurity');
const { validateTransition } = require('../middleware/stateMachine');
const domainEvents = require('../services/domainEvents');

const router = express.Router();

// Admin: retry Shiprocket shipment creation for an order
router.post('/admin/shipments/:orderId/retry', async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid orderId' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const shipment = await Shipment.findOne({ order: orderId });
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    // State machine: allow retry from failed/paid_but_shipment_failed
    try {
      validateTransition('order', order.status, 'paid');
      validateTransition('shipment', shipment.status, 'new');
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }

    // Attempt Shiprocket creation
    try {
      const shiprocketPayload = {
        order_id: String(order.orderNumber || ''),
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: 'Primary',
        channel_id: '',
        comment: 'Admin manual retry',
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
        // Update order to paid if it was paid_but_shipment_failed
        if (order.status === 'paid_but_shipment_failed') {
          await Order.updateOne(
            { _id: order._id },
            {
              $set: { status: 'paid' },
              $push: {
                statusHistory: { status: 'paid', at: new Date().toISOString(), source: 'admin_retry' },
              },
            }
          );
        }
        return res.json({ success: true, message: 'Shipment retry initiated', data: shiprocketResult });
      } else {
        throw new Error('Shiprocket API error');
      }
    } catch (e) {
      await Shipment.updateOne(
        { _id: shipment._id },
        {
          $set: { lastError: e.message, lastRetryAt: new Date() },
          $push: {
            eventHistory: { status: 'failed', at: new Date(), raw: { error: e.message } },
          },
        }
      );
      return res.status(500).json({ success: false, message: 'Retry failed', error: e.message });
    }
  } catch (e) {
    console.error('Admin shipment retry error:', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: cancel shipment before pickup
router.post('/admin/shipments/:shipmentId/cancel', async (req, res) => {
  try {
    const { shipmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(shipmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid shipmentId' });
    }

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    // State machine: allow cancel from new/processing/failed
    try {
      validateTransition('shipment', shipment.status, 'cancelled');
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }

    await Shipment.updateOne(
      { _id: shipment._id },
      {
        $set: { status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() },
        $push: {
          eventHistory: { status: 'cancelled', at: new Date(), source: 'admin', raw: req.body },
        },
      }
    );

    // Update order to cancelled if needed
    const order = await Order.findById(shipment.order);
    if (order && ['new', 'processing', 'paid_but_shipment_failed'].includes(order.status)) {
      try {
        validateTransition('order', order.status, 'cancelled');
      } catch (_e) {
        // Log but proceed
      }
      await Order.updateOne(
        { _id: order._id },
        {
          $set: { status: 'cancelled' },
          $push: {
            statusHistory: { status: 'cancelled', at: new Date().toISOString(), source: 'admin' },
          },
        }
      );

      try {
        const updatedOrder = await Order.findById(order._id).populate('user');
        if (updatedOrder && updatedOrder.user) {
          const io = req.app.get('io');
          domainEvents.emit('order:cancelled', { user: updatedOrder.user, order: updatedOrder, by: 'admin', io });
        }
      } catch (e) {
        console.error('Admin cancel order domain event error:', e);
      }
    }

    return res.json({ success: true, message: 'Shipment cancelled' });
  } catch (e) {
    console.error('Admin shipment cancel error:', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: mark order as manually delivered
router.post('/admin/orders/:orderId/deliver', async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid orderId' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // State machine: allow delivered from shipped/paid
    try {
      validateTransition('order', order.status, 'delivered');
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }

    await Order.updateOne(
      { _id: order._id },
      {
        $set: { status: 'delivered' },
        $push: {
          statusHistory: { status: 'delivered', at: new Date().toISOString(), source: 'admin' },
        },
      }
    );

    try {
      const updatedOrder = await Order.findById(order._id).populate('user');
      if (updatedOrder && updatedOrder.user) {
        const io = req.app.get('io');
        domainEvents.emit('order:delivered', { user: updatedOrder.user, order: updatedOrder, io });
      }
    } catch (e) {
      console.error('Admin deliver order domain event error:', e);
    }

    return res.json({ success: true, message: 'Order marked as delivered' });
  } catch (e) {
    console.error('Admin order deliver error:', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: trigger PhonePe refund
router.post('/admin/payments/:paymentId/refund', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ success: false, message: 'Invalid paymentId' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // State machine: allow refund from completed
    try {
      validateTransition('payment', payment.status, 'refunded');
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }

    // Initiate PhonePe refund
    const { initiatePhonePeRefund } = require('../services/phonepeRefund');
    const refundResult = await initiatePhonePeRefund({
      payment,
      amount: Number(amount) || Number(payment.amount),
      reason: reason || 'Admin refund',
    });

    const now = new Date().toISOString();
    await Payment.updateOne(
      { _id: payment._id },
      {
        $set: {
          status: 'refunded',
          refundedAtIso: now,
          updatedAt: new Date(),
        },
        $push: {
          eventHistory: { provider: 'phonepe', event: 'refund_initiated', state: 'PENDING', at: now, raw: refundResult },
        },
      }
    );

    // Update order if needed
    if (payment.order) {
      await Order.updateOne(
        { _id: payment.order },
        {
          $set: { status: 'refunded' },
          $push: {
            statusHistory: { status: 'refunded', at: now, source: 'admin_refund' },
          },
        }
      );
    }

    // Emit Socket.IO events
    const io = req.app.get('io');
    if (io) {
      const userId = payment.user ? String(payment.user) : '';
      const payload = {
        id: String(payment._id),
        provider: 'phonepe',
        providerOrderId: payment.providerOrderId,
        status: 'refunded',
        amount: Number(amount) || Number(payment.amount),
        currency: payment.currency || 'INR',
        refundedAt: now,
        refundResult,
      };
      io.to('admin').emit('payment:status_changed', payload);
      if (userId) {
        io.to(`user:${userId}`).emit('payment:status_changed', payload);
        io.to(`user_${userId}`).emit('payment:status_changed', payload);
      }
    }

    return res.json({ success: true, message: 'Refund initiated', data: refundResult });
  } catch (e) {
    console.error('Admin refund error:', e);
    return res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

module.exports = router;
