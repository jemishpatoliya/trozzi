const express = require('express');
const mongoose = require('mongoose');

const { UserModel } = require('../models/user');
const { AdminModel } = require('../models/admin');
const { ProductModel } = require('../models/product');
const jwt = require('jsonwebtoken');
const { getOrCreateContentSettings } = require('../models/contentSettings');
const domainEvents = require('../services/domainEvents');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const AWS_REGION = process.env.AWS_REGION;
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;

function normalizeStatus(raw) {
  const base = String(raw ?? '').trim().toLowerCase();
  const key = base.replace(/\s+/g, '_');
  const map = {
    order_placed: 'new',
    placed: 'new',
    pending: 'new',
    new: 'new',
    confirmed: 'processing',
    packed: 'processing',
    processing: 'processing',
    paid: 'new',
    in_transit: 'shipped',
    dispatched: 'shipped',
    dispatch: 'shipped',
    out_for_delivery: 'shipped',
    shipped: 'shipped',
    completed: 'delivered',
    complete: 'delivered',
    delivered: 'delivered',
    canceled: 'cancelled',
    cancelled: 'cancelled',
    refunded: 'returned',
    refund: 'returned',
    returned: 'returned',
    return_requested: 'returned',
  };
  return map[key] || key || 'new';
}

async function adjustStockForOrderOnce(db, orderId, items) {
  const nowIso = new Date().toISOString();
  const ordersCollection = db.collection('orders');
  const lock = await ordersCollection.findOneAndUpdate(
    { _id: orderId, stockAdjustedAt: { $exists: false } },
    { $set: { stockAdjustedAt: nowIso } },
    { returnDocument: 'before' },
  );

  if (!lock || !lock.value) return;

  const itemsArr = Array.isArray(items) ? items : [];
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

router.post('/cod', async (req, res) => {
  try {
    const auth = await authenticateAny(req, res);
    if (!auth) return;
    if (auth.type !== 'user') {
      return res.status(403).json({ success: false, message: 'Access denied: User token required' });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not ready' });
    }

    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order items are required' });
    }

    const productIds = items
      .map((it) => String(it?.productId || '').trim())
      .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

    const products = await db
      .collection('products')
      .find({ _id: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) } })
      .project({ codAvailable: 1, codCharge: 1, management: 1 })
      .toArray();

    const productById = new Map(products.map((p) => [String(p._id), p]));

    for (const it of items) {
      const pid = String(it?.productId || '').trim();
      if (!pid || !mongoose.Types.ObjectId.isValid(pid)) {
        return res.status(400).json({ success: false, message: 'Invalid productId in items' });
      }
      const p = productById.get(pid);
      const codAvailable = typeof p?.codAvailable === 'boolean' ? p.codAvailable : Boolean(p?.management?.shipping?.codAvailable);
      if (!codAvailable) {
        return res.status(400).json({ success: false, message: 'Cash on Delivery is not available for one or more items' });
      }
    }

    const nowIso = new Date().toISOString();
    const part = Math.random().toString(16).slice(2, 8).toUpperCase();
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${part}`;

    const customer = req.body?.customer && typeof req.body.customer === 'object' ? req.body.customer : {};
    const address = req.body?.address && typeof req.body.address === 'object' ? req.body.address : {};

    const safeNum = (v) => Number(v ?? 0) || 0;
    const subtotal = safeNum(req.body?.subtotal);
    const shipping = safeNum(req.body?.shipping);
    const tax = safeNum(req.body?.tax);
    const codCharge = safeNum(req.body?.codCharge);
    const total = safeNum(req.body?.total);

    const insert = await db.collection('orders').insertOne({
      user: new mongoose.Types.ObjectId(auth.userId),
      orderNumber,
      status: 'new',
      createdAt: new Date(nowIso),
      updatedAt: new Date(nowIso),
      currency: String(req.body?.currency || 'INR'),
      subtotal,
      shipping,
      tax,
      codCharge,
      total,
      paymentMethod: 'cod',
      items: items.map((it) => ({
        productId: String(it?.productId || ''),
        name: String(it?.name || ''),
        price: safeNum(it?.price),
        quantity: Math.max(1, Number(it?.quantity ?? 1) || 1),
        selectedImage: String(it?.selectedImage || ''),
        selectedColor: String(it?.selectedColor || ''),
        selectedSize: String(it?.selectedSize || ''),
      })),
      customer: {
        name: String(customer?.name || ''),
        email: String(customer?.email || '').toLowerCase(),
        phone: String(customer?.phone || ''),
      },
      address: {
        line1: String(address?.line1 || ''),
        line2: String(address?.line2 || ''),
        city: String(address?.city || ''),
        state: String(address?.state || ''),
        postalCode: String(address?.postalCode || ''),
        country: String(address?.country || 'India'),
      },
      createdAtIso: nowIso,
      statusHistory: [{ status: 'new', at: nowIso, source: 'cod' }],
      statusTimestamps: { new: nowIso },
    });

    try {
      await adjustStockForOrderOnce(db, insert.insertedId, items);
    } catch (e) {
      console.error('Stock deduction error (COD):', e);
    }

    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('order:status_changed', {
        id: String(insert.insertedId),
        orderNumber,
        status: 'new',
        updatedAt: nowIso,
        source: 'cod',
      });

      try {
        const result = await getOrderStatusCounts(db, null);
        const payload = toStatsPayloadFromCounts(result.counts);
        payload.totalOrders = Number(result.totalOrders ?? 0) || 0;
        io.to('admin').emit('orders:counts', payload);
      } catch (_e) {
        // ignore
      }
    }

    try {
      const user = await UserModel.findById(auth.userId);
      const orderDoc = {
        _id: insert.insertedId,
        orderNumber,
        total,
        items: items.map((it) => ({
          name: String(it?.name || ''),
          quantity: Math.max(1, Number(it?.quantity ?? 1) || 1),
          price: Number(it?.price ?? 0) || 0,
        })),
        customer: {
          name: String(customer?.name || ''),
          email: String(customer?.email || '').toLowerCase(),
        },
      };
      domainEvents.emit('order:placed', { user, order: orderDoc, io });
    } catch (e) {
      console.error('COD order placed domain event error:', e);
    }

    return res.status(201).json({ success: true, id: String(insert.insertedId), orderNumber });
  } catch (error) {
    console.error('COD order create error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create COD order' });
  }
});

function emptyStatsPayload() {
  return {
    totalOrders: 0,
    newCount: 0,
    processingCount: 0,
    shippedCount: 0,
    deliveredCount: 0,
    returnedCount: 0,
    cancelledCount: 0,
  };
}

function toStatsPayloadFromCounts(countsByStatus) {
  const next = emptyStatsPayload();

  const safe = (k) => Number(countsByStatus?.[k] ?? 0) || 0;
  next.newCount = safe('new');
  next.processingCount = safe('processing');
  next.shippedCount = safe('shipped');
  next.deliveredCount = safe('delivered');
  next.returnedCount = safe('returned');
  next.cancelledCount = safe('cancelled');

  return next;
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
      if (!admin || !admin.active) {
        res.status(401).json({ success: false, message: 'Invalid or expired admin token' });
        return null;
      }
      return { type: 'admin', admin };
    }

    const user = await UserModel.findById(id);
    if (!user || !user.active) {
      res.status(401).json({ success: false, message: 'Invalid or expired user token' });
      return null;
    }
    return { type: 'user', user, userId: String(user._id), email: String(user.email || '').toLowerCase() };
  } catch (_e) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return null;
  }
}

function toOrderRow(doc) {
  const itemsArr = Array.isArray(doc.items) ? doc.items : [];
  const itemsCount = itemsArr.reduce((sum, i) => sum + Number(i?.quantity ?? 0), 0);
  const shipment = doc.shipment || {};
  return {
    id: String(doc._id),
    orderNumber: doc.orderNumber || '',
    customer: doc?.customer?.name || '',
    email: doc?.customer?.email || '',
    total: Number(doc.total ?? 0),
    shipping: Number(doc.shipping ?? 0) || 0,
    items: itemsCount,
    date: doc.createdAtIso || (doc.createdAt ? new Date(doc.createdAt).toISOString() : ''),
    paymentMethod: String(doc.paymentMethod || doc.payment?.paymentMethod || doc.payment?.provider || 'unknown'),
    codCharge: Number(doc.codCharge ?? 0) || 0,
    status: normalizeStatus(doc.status),
    trackingNumber: String(shipment.awbNumber || ''),
    courierName: String(shipment.courierName || ''),
    trackingUrl: String(shipment.trackingUrl || ''),
    shipment: {
      id: shipment._id ? String(shipment._id) : null,
      shiprocketOrderId: shipment.shiprocketOrderId || '',
      awbNumber: shipment.awbNumber || '',
      courierName: shipment.courierName || '',
      status: shipment.status || '',
      trackingUrl: shipment.trackingUrl || '',
      estimatedDelivery: shipment.estimatedDelivery || null,
    },
  };
}

function normalizeOrderItemSnapshot(req, rawItem) {
  const item = rawItem && typeof rawItem === 'object' ? rawItem : {};

  const selectedSize = String(item.selectedSize ?? item.size ?? '').trim();
  const selectedColor = String(item.selectedColor ?? item.color ?? '').trim();

  const selectedImageRaw = String(item.selectedImage ?? '').trim();
  const legacyImageRaw = String(item.image ?? '').trim();
  const selectedImage = toAbsoluteUrl(req, selectedImageRaw || legacyImageRaw);

  return {
    productId: String(item.productId ?? ''),
    name: String(item.name ?? ''),
    price: Number(item.price ?? 0) || 0,
    quantity: Number(item.quantity ?? 0) || 0,
    selectedSize,
    selectedColor,
    selectedImage,
  };
}

function emptyStatusCounts() {
  return {
    new: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    returned: 0,
    cancelled: 0,
  };
}

function toAbsoluteUrl(req, url) {
  const value = String(url ?? '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) {
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    return `${proto}://${req.get('host')}${value}`;
  }
  if (/^uploads\//i.test(value) && AWS_REGION && AWS_S3_BUCKET) {
    return `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${value}`;
  }
  return value;
}

