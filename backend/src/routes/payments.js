const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const crypto = require('crypto');
const https = require('https');

const { AdminModel } = require('../models/admin');
const { UserModel } = require('../models/user');
const { ProductModel } = require('../models/product');
const domainEvents = require('../services/domainEvents');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function normalizeOrderItemSnapshot(item) {
  const it = item && typeof item === 'object' ? item : {};
  const selectedSize = String(it.selectedSize ?? it.size ?? '').trim();
  const selectedColor = String(it.selectedColor ?? it.color ?? '').trim();
  const selectedImage = String(it.selectedImage ?? it.image ?? '').trim();

  return {
    productId: String(it.productId ?? ''),
    name: String(it.name ?? ''),
    price: Number(it.price ?? 0) || 0,
    quantity: Math.max(0, Number(it.quantity ?? 0) || 0),
    image: String(it.image ?? '').trim(),
    color: String(it.color ?? '').trim(),
    size: String(it.size ?? '').trim(),
    selectedSize,
    selectedColor,
    selectedImage,
  };
}

function safeJsonParse(raw) {
  try {
    return { ok: true, value: JSON.parse(String(raw || '')) };
  } catch (_e) {
    return { ok: false, value: null };
  }
}

async function authenticateAny(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const type = decoded && decoded.type;
    const id = decoded && decoded.id;

    if (!id || (type !== 'admin' && type !== 'user')) {
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
      return null;
    }

    if (type === 'admin') {
      const admin = await AdminModel.findById(id);
      if (!admin || !admin.active || admin.role !== 'admin') {
        res.status(401).json({ success: false, message: 'Invalid or expired admin token' });
        return null;
      }
      return { type: 'admin', adminId: String(admin._id) };
    }

    const user = await UserModel.findById(id);
    if (!user || !user.active) {
      res.status(401).json({ success: false, message: 'Invalid or expired user token' });
      return null;
    }

    return { type: 'user', userId: String(user._id), email: String(user.email || '').toLowerCase() };
  } catch (_e) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return null;
  }
}

function timingSafeEqualStr(a, b) {
  const aa = Buffer.from(String(a || ''), 'utf8');
  const bb = Buffer.from(String(b || ''), 'utf8');
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function sha256Hex(input) {
  return crypto.createHash('sha256').update(String(input || ''), 'utf8').digest('hex');
}

function normalizePhonePeAuthHeader(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const parts = raw.split(/\s+/);
  if (parts.length >= 2 && parts[0].toLowerCase() === 'sha256') {
    return parts.slice(1).join(' ').trim();
  }
  return raw;
}

function verifyPhonePeWebhookAuth(req) {
  const username = String(process.env.PHONEPE_WEBHOOK_USERNAME || '').trim();
  const password = String(process.env.PHONEPE_WEBHOOK_PASSWORD || '').trim();
  if (!username || !password) {
    return { ok: false, reason: 'Missing PHONEPE_WEBHOOK_USERNAME or PHONEPE_WEBHOOK_PASSWORD' };
  }

  const expected = sha256Hex(`${username}:${password}`);
  const got = normalizePhonePeAuthHeader(req.headers.authorization);
  if (!got) return { ok: false, reason: 'Missing Authorization header' };

  return timingSafeEqualStr(expected, got)
    ? { ok: true }
    : { ok: false, reason: 'Invalid Authorization header' };
}

function normalizePhonePeEvent(raw) {
  const v = String(raw || '').trim().toLowerCase();
  return v;
}

function normalizePhonePeState(raw) {
  const v = String(raw || '').trim().toUpperCase();
  return v;
}

function normalizePaymentStatusFromPhonePe(state) {
  const s = normalizePhonePeState(state);
  if (s === 'COMPLETED' || s === 'SUCCESS') return 'completed';
  if (s === 'FAILED') return 'failed';
  if (s === 'PENDING' || s === 'INITIATED') return 'pending';
  if (s === 'REFUNDED' || s === 'REFUND') return 'refunded';
  return 'pending';
}

function extractPhonePeDetails(body) {
  const root = body && typeof body === 'object' ? body : {};
  const payload = root.payload && typeof root.payload === 'object' ? root.payload : {};

  const event = normalizePhonePeEvent(root.event);
  const state = normalizePhonePeState(payload.state);

  const merchantOrderId = String(payload.merchantOrderId || payload.merchantTransactionId || payload.merchant_order_id || '');
  const orderId = String(payload.orderId || payload.transactionId || payload.order_id || '');

  const paymentDetailsArr = Array.isArray(payload.paymentDetails) ? payload.paymentDetails : [];
  const firstDetail = paymentDetailsArr[0] && typeof paymentDetailsArr[0] === 'object' ? paymentDetailsArr[0] : {};

  const paymentMode = String(firstDetail.paymentMode || payload.paymentMode || '');
  const transactionId = String(firstDetail.transactionId || firstDetail.transaction_id || payload.transactionId || '');
  const amount = Number(firstDetail.amount ?? payload.amount ?? 0) || 0;
  const timestamp = Number(firstDetail.timestamp ?? payload.timestamp ?? 0) || 0;

  return {
    event,
    state,
    merchantOrderId,
    orderId,
    paymentMode,
    transactionId,
    amount,
    timestamp,
    raw: root,
  };
}

function computeAdminPaymentStats(db) {
  return db
    .collection('payments')
    .aggregate([
      {
        $group: {
          _id: { $ifNull: ['$status', 'pending'] },
          count: { $sum: 1 },
          amount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, { $ifNull: ['$amount', 0] }, 0] } },
        },
      },
    ])
    .toArray()
    .then((rows) => {
      const counts = { pending: 0, completed: 0, failed: 0, refunded: 0 };
      let revenue = 0;
      for (const r of rows) {
        const k = String(r?._id || 'pending');
        const c = Number(r?.count ?? 0) || 0;
        if (Object.prototype.hasOwnProperty.call(counts, k)) counts[k] += c;
        if (k === 'completed') revenue = Number(r?.amount ?? 0) || 0;
      }
      return { counts, revenue };
    });
}

