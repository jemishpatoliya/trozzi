const mongoose = require('mongoose');

const { Payment } = require('../models/payment');
const { Order } = require('../models/order');
const { UserModel } = require('../models/user');
const { initiatePhonePeRefund } = require('../services/phonepeRefund');
const { validateTransition } = require('../middleware/stateMachine');
const domainEvents = require('../services/domainEvents');

async function processDueRefunds() {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    const now = new Date();

    const due = await db
      .collection('refund_requests')
      .find({
        status: 'approved',
        refundDueAt: { $lte: now.toISOString() },
        $or: [{ attemptCount: { $exists: false } }, { attemptCount: { $lt: 5 } }],
      })
      .limit(25)
      .toArray();

    for (const reqDoc of due) {
      const requestId = String(reqDoc?._id || '');
      const paymentId = String(reqDoc?.paymentId || '').trim();
      const orderId = String(reqDoc?.orderId || '').trim();

      try {
        if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId)) {
          throw new Error('Invalid paymentId on refund request');
        }

        const payment = await Payment.findById(paymentId);
        if (!payment) {
          throw new Error('Payment not found');
        }

        try {
          validateTransition('payment', payment.status, 'refunded');
        } catch (e) {
          throw new Error(e.message || 'Invalid payment transition');
        }

        const refundResult = await initiatePhonePeRefund({
          payment,
          amount: Number(payment.amount),
          reason: 'Auto refund after admin approval',
        });

        const nowIso = new Date().toISOString();

        await Payment.updateOne(
          { _id: payment._id },
          {
            $set: {
              status: 'refunded',
              refundedAtIso: nowIso,
              updatedAt: new Date(),
            },
            $push: {
              eventHistory: {
                provider: 'phonepe',
                event: 'refund_initiated',
                state: 'PENDING',
                at: nowIso,
                raw: refundResult,
              },
            },
          },
        );

        await db.collection('refund_requests').updateOne(
          { _id: reqDoc._id },
          {
            $set: {
              status: 'completed',
              processedAt: nowIso,
              updatedAt: nowIso,
              lastError: '',
              raw: refundResult,
            },
            $inc: { attemptCount: 1 },
          },
        );

        try {
          const order = orderId && mongoose.Types.ObjectId.isValid(orderId) ? await Order.findById(orderId) : null;
          const user = payment.user ? await UserModel.findById(payment.user) : null;
          if (user && order) {
            domainEvents.emit('payment:refunded', { user, order, payment });
          }
        } catch (e) {
          console.error('Refund domain event error:', e);
        }
      } catch (e) {
        const errMsg = e && e.message ? String(e.message) : 'Refund processing failed';
        console.error(`Refund worker failed (request ${requestId}):`, e);

        await db.collection('refund_requests').updateOne(
          { _id: reqDoc._id },
          {
            $set: {
              status: 'approved',
              updatedAt: new Date().toISOString(),
              lastError: errMsg,
            },
            $inc: { attemptCount: 1 },
          },
        );
      }
    }
  } catch (e) {
    console.error('Refund worker error:', e);
  }
}

module.exports = { processDueRefunds };