async function getProductsByIds(db, ids) {
  const objectIds = ids
    .filter((id) => mongoose.Types.ObjectId.isValid(String(id)))
    .map((id) => new mongoose.Types.ObjectId(String(id)));

  if (!objectIds.length) return new Map();

  const products = await db
    .collection('products')
    .find({ _id: { $in: objectIds } })
    .project({ name: 1, price: 1, image: 1, galleryImages: 1, slug: 1 })
    .toArray();

  const map = new Map();
  for (const p of products) {
    map.set(String(p._id), p);
  }
  return map;
}

async function getOrderStatusCounts(db, matchStage) {
  const pipeline = [];
  if (matchStage) pipeline.push({ $match: matchStage });
  pipeline.push({ $group: { _id: { $ifNull: ['$status', 'new'] }, count: { $sum: 1 } } });

  const rows = await db.collection('orders').aggregate(pipeline).toArray();
  const counts = emptyStatusCounts();
  let totalOrders = 0;

  for (const row of rows) {
    const key = normalizeStatus(row?._id);
    const value = Number(row?.count ?? 0);
    if (!key) continue;
    totalOrders += value;
    if (Object.prototype.hasOwnProperty.call(counts, key)) {
      counts[key] = (Number(counts[key] ?? 0) || 0) + value;
    }
  }

  return { counts, totalOrders };
}