// GET /api/payments/methods
router.get('/methods', async (_req, res) => {
  return res.json({
    success: true,
    data: [
      { id: 'phonepe', type: 'phonepe', name: 'PhonePe', icon: '📱', enabled: true },
      { id: 'upi', type: 'upi', name: 'UPI', icon: '💳', enabled: true },
    ],
  });
});

// GET /api/payments/stats (admin)
router.get('/stats', async (req, res) => {
  try {
    const auth = await authenticateAny(req, res);
    if (!auth) return;
    if (auth.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not ready' });
    }

    const stats = await computeAdminPaymentStats(db);
    return res.json({ success: true, data: stats });
  } catch (e) {
    console.error('Payments stats error:', e);
    return res.status(500).json({ success: false, message: 'Failed to load payment stats' });
  }
});

function paymentDocToTransaction(p) {
  const last = Array.isArray(p?.eventHistory) ? p.eventHistory[p.eventHistory.length - 1] : null;
  return {
    id: String(p._id),
    orderId: p.order ? String(p.order) : '',
    userId: p.user ? String(p.user) : '',
    amount: Number(p.amount ?? 0),
    currency: String(p.currency || 'INR'),
    paymentMethod: String(p.paymentMethod || p.provider || ''),
    status: String(p.status || 'pending'),
    transactionId: String(p.transactionId || ''),
    merchantTransactionId: String(p.providerOrderId || ''),
    gatewayResponse: last,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
    completedAt: p.paidAtIso || undefined,
    refundedAt: p.refundedAtIso || undefined,
    failureReason: p.providerStatus || undefined,
  };
}

// GET /api/payments/transactions (admin)
router.get('/transactions', async (req, res) => {
  try {
    const auth = await authenticateAny(req, res);
    if (!auth) return;
    if (auth.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const page = Math.max(1, Number(req.query?.page ?? 1) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query?.limit ?? 50) || 50));
    const status = String(req.query?.status || '').trim();
    const paymentMethod = String(req.query?.paymentMethod || '').trim();
    const search = String(req.query?.search || '').trim();

    const q = {};
    if (status) q.status = status;
    if (paymentMethod) q.paymentMethod = paymentMethod;
    if (search) {
      q.$or = [
        { providerOrderId: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } },
      ];
    }

    const docs = await Payment.find(q)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({ success: true, data: docs.map(paymentDocToTransaction) });
  } catch (e) {
    console.error('Payments transactions error:', e);
    return res.status(500).json({ success: false, message: 'Failed to load transactions' });
  }
});

// GET /api/payments/user/:userId (admin or owning user)
router.get('/user/:userId', async (req, res) => {
  try {
    const auth = await authenticateAny(req, res);
    if (!auth) return;

    const userId = String(req.params.userId || '');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    if (auth.type === 'user' && String(auth.userId) !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const docs = await Payment.find({ user: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1, _id: -1 })
      .limit(200);

    return res.json({ success: true, data: docs.map(paymentDocToTransaction) });
  } catch (e) {
    console.error('Payments user transactions error:', e);
    return res.status(500).json({ success: false, message: 'Failed to load transactions' });
  }
});

// GET /api/payments/stats (admin)
router.get('/stats', async (req, res) => {
  try {
    const auth = await authenticateAny(req, res);
    if (!auth) return;
    if (auth.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not ready' });
    }

    const pipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
        },
      },
    ];

    const results = await db.collection('payments').aggregate(pipeline).toArray();
    const stats = {
      total: 0,
      totalAmount: 0,
      pending: { count: 0, amount: 0 },
      processing: { count: 0, amount: 0 },
      completed: { count: 0, amount: 0 },
      failed: { count: 0, amount: 0 },
      refunded: { count: 0, amount: 0 },
    };

    results.forEach(r => {
      const status = r._id;
      stats.total += r.count;
      stats.totalAmount += r.amount;
      if (stats[status]) {
        stats[status].count = r.count;
        stats[status].amount = r.amount;
      }
    });

    return res.json({ success: true, data: stats });
  } catch (e) {
    console.error('Payment stats error:', e);
    return res.status(500).json({ success: false, message: 'Failed to load payment stats' });
  }
});

