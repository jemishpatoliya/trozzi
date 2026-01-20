const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { Shipment } = require('../models/shipment');
const { Order } = require('../models/order');
const { verifyShiprocketSignature, ensureIdempotency, logWebhookFailure } = require('../middleware/webhookSecurity');
const domainEvents = require('../services/domainEvents');

const router = express.Router();

function normalizeShiprocketStatus(raw) {
  const base = String(raw ?? '').trim().toLowerCase();
  const map = {
    'new': 'new',
    'pickup scheduled': 'processing',
    'picked up': 'processing',
    'in transit': 'shipped',
    'out for delivery': 'shipped',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'rto initiated': 'returned',
    'rto delivered': 'returned',
    'returned': 'returned',
  };
  return map[base] || 'new';
}

router.post('/webhook/shiprocket', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const rawBody = req.body || '';
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return res.status(400).json({ ok: false, message: 'Invalid JSON body' });
    }

    // 1. Signature verification
    const signature = req.headers['x-shiprocket-signature'] || '';
    const secret = process.env.SHIPROCKET_WEBHOOK_SECRET;
    const sigVerify = verifyShiprocketSignature({ rawBody, signature, secret });
    if (!sigVerify.ok) {
      logWebhookFailure('Shiprocket', sigVerify.reason, ip, body);
      return res.status(401).json({ ok: false, message: 'Webhook verification failed', reason: sigVerify.reason });
    }

    // 2. Extract required fields
    const awb = String(body.awb || '');
    const orderNumber = String(body.order_id || '');
    const currentStatus = normalizeShiprocketStatus(body.status);
    const eventId = String(body.event_id || '');
    const now = new Date();

    // State machine helper
    const { validateTransition } = require('../middleware/stateMachine');

    if (!awb && !orderNumber) {
      return res.status(400).json({ ok: false, message: 'Missing AWB or order_id' });
    }

    // 3. Find shipment
    let shipment = await Shipment.findOne({ awbNumber: awb });
    if (!shipment) {
      // Try to find by orderNumber if shipment not found
      const order = await Order.findOne({ orderNumber });
      if (order) {
        shipment = await Shipment.findOne({ order: order._id });
      }
    }

    if (!shipment) {
      return res.status(200).json({ ok: true, received: true, updated: false, message: 'Shipment not found' });
    }

    // State machine: validate shipment status transition (now that shipment is loaded)
    try {
      validateTransition('shipment', shipment.status, currentStatus);
    } catch (e) {
      console.error('Invalid shipment transition:', e.message);
      return res.status(400).json({ ok: false, message: e.message });
    }

    // 4. Idempotency: reject duplicate events
    const idempotency = await ensureIdempotency({
      db: mongoose.connection.db,
      collection: 'shipments',
      eventId,
      orderId: shipment._id,
    });
    if (!idempotency.ok) {
      return res.status(200).json({ ok: true, received: true, updated: false, message: idempotency.reason, duplicate: true });
    }

    const historyItem = {
      status: currentStatus,
      at: now,
      raw: body,
    };

    const update = {
      $set: { status: currentStatus, updatedAt: now },
      $push: { eventHistory: historyItem },
    };

    if (currentStatus === 'shipped') update.$set.shippedAt = now;
    if (currentStatus === 'delivered') update.$set.deliveredAt = now;
    if (currentStatus === 'cancelled') update.$set.cancelledAt = now;
    if (currentStatus === 'returned') update.$set.returnedAt = now;

    await Shipment.updateOne({ _id: shipment._id }, update);

    // Update order status based on shipment
    const orderStatusMap = {
      new: 'processing',
      processing: 'processing',
      shipped: 'shipped',
      delivered: 'delivered',
      cancelled: 'cancelled',
      returned: 'returned',
    };

    const orderStatus = orderStatusMap[currentStatus] || 'processing';
    // State machine: validate order status transition
    const order = await Order.findById(shipment.order);
    if (order) {
      try {
        validateTransition('order', order.status, orderStatus);
      } catch (e) {
        console.error('Invalid order transition:', e.message);
        // Optionally: reject or allow with warning
      }
    }
    await Order.updateOne(
      { _id: shipment.order },
      {
        $set: {
          status: orderStatus,
          'shiprocket.orderId': String(body.shiprocket_order_id || ''),
          'shiprocket.lastWebhookAt': new Date().toISOString(),
          'shiprocket.lastEventId': String(body.event_id || ''),
        },
        $push: {
          statusHistory: { status: orderStatus, at: now, source: 'shiprocket' },
        },
      }
    );

    // Emit domain events for notifications + emails
    try {
      const updatedOrder = await Order.findById(shipment.order).populate('user');
      if (updatedOrder && updatedOrder.user) {
        const user = updatedOrder.user;
        const io = req.app.get('io');

        if (orderStatus === 'shipped') {
          domainEvents.emit('order:shipped', { user, order: updatedOrder, shipment, io });
        }
        if (orderStatus === 'delivered') {
          domainEvents.emit('order:delivered', { user, order: updatedOrder, io });
        }
        if (orderStatus === 'cancelled') {
          domainEvents.emit('order:cancelled', { user, order: updatedOrder, by: 'admin', io });
        }
      }
    } catch (e) {
      console.error('Shiprocket domain event emit error:', e);
    }

    const io = req.app.get('io');
    if (io) {
      const payload = {
        id: String(shipment._id),
        orderId: String(shipment.order),
        awbNumber: shipment.awbNumber,
        courierName: shipment.courierName,
        status: currentStatus,
        updatedAt: now.toISOString(),
      };

      io.to('admin').emit('shipment:status_changed', payload);
      io.to('admin').emit('orders:stats', await computeAdminOrderStats(mongoose.connection.db));

      const order = await Order.findById(shipment.order).populate('user', '_id email');
      if (order && order.user) {
        const userId = String(order.user._id || order.user);
        const email = String(order.user.email || '').toLowerCase();
        io.to(`user:${userId}`).emit('shipment:status_changed', payload);
        io.to(`user_${userId}`).emit('shipment:status_changed', payload);
        if (email) io.to(`user_email:${email}`).emit('shipment:status_changed', payload);

        // Emit order status change as well
        const orderPayload = {
          id: String(order._id),
          orderNumber: String(order.orderNumber || ''),
          status: order.status,
          updatedAt: now.toISOString(),
          source: 'shiprocket',
        };
        io.to('admin').emit('order:status_changed', orderPayload);
        io.to(`user:${userId}`).emit('order:status_changed', orderPayload);
        io.to(`user_${userId}`).emit('order:status_changed', orderPayload);
        if (email) io.to(`user_email:${email}`).emit('order:status_changed', orderPayload);
      }
    }

    return res.status(200).json({ ok: true, received: true, updated: true });
  } catch (e) {
    console.error('Shiprocket webhook error:', e);
    return res.status(500).json({ ok: false, message: 'Webhook processing failed' });
  }
});

async function computeAdminOrderStats(db) {
  try {
    const orders = db.collection('orders');
    const pipeline = [
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ];
    const results = await orders.aggregate(pipeline).toArray();
    const stats = {};
    results.forEach(r => { stats[r._id] = r.count; });
    return stats;
  } catch {
    return {};
  }
}

module.exports = router;