// GET /api/orders (used by admin UI)
router.get('/', async (req, res) => {
  try {
    const auth = await authenticateAny(req, res);
    if (!auth) return;
    if (auth.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Admin token required' });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not ready' });
    }

    const status = String(req.query?.status ?? '').trim();
    const search = String(req.query?.search ?? '').trim();
    const page = Math.max(1, Number(req.query?.page ?? 1) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query?.limit ?? 50) || 50));

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
      ];
    }

    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'shipments',
          localField: '_id',
          foreignField: 'order',
          as: 'shipment',
        },
      },
      { $unwind: { path: '$shipment', preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const docs = await db.collection('orders').aggregate(pipeline).toArray();

    res.json({
      success: true,
      data: docs.map(toOrderRow),
    });
  } catch (error) {
    console.error('Error loading orders:', error);
    res.status(500).json({ success: false, message: 'Failed to load orders' });
  }
});

// POST /api/orders/:id/cancel (user only)
router.post('/:id/cancel', async (req, res) => {
  try {
    const auth = await authenticateAny(req, res);
    if (!auth) return;
    if (auth.type !== 'user') {
      return res.status(403).json({ success: false, message: 'Access denied: User token required' });
    }

    const settings = await getOrCreateContentSettings();
    if (!settings.showOrderHistory) {
      return res.status(403).json({ success: false, message: 'Order history is disabled' });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not ready' });
    }

    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const _id = new mongoose.Types.ObjectId(id);
    const uid = new mongoose.Types.ObjectId(auth.userId);

    const order = await db.collection('orders').findOne({
      _id,
      $or: [{ user: uid }, { 'customer.email': auth.email }],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const currentStatus = normalizeStatus(order.status);
    if (['cancelled', 'returned', 'delivered', 'shipped'].includes(currentStatus)) {
      return res.status(400).json({ success: false, message: `Order cannot be cancelled from status ${currentStatus}` });
    }

    const nowIso = new Date().toISOString();
    await db.collection('orders').updateOne(
      { _id },
      {
        $set: { status: 'cancelled', [`statusTimestamps.cancelled`]: nowIso },
        $push: { statusHistory: { status: 'cancelled', at: nowIso, source: 'user' } },
      },
    );

    const itemsArr = Array.isArray(order.items) ? order.items : [];
    const restockOps = itemsArr
      .map((it) => ({
        productId: String(it?.productId ?? ''),
        name: String(it?.name ?? ''),
        quantity: Math.max(0, Number(it?.quantity ?? 0) || 0),
      }))
      .filter((x) => x.productId && x.quantity > 0);

    for (const it of restockOps) {
      if (!mongoose.Types.ObjectId.isValid(it.productId)) continue;
      // eslint-disable-next-line no-await-in-loop
      await ProductModel.updateOne(
        { _id: new mongoose.Types.ObjectId(it.productId) },
        { $inc: { stock: it.quantity } },
      );
    }

    const io = req.app.get('io');
    if (io) {
      const orderPayload = {
        id: String(order._id),
        orderNumber: String(order.orderNumber || ''),
        status: 'cancelled',
        updatedAt: nowIso,
        source: 'user',
      };

      let notificationDoc = null;
      try {
        const title = 'Order Cancelled (By User)';
        const itemsSummary = restockOps
          .slice(0, 3)
          .map((it) => `${String(it.name || it.productId)} x${Number(it.quantity || 0)}`)
          .join(', ');
        const moreCount = Math.max(0, restockOps.length - 3);
        const message =
          `Order ${String(order.orderNumber || String(order._id))} cancelled by ${String(order?.customer?.name || '')}` +
          (itemsSummary ? ` (${itemsSummary}${moreCount ? ` +${moreCount} more` : ''})` : '');

        const insert = await db.collection('admin_notifications').insertOne({
          type: 'warning',
          title,
          message,
          read: false,
          createdAtIso: nowIso,
          data: {
            kind: 'order_cancelled',
            orderId: String(order._id),
            orderNumber: String(order.orderNumber || ''),
            userId: String(order.user || auth.userId || ''),
            userEmail: String(order?.customer?.email || auth.email || ''),
            customerName: String(order?.customer?.name || ''),
            items: restockOps,
          },
        });
        notificationDoc = {
          id: String(insert.insertedId),
          type: 'warning',
          title,
          message,
          read: false,
          createdAtIso: nowIso,
          data: {
            kind: 'order_cancelled',
            orderId: String(order._id),
            orderNumber: String(order.orderNumber || ''),
            userId: String(order.user || auth.userId || ''),
            userEmail: String(order?.customer?.email || auth.email || ''),
            customerName: String(order?.customer?.name || ''),
            items: restockOps,
          },
        };
      } catch (e) {
        console.error('Failed to persist admin notification:', e);
      }

      io.to('admin').emit('order:status_changed', orderPayload);
      io.to('admin').emit('order:cancelled', {
        ...orderPayload,
        userId: String(order.user || auth.userId || ''),
        userEmail: String(order?.customer?.email || auth.email || ''),
        customerName: String(order?.customer?.name || ''),
        items: restockOps,
      });

      if (notificationDoc) {
        io.to('admin').emit('admin:notification', notificationDoc);
      }

      io.to(`user:${auth.userId}`).emit('order:status_changed', orderPayload);
      io.to(`user_${auth.userId}`).emit('order:status_changed', orderPayload);
      if (auth.email) io.to(`user_email:${auth.email}`).emit('order:status_changed', orderPayload);

      try {
        const result = await getOrderStatusCounts(db, null);
        const payload = toStatsPayloadFromCounts(result.counts);
        payload.totalOrders = Number(result.totalOrders ?? 0) || 0;
        io.to('admin').emit('orders:counts', payload);
      } catch (_e) {
        // ignore
      }
    }

    try {
      const user = await UserModel.findById(auth.userId);
      const updatedOrder = {
        _id: order._id,
        orderNumber: String(order.orderNumber || ''),
        customer: order.customer || { name: '', email: '' },
      };
      domainEvents.emit('order:cancelled', { user, order: updatedOrder, by: 'user', io: req.app.get('io') });
    } catch (e) {
      console.error('User cancel order domain event error:', e);
    }

    return res.json({ success: true, message: 'Order cancelled', data: { id: String(order._id), status: 'cancelled' } });
  } catch (error) {
    console.error('User cancel order error:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
});

// POST /api/orders/receipt (admin or owning user) - combined PDF, one order per page
router.post('/receipt', async (req, res) => {
  try {
    const auth = await authenticateAny(req, res);
    if (!auth) return;

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not ready' });
    }

    let PDFDocument;
    try {
      PDFDocument = require('pdfkit');
    } catch (e) {
      console.error('Missing pdfkit dependency:', e);
      return res.status(500).json({ success: false, message: 'Receipt service not available (missing pdfkit)' });
    }

    const idsRaw = Array.isArray(req.body?.ids)
      ? req.body.ids
      : Array.isArray(req.body?.orderIds)
        ? req.body.orderIds
        : Array.isArray(req.body?.selectedIds)
          ? req.body.selectedIds
          : [];

    const ids = Array.isArray(idsRaw)
      ? idsRaw
          .map((v) => {
            if (!v) return '';
            if (typeof v === 'string' || typeof v === 'number') return String(v);
            if (typeof v === 'object') return String(v.id || v._id || '');
            return '';
          })
          .map((s) => String(s || '').trim())
          .filter((s) => mongoose.Types.ObjectId.isValid(s))
      : [];

    if (!ids.length) {
      return res.status(400).json({ success: false, message: 'Provide ids' });
    }

    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
    const baseMatch = { _id: { $in: objectIds } };

    let docs = [];
    if (auth.type === 'admin') {
      docs = await db.collection('orders').find(baseMatch).sort({ createdAt: -1, _id: -1 }).toArray();
    } else {
      const uid = new mongoose.Types.ObjectId(auth.userId);
      docs = await db
        .collection('orders')
        .find({
          ...baseMatch,
          $or: [{ user: uid }, { 'customer.email': auth.email }],
        })
        .sort({ createdAt: -1, _id: -1 })
        .toArray();
    }

    if (!docs.length) {
      return res.status(404).json({ success: false, message: 'Orders not found' });
    }

    // Preload products for all items
    const allItems = docs.flatMap((d) => (Array.isArray(d.items) ? d.items : []));
    const allProductIds = allItems.map((i) => i && i.productId).filter(Boolean);
    const productMap = await getProductsByIds(db, allProductIds);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=orders-receipts.pdf');

    const pdf = new PDFDocument({ size: 'A4', margin: 48 });
    pdf.pipe(res);

    docs.forEach((order, idx) => {
      if (idx > 0) pdf.addPage();

      const itemsArr = Array.isArray(order.items) ? order.items : [];
      const enrichedItems = itemsArr.map((item) => {
        const pid = String(item?.productId ?? '');
        const product = productMap.get(pid);
        const selectedSize = String(item?.selectedSize ?? item?.size ?? '').trim();
        const selectedColor = String(item?.selectedColor ?? item?.color ?? '').trim();
        const selectedImageCandidate = String(item?.selectedImage ?? '').trim() || String(item?.image ?? '').trim();
        const fallbackProductImage = product ? String(product?.image || '') : '';
        const selectedImage =
          toAbsoluteUrl(req, selectedImageCandidate) ||
          toAbsoluteUrl(req, fallbackProductImage);

        return {
          name: String(item?.name || product?.name || ''),
          quantity: Number(item?.quantity ?? 0) || 0,
          price: Number(item?.price ?? 0) || 0,
          selectedSize,
          selectedColor,
          selectedImage,
        };
      });

      pdf.fontSize(18).text('Order Receipt', { align: 'center' });
      pdf.moveDown(1);

      pdf.fontSize(12);
      pdf.text(`Receipt Date: ${new Date().toLocaleString()}`);
      pdf.text(`Order Number: ${String(order.orderNumber || '')}`);
      pdf.text(`Order Status: ${String(normalizeStatus(order.status) || '')}`);
      pdf.text(`Total: ${String(order.currency || 'INR')} ${Number(order.total || 0).toFixed(2)}`);
      pdf.moveDown(1);

      pdf.fontSize(13).text('Customer', { underline: true });
      pdf.fontSize(12);
      pdf.text(`Name: ${String(order.customer?.name || '')}`);
      pdf.text(`Email: ${String(order.customer?.email || '')}`);
      if (order.customer?.phone) pdf.text(`Phone: ${String(order.customer.phone)}`);
      pdf.moveDown(0.5);

      pdf.fontSize(13).text('Address', { underline: true });
      pdf.fontSize(12);
      pdf.text(String(order.address?.line1 || ''));
      if (order.address?.line2) pdf.text(String(order.address.line2));
      pdf.text(`${String(order.address?.city || '')}, ${String(order.address?.state || '')} ${String(order.address?.postalCode || '')}`);
      pdf.text(String(order.address?.country || ''));
      pdf.moveDown(1);

      pdf.fontSize(13).text('Items', { underline: true });
      pdf.moveDown(0.25);

      for (const it of enrichedItems) {
        pdf
          .fontSize(12)
          .text(`${String(it.name || '')}  |  Qty: ${Number(it.quantity || 0)}  |  Price: ${Number(it.price || 0).toFixed(2)}`);
        if (it.selectedSize || it.selectedColor) {
          pdf
            .fontSize(11)
            .fillColor('gray')
            .text(`Size: ${it.selectedSize || '-'}    Color: ${it.selectedColor || '-'}`);
          pdf.fillColor('black');
        }
        if (it.selectedImage) {
          pdf.fontSize(10).fillColor('gray').text(`Image: ${String(it.selectedImage)}`);
          pdf.fillColor('black');
        }
        pdf.moveDown(0.5);
      }

      pdf.moveDown(0.5);
      pdf.fontSize(12).text(`Subtotal: ${Number(order.subtotal || 0).toFixed(2)}`);
      pdf.fontSize(12).text(`Shipping: ${Number(order.shipping || 0).toFixed(2)}`);
      pdf.fontSize(12).text(`Tax: ${Number(order.tax || 0).toFixed(2)}`);
      pdf.fontSize(12).text(`Total: ${Number(order.total || 0).toFixed(2)}`, { underline: true });
    });

    pdf.end();
  } catch (error) {
    console.error('Combined order receipt error:', error);
    if (res.headersSent) {
      try {
        return res.end();
      } catch (_e2) {
        return;
      }
    }
    return res.status(500).json({ success: false, message: 'Failed to generate receipts' });
  }
});

// POST /api/orders/bulk/status (admin) - bulk accept/update
router.post('/bulk/status', async (req, res) => {
  try {
    const auth = await authenticateAny(req, res);
    if (!auth) return;
    if (auth.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Admin token required' });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not ready' });
    }

    const idsRaw = Array.isArray(req.body?.ids)
      ? req.body.ids
      : Array.isArray(req.body?.orderIds)
        ? req.body.orderIds
        : Array.isArray(req.body?.selectedIds)
          ? req.body.selectedIds
          : [];
    const status = normalizeStatus(req.body?.status);
    const currentStatus = normalizeStatus(req.body?.currentStatus);
    const dateFrom = String(req.body?.dateFrom || '').trim();
    const dateTo = String(req.body?.dateTo || '').trim();

    if (!status) {
      return res.status(400).json({ success: false, message: 'Missing status' });
    }

    const filter = {};

    const ids = Array.isArray(idsRaw)
      ? idsRaw
          .map((v) => {
            if (!v) return '';
            if (typeof v === 'string' || typeof v === 'number') return String(v);
            if (typeof v === 'object') return String(v.id || v._id || '');
            return '';
          })
          .map((s) => String(s || '').trim())
          .filter(Boolean)
      : [];

    if (ids.length) {
      const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
      if (!validIds.length) {
        return res.status(400).json({ success: false, message: 'No valid order ids provided' });
      }
      filter._id = { $in: validIds.map((id) => new mongoose.Types.ObjectId(id)) };
    }

    if (!ids.length) {
      // Allow bulk by date range when ids are not provided.
      // createdAtIso is stored as ISO string in this codebase; lexicographic compare works for ISO.
      if (dateFrom || dateTo) {
        filter.createdAtIso = {};
        if (dateFrom) filter.createdAtIso.$gte = dateFrom;
        if (dateTo) filter.createdAtIso.$lte = dateTo;
      }
      if (!dateFrom && !dateTo) {
        return res.status(400).json({
          success: false,
          message: 'Provide ids or dateFrom/dateTo',
        });
      }
    }

    if (currentStatus) {
      filter.status = currentStatus;
    }

    const result = await db.collection('orders').updateMany(filter, { $set: { status } });

    // Return ids affected (best-effort)
    const affected = await db
      .collection('orders')
      .find(filter)
      .project({ _id: 1 })
      .limit(5000)
      .toArray();

    return res.json({
      success: true,
      data: {
        matched: Number(result.matchedCount ?? 0) || 0,
        modified: Number(result.modifiedCount ?? 0) || 0,
        ids: affected.map((d) => String(d._id)),
      },
    });
  } catch (error) {
    console.error('Error bulk updating order status:', error);
    return res.status(500).json({ success: false, message: 'Failed to bulk update order status' });
  }
});

// PUT /api/orders/:id/status (used by admin UI)
router.put('/:id/status', async (req, res) => {
  try {
    const auth = await authenticateAny(req, res);
    if (!auth) return;
    if (auth.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Admin token required' });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not ready' });
    }

    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const status = normalizeStatus(req.body?.status);
    if (!status) {
      return res.status(400).json({ success: false, message: 'Missing status' });
    }

    const _id = new mongoose.Types.ObjectId(id);
    const result = await db
      .collection('orders')
      .findOneAndUpdate(
        { _id },
        { $set: { status } },
        { returnDocument: 'after' },
      );

    if (!result?.value) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      data: { id: String(result.value._id), status: result.value.status },
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
});