function httpPostJson(urlString, { headers, body }) {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlString);
      const payload = JSON.stringify(body ?? {});

      const req = https.request(
        {
          method: 'POST',
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: `${url.pathname}${url.search}`,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            ...(headers || {}),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body: data });
          });
        },
      );

      req.on('error', () => resolve({ ok: false, status: 0, body: '' }));
      req.write(payload);
      req.end();
    } catch (_e) {
      resolve({ ok: false, status: 0, body: '' });
    }
  });
}

function makeOrderNumber() {
  const part = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `ORD-${Date.now().toString().slice(-6)}-${part}`;
}

function sha256HexUtf8(input) {
  return crypto.createHash('sha256').update(String(input || ''), 'utf8').digest('hex');
}

function phonePeXVerify({ base64Payload, apiPath }) {
  const saltKey = String(process.env.PHONEPE_SALT_KEY || '').trim();
  const saltIndex = String(process.env.PHONEPE_SALT_INDEX || '').trim();
  if (!saltKey || !saltIndex) return { ok: false, value: '' };
  const checksum = sha256HexUtf8(`${base64Payload}${apiPath}${saltKey}`);
  return { ok: true, value: `${checksum}###${saltIndex}` };
}

function httpPostPhonePeJson({ baseUrl, path, headers, body }) {
  return new Promise((resolve) => {
    try {
      const normalized = String(baseUrl || '').replace(/\/$/, '');
      const url = new URL(`${normalized}${path}`);
      const payload = JSON.stringify(body ?? {});
      const req = https.request(
        {
          method: 'POST',
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: `${url.pathname}${url.search}`,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            ...(headers || {}),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body: data });
          });
        },
      );
      req.on('error', () => resolve({ ok: false, status: 0, body: '' }));
      req.write(payload);
      req.end();
    } catch (_e) {
      resolve({ ok: false, status: 0, body: '' });
    }
  });
}

// Minimal Payment schema for JS runtime (mirrors src/models/payment.ts)
const PaymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, enum: ['razorpay', 'phonepe', 'paytm', 'upi'], default: 'upi', required: true },
    providerOrderId: { type: String, unique: true, sparse: true },
    providerPaymentId: { type: String },
    providerSignature: { type: String },
    razorpayOrderId: { type: String, unique: true, sparse: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'INR' },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    paymentMethod: { type: String, enum: ['razorpay', 'phonepe', 'paytm', 'upi'], default: 'upi' },
    transactionId: { type: String },
    paymentMode: { type: String },
    providerStatus: { type: String },
    paidAtIso: { type: String },
    failedAtIso: { type: String },
    refundedAtIso: { type: String },
    eventHistory: { type: [mongoose.Schema.Types.Mixed], default: [] },
    metadata: { type: mongoose.Schema.Types.Mixed, required: false },
  },
  { timestamps: true },
);

const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);

// Minimal Order schema for JS runtime (mirrors src/models/order.ts)
const OrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    orderNumber: { type: String, required: true, unique: true },
    status: {
      type: String,
      required: true,
      enum: ['new', 'processing', 'paid', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'new',
    },
    currency: { type: String, required: true, default: 'INR' },
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
          color: { type: String, required: false },
          size: { type: String, required: false },
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

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId || decoded.id;
    if (!req.userId) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    next();
  } catch (_err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// POST /api/payments/webhook/phonepe
// PhonePe PG webhook validation uses Authorization: SHA256(<sha256(username:password)>) and X-VERIFY checksum
router.post('/webhook/phonepe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const rawBody = req.body || '';
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return res.status(400).json({ ok: false, message: 'Invalid JSON body' });
    }

    // 1. Basic auth verification
    const basicAuth = require('../middleware/webhookSecurity').verifyPhonePeBasicAuth(req);
    if (!basicAuth.ok) {
      require('../middleware/webhookSecurity').logWebhookFailure('PhonePe', basicAuth.reason, ip, body);
      return res.status(401).json({ ok: false, message: 'Webhook verification failed', reason: basicAuth.reason });
    }

    // 2. Extract PhonePe X-VERIFY checksum if present (some endpoints send it)
    const xVerify = req.headers['x-verify'] || '';
    if (xVerify) {
      const apiPath = '/pg/v1/status';
      const base64Payload = Buffer.from(JSON.stringify(body)).toString('base64');
      const checksum = require('../middleware/webhookSecurity').verifyPhonePeChecksum({ base64Payload, apiPath, xVerify });
      if (!checksum.ok) {
        require('../middleware/webhookSecurity').logWebhookFailure('PhonePe', checksum.reason, ip, body);
        return res.status(401).json({ ok: false, message: 'Checksum verification failed', reason: checksum.reason });
      }
    }

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ ok: false, message: 'Database not ready' });
    }

    const details = extractPhonePeDetails(body);
    if (!details.merchantOrderId) {
      return res.status(400).json({ ok: false, message: 'Missing merchantOrderId' });
    }

    const payment = await Payment.findOne({ provider: 'phonepe', providerOrderId: details.merchantOrderId });
    if (!payment) {
      return res.status(200).json({ ok: true, received: true, updated: false, message: 'Payment not found' });
    }

    // 3. Idempotency: reject duplicate events using PhonePe transactionId
    const eventId = details.transactionId || details.orderId;
    const idempotency = await require('../middleware/webhookSecurity').ensureIdempotency({
      db,
      collection: 'payments',
      eventId,
      orderId: payment._id,
    });
    if (!idempotency.ok) {
      return res.status(200).json({ ok: true, received: true, updated: false, message: idempotency.reason, duplicate: true });
    }

    const nextStatus = normalizePaymentStatusFromPhonePe(details.state);
    const nowIso = new Date().toISOString();

    // State machine: validate payment status transition
    const { validateTransition } = require('../middleware/stateMachine');
    try {
      validateTransition('payment', payment.status, nextStatus);
    } catch (e) {
      console.error('Invalid payment transition:', e.message);
      // Optionally: reject or allow with warning
    }

    const historyItem = {
      provider: 'phonepe',
      event: details.event,
      state: details.state,
      at: nowIso,
      orderId: details.orderId,
      merchantOrderId: details.merchantOrderId,
      transactionId: details.transactionId,
      paymentMode: details.paymentMode,
      amount: details.amount,
      timestamp: details.timestamp,
      raw: details.raw,
    };

    const set = {
      status: nextStatus,
      providerStatus: details.state,
      transactionId: details.transactionId || payment.transactionId,
      paymentMode: details.paymentMode || payment.paymentMode,
      updatedAt: new Date(),
    };

    if (nextStatus === 'completed') set.paidAtIso = payment.paidAtIso || nowIso;
    if (nextStatus === 'failed') set.failedAtIso = payment.failedAtIso || nowIso;
    if (nextStatus === 'refunded') set.refundedAtIso = payment.refundedAtIso || nowIso;

    await Payment.updateOne(
      { _id: payment._id },
      {
        $set: set,
        $push: { eventHistory: historyItem },
      },
    );

    // Ensure order is marked paid when payment is completed
    let updatedOrder = null;
    if (nextStatus === 'completed') {
      if (payment.order) {
        await Order.updateOne(
          { _id: payment.order },
          {
            $set: { status: 'paid' },
            $push: {
              statusHistory: { status: 'paid', at: nowIso, source: 'phonepe' },
            },
            $setOnInsert: { createdAtIso: nowIso },
          },
        );
        updatedOrder = await Order.findById(payment.order);
      } else if (payment.metadata && payment.metadata.orderData) {
        const orderData = payment.metadata.orderData;
        const part = Math.random().toString(16).slice(2, 8).toUpperCase();
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${part}`;

        const createdOrder = await Order.create({
          user: payment.user,
          orderNumber,
          status: 'paid',
          currency: orderData.currency || 'INR',
          subtotal: Number(orderData.subtotal ?? 0),
          shipping: Number(orderData.shipping ?? 0),
          tax: Number(orderData.tax ?? 0),
          total: Number(orderData.total ?? payment.amount ?? 0),
          items: Array.isArray(orderData.items) ? orderData.items.map(normalizeOrderItemSnapshot) : [],
          customer: orderData.customer || {},
          address: orderData.address || {},
          createdAtIso: nowIso,
          statusHistory: [{ status: 'paid', at: nowIso, source: 'phonepe' }],
          statusTimestamps: { paid: nowIso },
        });

        await Payment.updateOne({ _id: payment._id }, { $set: { order: createdOrder._id } });
        updatedOrder = createdOrder;
      }
    }

    // Deduct stock (idempotent) when order is paid
    if (nextStatus === 'completed' && updatedOrder) {
      try {
        const ordersCollection = db.collection('orders');
        const lock = await ordersCollection.findOneAndUpdate(
          { _id: updatedOrder._id, stockAdjustedAt: { $exists: false } },
          { $set: { stockAdjustedAt: nowIso } },
          { returnDocument: 'before' },
        );

        // If order was already adjusted, skip
        if (lock && lock.value) {
          const itemsArr = Array.isArray(updatedOrder.items) ? updatedOrder.items : [];
          for (const it of itemsArr) {
            const productId = String(it?.productId || '').trim();
            const qty = Math.max(0, Number(it?.quantity ?? 0) || 0);
            if (!productId || qty <= 0) continue;
            if (!mongoose.Types.ObjectId.isValid(productId)) continue;
            // eslint-disable-next-line no-await-in-loop
            const upd = await ProductModel.updateOne(
              { _id: new mongoose.Types.ObjectId(productId), stock: { $gte: qty } },
              { $inc: { stock: -qty } },
            );
            if (!upd?.matchedCount) {
              console.warn(`Insufficient stock for product ${productId}. qty=${qty}`);
            }
          }
        }
      } catch (e) {
        console.error('Stock deduction error:', e);
      }
    }

    // Create shipping order in Shiprocket after payment success
    let shiprocketResult = null;
    if (nextStatus === 'completed' && updatedOrder) {
      try {
        const { createShiprocketOrder } = require('../services/shiprocket');
        const shiprocketPayload = {
          order_id: String(updatedOrder.orderNumber || ''),
          order_date: new Date().toISOString().split('T')[0],
          pickup_location: 'Primary',
          channel_id: '',
          comment: 'Order created via PhonePe payment',
          billing_customer_name: String(updatedOrder.customer?.name || ''),
          billing_last_name: '',
          billing_address: String(updatedOrder.address?.line1 || ''),
          billing_address_2: String(updatedOrder.address?.line2 || ''),
          billing_city: String(updatedOrder.address?.city || ''),
          billing_state: String(updatedOrder.address?.state || ''),
          billing_pincode: String(updatedOrder.address?.postalCode || ''),
          billing_country: String(updatedOrder.address?.country || 'India'),
          billing_email: String(updatedOrder.customer?.email || ''),
          billing_phone: String(updatedOrder.customer?.phone || ''),
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
          order_items: (updatedOrder.items || []).map(item => ({
            name: String(item.name || ''),
            sku: String(item.sku || ''),
            units: Number(item.quantity || 1),
            selling_price: Number(item.price || 0),
            discount: Number(item.discount || 0),
            tax: Number(item.tax || 0),
            hsn: Number(item.hsn || 0),
          })),
          payment_method: 'Prepaid',
          shipping_charges: Number(updatedOrder.shipping || 0),
          giftwrap_charges: 0,
          transaction_charges: 0,
          total_discount: 0,
          sub_total: Number(updatedOrder.subtotal || 0),
          length: 10,
          breadth: 10,
          height: 10,
          weight: 0.5,
        };
        shiprocketResult = await createShiprocketOrder(shiprocketPayload);
        // Store shipment details
        const { Shipment } = require('../models/shipment');
        await Shipment.create({
          order: updatedOrder._id,
          shiprocketOrderId: String(shiprocketResult.order_id || ''),
          awbNumber: String(shiprocketResult.awb_code || ''),
          courierName: String(shiprocketResult.courier_name || ''),
          status: 'new',
          trackingUrl: shiprocketResult.tracking_url || '',
          estimatedDelivery: shiprocketResult.estimated_delivery_days ? new Date(Date.now() + shiprocketResult.estimated_delivery_days * 24 * 60 * 60 * 1000) : null,
          eventHistory: [{ status: 'new', at: new Date(), raw: shiprocketResult }],
        });
      } catch (e) {
        console.error('Shiprocket order creation error:', e);
        // Mark order as paid_but_shipment_failed and schedule retry
        await Order.updateOne(
          { _id: updatedOrder._id },
          {
            $set: { status: 'paid_but_shipment_failed' },
            $push: {
              statusHistory: { status: 'paid_but_shipment_failed', at: nowIso, source: 'phonepe', error: e.message },
            },
          }
        );
        // Schedule retry via nextRetryAfter (exponential backoff)
        const { Shipment } = require('../models/shipment');
        await Shipment.create({
          order: updatedOrder._id,
          shiprocketOrderId: '',
          awbNumber: '',
          courierName: '',
          status: 'failed',
          lastError: e.message,
          nextRetryAfter: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
          retryCount: 1,
          eventHistory: [{ status: 'failed', at: new Date(), raw: { error: e.message } }],
        });
      }
    }

    const io = req.app.get('io');
    if (io) {
      const paymentPayload = {
        id: String(payment._id),
        provider: 'phonepe',
        providerOrderId: String(payment.providerOrderId || details.merchantOrderId),
        status: nextStatus,
        providerStatus: details.state,
        transactionId: details.transactionId || '',
        paymentMode: details.paymentMode || '',
        amount: Number(payment.amount ?? 0),
        currency: String(payment.currency || 'INR'),
        updatedAt: nowIso,
      };

      io.to('admin').emit('payment:status_changed', paymentPayload);
      io.to('admin').emit('payments:stats', await computeAdminPaymentStats(db));

      if (updatedOrder && nextStatus === 'completed') {
        const orderPayload = {
          id: String(updatedOrder._id || payment.order || ''),
          orderNumber: String(updatedOrder.orderNumber || ''),
          status: 'paid',
          updatedAt: nowIso,
          source: 'phonepe',
        };
        io.to('admin').emit('order:status_changed', orderPayload);

        const orderUserId = updatedOrder.user ? String(updatedOrder.user) : '';
        const orderEmail = String(updatedOrder?.customer?.email || '').toLowerCase();
        if (orderUserId) {
          io.to(`user:${orderUserId}`).emit('order:status_changed', orderPayload);
          io.to(`user_${orderUserId}`).emit('order:status_changed', orderPayload);
        }
        if (orderEmail) {
          io.to(`user_email:${orderEmail}`).emit('order:status_changed', orderPayload);
        }
      }

      const userId = payment.user ? String(payment.user) : '';
      if (userId) {
        io.to(`user:${userId}`).emit('payment:status_changed', paymentPayload);
        io.to(`user_${userId}`).emit('payment:status_changed', paymentPayload);
      }
    }

    // Emit domain events for notifications
    if (nextStatus === 'completed' && updatedOrder) {
      await updatedOrder.populate('user');
      domainEvents.emit('payment:completed', { user: updatedOrder.user, order: updatedOrder, payment, io });
    }
    if (nextStatus === 'failed' && payment.order) {
      const orderForNotify = await Order.findById(payment.order).populate('user');
      if (orderForNotify) {
        domainEvents.emit('payment:failed', { user: orderForNotify.user, order: orderForNotify, io });
      }
    }

    return res.status(200).json({ ok: true, received: true, updated: true, shiprocket: shiprocketResult });
  } catch (e) {
    console.error('PhonePe webhook error:', e);
    return res.status(500).json({ ok: false, message: 'Webhook processing failed' });
  }
});

function makeProviderOrderId(provider) {
  const part = Math.random().toString(16).slice(2, 10);
  return `${provider}_${Date.now()}_${part}`;
}

// POST /api/payments/create-order
router.post('/create-order', authenticateToken, async (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    const currency = String(req.body?.currency || 'INR');
    const provider = String(req.body?.provider || 'upi');
    const orderId = String(req.body?.orderId || '');
    const orderData = req.body?.orderData;
    const returnUrl = String(req.body?.returnUrl || '').trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!['phonepe', 'paytm', 'upi', 'razorpay'].includes(provider)) {
      return res.status(400).json({ error: 'Unsupported provider' });
    }

    const nowIso = new Date().toISOString();

    let orderObjectId = null;
    let orderDoc = null;

    if (orderId) {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ error: 'Invalid orderId' });
      }
      orderObjectId = new mongoose.Types.ObjectId(orderId);
      orderDoc = await Order.findById(orderObjectId);
      if (!orderDoc) {
        return res.status(404).json({ error: 'Order not found' });
      }
    } else {
      if (!orderData || typeof orderData !== 'object') {
        return res.status(400).json({ error: 'orderData is required when orderId is not provided' });
      }

      orderDoc = await Order.create({
        user: new mongoose.Types.ObjectId(req.userId),
        orderNumber: makeOrderNumber(),
        status: 'new',
        currency: String(orderData.currency || currency || 'INR'),
        subtotal: Number(orderData.subtotal ?? 0),
        shipping: Number(orderData.shipping ?? 0),
        tax: Number(orderData.tax ?? 0),
        codCharge: Number(orderData.codCharge ?? 0),
        total: Number(orderData.total ?? amount ?? 0),
        paymentMethod: String(orderData.paymentMethod || provider || 'upi'),
        items: Array.isArray(orderData.items) ? orderData.items.map(normalizeOrderItemSnapshot) : [],
        customer: orderData.customer || {},
        address: orderData.address || {},
        createdAtIso: nowIso,
      });
      orderObjectId = orderDoc._id;

      // In-app + email notifications for order placed
      try {
        const io = req.app.get('io');
        const user = await UserModel.findById(req.userId);
        domainEvents.emit('order:placed', { user, order: orderDoc, io });
      } catch (e) {
        console.error('Order placed notification emit error:', e);
      }
    }

    const providerOrderId = makeProviderOrderId(provider);

    const payment = await Payment.create({
      user: new mongoose.Types.ObjectId(req.userId),
      order: orderObjectId || undefined,
      provider,
      providerOrderId,
      amount,
      currency,
      status: 'pending',
      paymentMethod: provider,
      providerStatus: 'INITIATED',
      metadata: { orderId: String(orderObjectId), orderData: orderData || null },
      eventHistory: [
        {
          provider,
          event: 'created',
          state: 'INITIATED',
          at: nowIso,
          merchantOrderId: providerOrderId,
          amount,
        },
      ],
    });

    const db = mongoose.connection.db;
    const io = req.app.get('io');
    if (io && db) {
      const payload = {
        id: String(payment._id),
        provider: String(provider),
        providerOrderId: String(providerOrderId),
        status: 'pending',
        amount: Number(payment.amount ?? 0),
        currency: String(payment.currency || 'INR'),
        updatedAt: nowIso,
      };
      io.to('admin').emit('payment:created', payload);
      io.to('admin').emit('payments:stats', await computeAdminPaymentStats(db));
      io.to(`user:${String(req.userId)}`).emit('payment:created', payload);
      io.to(`user_${String(req.userId)}`).emit('payment:created', payload);
    }

    if (provider === 'phonepe') {
      const merchantId = String(process.env.PHONEPE_MERCHANT_ID || '').trim();
      const phonepeBaseUrl = String(process.env.PHONEPE_BASE_URL || '').trim();
      if (!merchantId || !phonepeBaseUrl) {
        return res.status(500).json({ error: 'Missing PHONEPE_MERCHANT_ID or PHONEPE_BASE_URL' });
      }

      const apiPath = '/pg/v1/pay';
      const redirectUrl =
        returnUrl ||
        String(process.env.PHONEPE_REDIRECT_URL || '').trim() ||
        `${req.protocol}://${req.get('host')}/`;
      const callbackUrl =
        String(process.env.PHONEPE_CALLBACK_URL || '').trim() ||
        `${req.protocol}://${req.get('host')}/api/payments/webhook/phonepe`;

      const amountPaise = Math.round(amount * 100);
      const phonepePayload = {
        merchantId,
        merchantTransactionId: providerOrderId,
        merchantUserId: String(req.userId),
        amount: amountPaise,
        redirectUrl,
        redirectMode: 'REDIRECT',
        callbackUrl,
        paymentInstrument: { type: 'PAY_PAGE' },
      };

      const base64Payload = Buffer.from(JSON.stringify(phonepePayload), 'utf8').toString('base64');
      const xVerify = phonePeXVerify({ base64Payload, apiPath });
      if (!xVerify.ok) {
        return res.status(500).json({ error: 'Missing PHONEPE_SALT_KEY or PHONEPE_SALT_INDEX' });
      }

      const initResp = await httpPostPhonePeJson({
        baseUrl: phonepeBaseUrl,
        path: apiPath,
        headers: {
          'X-VERIFY': xVerify.value,
        },
        body: { request: base64Payload },
      });

      const parsedInit = safeJsonParse(initResp?.body);
      const initJson = parsedInit.ok ? parsedInit.value : null;
      const redirect =
        initJson?.data?.instrumentResponse?.redirectInfo?.url ||
        initJson?.data?.instrumentResponse?.redirectInfo?.redirectUrl ||
        '';

      await Payment.updateOne(
        { _id: payment._id },
        {
          $set: { metadata: { ...(payment.metadata || {}), phonepeInit: initJson || initResp } },
          $push: {
            eventHistory: {
              provider: 'phonepe',
              event: 'initiate',
              state: 'INITIATED',
              at: new Date().toISOString(),
              merchantOrderId: providerOrderId,
              raw: initJson || initResp,
            },
          },
        },
      );

      if (!initResp.ok || !redirect) {
        return res.status(502).json({ error: 'PhonePe initiation failed', providerResponse: initJson || initResp });
      }

      return res.json({
        paymentId: String(payment._id),
        orderId: String(orderObjectId),
        provider,
        amount,
        currency,
        providerOrderId,
        status: payment.status,
        supportedProviders: ['phonepe', 'paytm', 'upi'],
        nextAction: {
          type: 'redirect_url',
          url: String(redirect),
        },
      });
    }

    return res.json({
      paymentId: String(payment._id),
      orderId: String(orderObjectId),
      provider,
      amount,
      currency,
      providerOrderId,
      status: payment.status,
      supportedProviders: ['phonepe', 'paytm', 'upi'],
      nextAction: {
        type: provider === 'upi' ? 'upi_intent' : 'redirect_url',
        url: `https://example.invalid/pay/${providerOrderId}`,
      },
      message: 'Payment initiation is mocked (providers not integrated yet).',
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ error: 'Failed to create payment order' });
  }

});