// GET /api/orders/stats - counts by status
// - Admin token: global counts
// - User token: counts scoped to that user's orders
router.get('/stats', async (req, res) => {
  try {
    const auth = await authenticateAny(req, res);
    if (!auth) return;

    if (auth.type === 'user') {
      const settings = await getOrCreateContentSettings();
      if (!settings.showOrderHistory) {
        return res.status(403).json({ success: false, message: 'Order history is disabled' });
      }
    }

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not ready' });
    }

    let matchStage = null;
    if (auth.type === 'user') {
      const uid = new mongoose.Types.ObjectId(auth.userId);
      const email = auth.email;
      matchStage = { $or: [{ user: uid }, { 'customer.email': email }] };
    }

    const result = await getOrderStatusCounts(db, matchStage);
    const payload = toStatsPayloadFromCounts(result.counts);
    payload.totalOrders = Number(result.totalOrders ?? 0) || 0;

    res.json({ success: true, data: payload });
  } catch (error) {
    console.error('Error loading order stats:', error);
    res.status(500).json({ success: false, message: 'Failed to load order stats' });
  }
});

// GET /api/orders/my/stats (user only) - backward compatible alias
router.get('/my/stats', async (req, res) => {
  try {
    const auth = await authenticateAny(req, res);
    if (!auth) return;
    if (auth.type !== 'user') {
      return res.status(403).json({ success: false, message: 'Access denied: User token required' });
    }

    const settings = await getOrCreateContentSettings();
    if (!settings.showOrderHistory) {
      return res.status(403).json({ success: false, message: 'Order history is disabled' });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not ready' });
    }

    const uid = new mongoose.Types.ObjectId(auth.userId);
    const email = auth.email;

    const result = await getOrderStatusCounts(db, { $or: [{ user: uid }, { 'customer.email': email }] });
    const payload = toStatsPayloadFromCounts(result.counts);
    payload.totalOrders = Number(result.totalOrders ?? 0) || 0;

    res.json({ success: true, data: payload });
  } catch (error) {
    console.error('Error loading my order stats:', error);
    res.status(500).json({ success: false, message: 'Failed to load order stats' });
  }
});

// GET /api/orders/my (user only) - list current user's orders
router.get('/my', async (req, res) => {
  try {
    const auth = await authenticateAny(req, res);
    if (!auth) return;
    if (auth.type !== 'user') {
      return res.status(403).json({ success: false, message: 'Access denied: User token required' });
    }

    const settings = await getOrCreateContentSettings();
    if (!settings.showOrderHistory) {
      return res.status(403).json({ success: false, message: 'Order history is disabled' });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not ready' });
    }

    const uid = new mongoose.Types.ObjectId(auth.userId);
    const email = auth.email;

    const pipeline = [
      { $match: { $or: [{ user: uid }, { 'customer.email': email }] } },
      {
        $lookup: {
          from: 'shipments',
          localField: '_id',
          foreignField: 'order',
          as: 'shipment',
        },
      },
      { $unwind: { path: '$shipment', preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: 200 },
    ];

    const docs = await db.collection('orders').aggregate(pipeline).toArray();

    res.json({
      success: true,
      data: docs.map((doc) => ({
        ...toOrderRow(doc),
        total: Number(doc.total ?? 0) || 0,
        createdAtIso: doc.createdAtIso || (doc.createdAt ? new Date(doc.createdAt).toISOString() : ''),
        itemsDetail: Array.isArray(doc.items) ? doc.items.map((it) => normalizeOrderItemSnapshot(req, it)) : [],
        orderStatus: normalizeStatus(doc.status),
      })),
    });
  } catch (error) {
    console.error('Error loading my orders:', error);
    res.status(500).json({ success: false, message: 'Failed to load orders' });
  }
});

// GET /api/orders/:id (used by admin UI)
router.get('/:id', async (req, res) => {
  try {
    const auth = await authenticateAny(req, res);
    if (!auth) return;

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not ready' });
    }

    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const _id = new mongoose.Types.ObjectId(id);
    let doc;

    if (auth.type === 'admin') {
      doc = await db.collection('orders').findOne({ _id });
    } else {
      const uid = new mongoose.Types.ObjectId(auth.userId);
      doc = await db.collection('orders').findOne({
        _id,
        $or: [{ user: uid }, { 'customer.email': auth.email }],
      });
    }

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const itemsArr = Array.isArray(doc.items) ? doc.items : [];
    const productIds = itemsArr.map((i) => i && i.productId).filter(Boolean);
    const productMap = await getProductsByIds(db, productIds);

    const enrichedItems = itemsArr.map((item) => {
      const pid = String(item?.productId ?? '');
      const product = productMap.get(pid);

      const selectedSize = String(item?.selectedSize ?? item?.size ?? '').trim();
      const selectedColor = String(item?.selectedColor ?? item?.color ?? '').trim();
      const selectedImageCandidate = String(item?.selectedImage ?? '').trim() || String(item?.image ?? '').trim();
      const selectedImage = toAbsoluteUrl(req, selectedImageCandidate);

      return {
        productId: pid,
        name: String(item?.name || product?.name || ''),
        price: Number(item?.price ?? 0) || 0,
        quantity: Number(item?.quantity ?? 0) || 0,
        selectedSize,
        selectedColor,
        selectedImage,
        product: product
          ? {
              id: String(product._id),
              slug: String(product.slug || ''),
              name: String(product.name || ''),
            }
          : null,
      };
    });

    // Fetch shipment details
    const shipment = await db.collection('shipments').findOne({ order: _id });

    res.json({
      success: true,
      data: {
        ...doc,
        id: String(doc._id),
        status: normalizeStatus(doc.status),
        items: enrichedItems,
        trackingNumber: String(shipment?.awbNumber || ''),
        courierName: String(shipment?.courierName || ''),
        trackingUrl: String(shipment?.trackingUrl || ''),
        shipment: shipment ? {
          id: String(shipment._id),
          shiprocketOrderId: shipment.shiprocketOrderId,
          awbNumber: shipment.awbNumber,
          courierName: shipment.courierName,
          status: shipment.status,
          trackingUrl: shipment.trackingUrl,
          estimatedDelivery: shipment.estimatedDelivery,
          eventHistory: shipment.eventHistory || [],
        } : null,
        statusHistory: Array.isArray(doc?.statusHistory) ? doc.statusHistory : [],
        statusTimestamps: doc?.statusTimestamps && typeof doc.statusTimestamps === 'object' ? doc.statusTimestamps : {},
      },
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
});

// GET /api/orders/:id/receipt (admin only)
router.get('/:id/receipt', async (req, res) => {
  try {
    const auth = await authenticateAny(req, res);
    if (!auth) return;

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not ready' });
    }

    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    let PDFDocument;
    try {
      PDFDocument = require('pdfkit');
    } catch (e) {
      console.error('Missing pdfkit dependency:', e);
      return res.status(500).json({ success: false, message: 'Receipt service not available (missing pdfkit)' });
    }

    const _id = new mongoose.Types.ObjectId(id);
    let order;
    if (auth.type === 'admin') {
      order = await db.collection('orders').findOne({ _id });
    } else {
      const uid = new mongoose.Types.ObjectId(auth.userId);
      order = await db.collection('orders').findOne({
        _id,
        $or: [{ user: uid }, { 'customer.email': auth.email }],
      });
    }
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const itemsArr = Array.isArray(order.items) ? order.items : [];
    const productIds = itemsArr.map((i) => i && i.productId).filter(Boolean);
    const productMap = await getProductsByIds(db, productIds);

    const enrichedItems = itemsArr.map((item) => {
      const pid = String(item?.productId ?? '');
      const product = productMap.get(pid);

      const selectedSize = String(item?.selectedSize ?? item?.size ?? '').trim();
      const selectedColor = String(item?.selectedColor ?? item?.color ?? '').trim();
      const selectedImageCandidate = String(item?.selectedImage ?? '').trim() || String(item?.image ?? '').trim();
      const fallbackProductImage = product ? String(product?.image || '') : '';
      const selectedImage =
        toAbsoluteUrl(req, selectedImageCandidate) ||
        toAbsoluteUrl(req, fallbackProductImage);

      return {
        name: String(item?.name || product?.name || ''),
        quantity: Number(item?.quantity ?? 0) || 0,
        price: Number(item?.price ?? 0) || 0,
        selectedSize,
        selectedColor,
        selectedImage,
      };
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=order-receipt-${String(order.orderNumber || id)}.pdf`,
    );

    const pdf = new PDFDocument({ size: 'A4', margin: 48 });
    pdf.pipe(res);

    pdf.fontSize(18).text('Order Receipt', { align: 'center' });
    pdf.moveDown(1);

    pdf.fontSize(12);
    pdf.text(`Receipt Date: ${new Date().toLocaleString()}`);
    pdf.text(`Order Number: ${String(order.orderNumber || '')}`);
    pdf.text(`Order Status: ${String(normalizeStatus(order.status) || '')}`);
    pdf.text(`Total: ${String(order.currency || 'INR')} ${Number(order.total || 0).toFixed(2)}`);
    pdf.moveDown(1);

    pdf.fontSize(13).text('Customer', { underline: true });
    pdf.fontSize(12);
    pdf.text(`Name: ${String(order.customer?.name || '')}`);
    pdf.text(`Email: ${String(order.customer?.email || '')}`);
    if (order.customer?.phone) pdf.text(`Phone: ${String(order.customer.phone)}`);
    pdf.moveDown(0.5);

    pdf.fontSize(13).text('Address', { underline: true });
    pdf.fontSize(12);
    pdf.text(String(order.address?.line1 || ''));
    if (order.address?.line2) pdf.text(String(order.address.line2));
    pdf.text(`${String(order.address?.city || '')}, ${String(order.address?.state || '')} ${String(order.address?.postalCode || '')}`);
    pdf.text(String(order.address?.country || ''));
    pdf.moveDown(1);

    pdf.fontSize(13).text('Items', { underline: true });
    pdf.moveDown(0.25);

    for (const it of enrichedItems) {
      pdf
        .fontSize(12)
        .text(`${String(it.name || '')}  |  Qty: ${Number(it.quantity || 0)}  |  Price: ${Number(it.price || 0).toFixed(2)}`);
      if (it.selectedSize || it.selectedColor) {
        pdf
          .fontSize(11)
          .fillColor('gray')
          .text(`Size: ${it.selectedSize || '-'}    Color: ${it.selectedColor || '-'}`);
        pdf.fillColor('black');
      }
      if (it.selectedImage) {
        pdf.fontSize(10).fillColor('gray').text(`Image: ${String(it.selectedImage)}`);
        pdf.fillColor('black');
      }
      pdf.moveDown(0.5);
    }

    pdf.moveDown(0.5);
    pdf.fontSize(12).text(`Subtotal: ${Number(order.subtotal || 0).toFixed(2)}`);
    pdf.fontSize(12).text(`Shipping: ${Number(order.shipping || 0).toFixed(2)}`);
    pdf.fontSize(12).text(`Tax: ${Number(order.tax || 0).toFixed(2)}`);
    pdf.fontSize(12).text(`Total: ${Number(order.total || 0).toFixed(2)}`, { underline: true });

    pdf.end();
  } catch (error) {
    console.error('Order receipt error:', error);
    if (res.headersSent) {
      try {
        return res.end();
      } catch (_e2) {
        return;
      }
    }
    return res.status(500).json({ success: false, message: 'Failed to generate order receipt' });
  }
});

// GET /api/orders/:id/tracking (admin or owning user)
router.get('/:id/tracking', async (req, res) => {
  try {
    const auth = await authenticateAny(req, res);
    if (!auth) return;

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not ready' });
    }

    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const _id = new mongoose.Types.ObjectId(id);

    let doc;
    if (auth.type === 'admin') {
      doc = await db.collection('orders').findOne({ _id });
    } else {
      const uid = new mongoose.Types.ObjectId(auth.userId);
      doc = await db.collection('orders').findOne({
        _id,
        $or: [{ user: uid }, { 'customer.email': auth.email }],
      });
    }

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.json({
      success: true,
      data: {
        orderId: String(doc._id),
        orderNumber: String(doc.orderNumber || ''),
        status: normalizeStatus(doc.status),
        trackingNumber: String(doc?.tracking?.trackingNumber || ''),
        courierName: String(doc?.tracking?.courierName || ''),
        trackingUrl: String(doc?.tracking?.trackingUrl || ''),
        statusHistory: Array.isArray(doc?.statusHistory) ? doc.statusHistory : [],
        statusTimestamps: doc?.statusTimestamps && typeof doc.statusTimestamps === 'object' ? doc.statusTimestamps : {},
      },
    });
  } catch (error) {
    console.error('Error fetching order tracking:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch tracking' });
  }
});

// PUT /api/orders/:id/tracking (admin only)
router.put('/:id/tracking', async (req, res) => {
  try {
    const auth = await authenticateAny(req, res);
    if (!auth) return;
    if (auth.type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Admin token required' });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not ready' });
    }

    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const trackingNumber = String(req.body?.trackingNumber || '').trim();
    const courierName = String(req.body?.courierName || '').trim();
    const trackingUrl = String(req.body?.trackingUrl || '').trim();

    const _id = new mongoose.Types.ObjectId(id);
    const result = await db.collection('orders').findOneAndUpdate(
      { _id },
      {
        $set: {
          'tracking.trackingNumber': trackingNumber,
          'tracking.courierName': courierName,
          'tracking.trackingUrl': trackingUrl,
        },
      },
      { returnDocument: 'after' },
    );

    if (!result?.value) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('order:tracking_updated', {
        id: String(result.value._id),
        orderNumber: String(result.value.orderNumber || ''),
        trackingNumber: String(result.value?.tracking?.trackingNumber || ''),
        courierName: String(result.value?.tracking?.courierName || ''),
        trackingUrl: String(result.value?.tracking?.trackingUrl || ''),
      });

      const userId = result.value?.user ? String(result.value.user) : '';
      const email = String(result.value?.customer?.email || '').toLowerCase();
      if (userId) io.to(`user:${userId}`).emit('order:tracking_updated', {
        id: String(result.value._id),
        orderNumber: String(result.value.orderNumber || ''),
        trackingNumber: String(result.value?.tracking?.trackingNumber || ''),
        courierName: String(result.value?.tracking?.courierName || ''),
        trackingUrl: String(result.value?.tracking?.trackingUrl || ''),
      });
      if (email) io.to(`user_email:${email}`).emit('order:tracking_updated', {
        id: String(result.value._id),
        orderNumber: String(result.value.orderNumber || ''),
        trackingNumber: String(result.value?.tracking?.trackingNumber || ''),
        courierName: String(result.value?.tracking?.courierName || ''),
        trackingUrl: String(result.value?.tracking?.trackingUrl || ''),
      });
    }

    return res.json({
      success: true,
      data: {
        orderId: String(result.value._id),
        trackingNumber: String(result.value?.tracking?.trackingNumber || ''),
        courierName: String(result.value?.tracking?.courierName || ''),
        trackingUrl: String(result.value?.tracking?.trackingUrl || ''),
      },
    });
  } catch (error) {
    console.error('Error updating tracking:', error);
    return res.status(500).json({ success: false, message: 'Failed to update tracking' });
  }
});

module.exports = router;