// POST /api/payments/verify
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { paymentId, status, orderData } = req.body;

    if (!paymentId) return res.status(400).json({ error: 'paymentId is required' });
    if (!['completed', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const payment = await Payment.findOne({ _id: paymentId, user: req.userId });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    payment.status = status;

    const nowIso = new Date().toISOString();

    // Optional: create an order document if Order model exists and orderData provided
    // IMPORTANT: For completed payments, mark order as paid so it shows up in admin paid filters.
    if (status === 'completed' && orderData && !payment.order) {
      const part = Math.random().toString(16).slice(2, 8).toUpperCase();
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${part}`;

      const createdOrder = await Order.create({
        user: new mongoose.Types.ObjectId(req.userId),
        orderNumber,
        status: 'paid',
        currency: orderData.currency || 'INR',
        subtotal: Number(orderData.subtotal ?? 0),
        shipping: Number(orderData.shipping ?? 0),
        tax: Number(orderData.tax ?? 0),
        codCharge: Number(orderData.codCharge ?? 0),
        total: Number(orderData.total ?? 0),
        paymentMethod: String(orderData.paymentMethod || payment.paymentMethod || payment.provider || 'upi'),
        items: Array.isArray(orderData.items) ? orderData.items.map(normalizeOrderItemSnapshot) : [],
        customer: orderData.customer || {},
        address: orderData.address || {},
        createdAtIso: nowIso,
        statusHistory: [{ status: 'paid', at: nowIso, source: String(payment.provider || 'payment') }],
        statusTimestamps: { paid: nowIso },
      });

      payment.order = createdOrder._id;
    }

    if (status === 'completed' && payment.order) {
      await Order.updateOne(
        { _id: payment.order },
        {
          $set: { status: 'paid', paymentMethod: String(payment.paymentMethod || payment.provider || 'upi') },
          $setOnInsert: { createdAtIso: nowIso },
          $push: { statusHistory: { status: 'paid', at: nowIso, source: String(payment.provider || 'payment') } },
          $set: { 'statusTimestamps.paid': nowIso },
        },
      );
    }

    await payment.save();

    return res.json({
      paymentId: String(payment._id),
      status: payment.status,
      provider: payment.provider,
      orderId: payment.order ? String(payment.order) : undefined,
    });
  } catch (e) {
    console.error('Verify payment error:', e);
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// GET /api/payments/:paymentId/receipt (admin/user)
router.get('/:paymentId/receipt', async (req, res) => {
  try {
    const auth = await authenticateAny(req, res);
    if (!auth) return;

    const paymentId = String(req.params.paymentId || '');
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ success: false, message: 'Invalid payment id' });
    }

    const payment = await Payment.findById(paymentId).lean();
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (auth.type === 'user') {
      if (String(payment.user) !== String(auth.userId)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    if (!payment.order) {
      return res.status(400).json({ success: false, message: 'No order linked to this payment' });
    }

    const order = await Order.findById(payment.order).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let PDFDocument;
    try {
      PDFDocument = require('pdfkit');
    } catch (e) {
      console.error('Missing pdfkit dependency:', e);
      return res.status(500).json({ success: false, message: 'Receipt service not available (missing pdfkit)' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=receipt-${String(order.orderNumber || paymentId)}.pdf`,
    );

    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    doc.pipe(res);

    doc.fontSize(18).text('Payment Receipt', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(12);
    doc.text(`Receipt Date: ${new Date().toLocaleString()}`);
    doc.text(`Order Number: ${String(order.orderNumber || '')}`);
    doc.text(`Payment ID: ${String(payment._id)}`);
    doc.text(`Status: ${String(payment.status || '')}`);
    doc.text(`Payment Method: ${String(payment.paymentMethod || payment.provider || '')}`);
    doc.text(`Amount: ${String(payment.currency || 'INR')} ${Number(payment.amount || 0).toFixed(2)}`);
    doc.moveDown(1);

    doc.fontSize(13).text('Customer', { underline: true });
    doc.fontSize(12);
    doc.text(`Name: ${String(order.customer && order.customer.name ? order.customer.name : '')}`);
    doc.text(`Email: ${String(order.customer && order.customer.email ? order.customer.email : '')}`);
    if (order.customer && order.customer.phone) doc.text(`Phone: ${String(order.customer.phone)}`);
    doc.moveDown(0.5);

    doc.fontSize(13).text('Address', { underline: true });
    doc.fontSize(12);
    doc.text(String(order.address && order.address.line1 ? order.address.line1 : ''));
    if (order.address && order.address.line2) doc.text(String(order.address.line2));
    doc.text(
      `${String(order.address && order.address.city ? order.address.city : '')}, ${String(order.address && order.address.state ? order.address.state : '')} ${String(order.address && order.address.postalCode ? order.address.postalCode : '')}`,
    );
    doc.text(String(order.address && order.address.country ? order.address.country : ''));
    doc.moveDown(1);

    doc.fontSize(13).text('Items', { underline: true });
    doc.moveDown(0.25);

    const items = Array.isArray(order.items) ? order.items : [];
    for (const it of items) {
      const name = String(it && it.name ? it.name : '');
      const qty = Number(it && it.quantity ? it.quantity : 0);
      const price = Number(it && it.price ? it.price : 0);
      const size = String(it && it.selectedSize ? it.selectedSize : '');
      const color = String(it && it.selectedColor ? it.selectedColor : '');

      doc.fontSize(12).text(`${name}  |  Qty: ${qty}  |  Price: ${price.toFixed(2)}`);
      if (size || color) {
        doc.fontSize(11).fillColor('gray').text(`Size: ${size || '-'}    Color: ${color || '-'}`);
        doc.fillColor('black');
      }
      doc.moveDown(0.5);
    }

    doc.moveDown(0.5);
    doc.fontSize(12).text(`Subtotal: ${Number(order.subtotal || 0).toFixed(2)}`);
    doc.fontSize(12).text(`Shipping: ${Number(order.shipping || 0).toFixed(2)}`);
    doc.fontSize(12).text(`Tax: ${Number(order.tax || 0).toFixed(2)}`);
    doc.fontSize(12).text(`Total: ${Number(order.total || 0).toFixed(2)}`, { underline: true });

    doc.end();
  } catch (e) {
    console.error('Receipt download error:', e);
    if (res.headersSent) {
      try {
        return res.end();
      } catch (_e2) {
        return;
      }
    }
    return res.status(500).json({ success: false, message: 'Failed to generate receipt' });
  }
});

module.exports = router;
