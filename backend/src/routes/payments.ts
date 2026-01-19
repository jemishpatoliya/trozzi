import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';

import { PaymentModel } from '../models/payment';
import { OrderModel } from '../models/order';
import { AdminModel } from '../models/admin';

const jwt: any = require('jsonwebtoken');

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

interface AnyAuthenticatedRequest extends Request {
  userId?: string;
  adminId?: string;
  authType?: 'user' | 'admin';
}

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string; id?: string };
    req.userId = decoded.userId ?? decoded.id;
    if (!req.userId) return res.status(401).json({ error: 'Invalid or expired token' });
    next();
  } catch (_error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const authenticateAnyAdmin = async (req: AnyAuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id?: string; userId?: string; type?: string };
    const type = decoded?.type;
    const id = decoded?.id ?? decoded?.userId;

    if (type !== 'admin' || !id) {
      return res.status(401).json({ success: false, message: 'Invalid or expired admin token' });
    }

    const admin: any = await (AdminModel as any).findById(id).lean();
    if (!admin || admin.active !== true || admin.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Invalid or expired admin token' });
    }

    req.adminId = String(admin._id);
    req.authType = 'admin';
    return next();
  } catch (_e) {
    return res.status(401).json({ success: false, message: 'Invalid or expired admin token' });
  }
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mapPaymentTransaction(p: any) {
  return {
    id: String(p._id),
    orderId: p.order ? String(p.order) : '',
    userId: p.user ? String(p.user) : '',
    amount: Number(p.amount ?? 0),
    currency: String(p.currency || 'INR'),
    paymentMethod: String(p.paymentMethod || p.provider || ''),
    status: String(p.status || 'pending'),
    transactionId: String(p.transactionId || p.providerPaymentId || ''),
    merchantTransactionId: String(p.providerOrderId || p.razorpayOrderId || ''),
    gatewayResponse: Array.isArray(p.eventHistory) ? p.eventHistory[p.eventHistory.length - 1] : undefined,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
    completedAt: p.paidAtIso || undefined,
    refundedAt: p.refundedAtIso || undefined,
    failureReason: p.providerStatus || undefined,
  };
}

const initiateSchema = z.object({
  amount: z.number().finite().positive(),
  currency: z.string().min(1).default('INR'),
  provider: z.enum(['phonepe', 'paytm', 'upi']).default('upi'),
  orderId: z.string().optional(),
});

const verifySchema = z.object({
  paymentId: z.string().min(1),
  status: z.enum(['completed', 'failed']),
  providerPaymentId: z.string().optional(),
  providerSignature: z.string().optional(),
  orderData: z
    .object({
      currency: z.string().min(1).default('INR'),
      subtotal: z.number().finite().nonnegative(),
      shipping: z.number().finite().nonnegative(),
      tax: z.number().finite().nonnegative(),
      total: z.number().finite().nonnegative(),
      items: z
        .array(
          z.object({
            productId: z.string().min(1),
            name: z.string().min(1),
            price: z.number().finite().nonnegative(),
            quantity: z.number().int().min(1),
            image: z.string().optional(),
            selectedSize: z.string().optional(),
            selectedColor: z.string().optional(),
            selectedImage: z.string().optional(),
          }),
        )
        .min(1),
      customer: z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
      }),
      address: z.object({
        line1: z.string().min(1),
        line2: z.string().optional(),
        city: z.string().min(1),
        state: z.string().min(1),
        postalCode: z.string().min(1),
        country: z.string().min(1),
      }),
    })
    .optional(),
  // Keep old Razorpay verify keys optional for backward compatibility
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
});

const authenticateAnyUserOrAdmin = async (req: AnyAuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id?: string; userId?: string; type?: string };
    const type = decoded?.type;
    const id = decoded?.id ?? decoded?.userId;

    if (!id || (type !== 'admin' && type !== 'user')) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    if (type === 'admin') {
      const admin: any = await (AdminModel as any).findById(id).lean();
      if (!admin || admin.active !== true || admin.role !== 'admin') {
        return res.status(401).json({ success: false, message: 'Invalid or expired admin token' });
      }
      req.adminId = String(admin._id);
      req.authType = 'admin';
      return next();
    }

    req.userId = String(id);
    req.authType = 'user';
    return next();
  } catch (_e) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

function makeProviderOrderId(provider: string) {
  const part = Math.random().toString(16).slice(2, 10);
  return `${provider}_${Date.now()}_${part}`;
}

// Backward-compatible alias used by older clients
router.post('/create-order', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = initiateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
  }

  const { amount, currency, provider, orderId } = parsed.data;
  const providerOrderId = makeProviderOrderId(provider);

  const orderObjectId = orderId && Types.ObjectId.isValid(orderId) ? new Types.ObjectId(orderId) : undefined;

  const payment = await PaymentModel.create({
    order: orderObjectId,
    user: new Types.ObjectId(req.userId),
    provider,
    providerOrderId,
    amount,
    currency,
    status: 'pending',
    paymentMethod: provider,
  });

  return res.json({
    paymentId: String(payment._id),
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
});

// Payment initiation (PhonePe/Paytm/UPI) - mocked for now
router.post('/initiate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = initiateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
  }

  const { amount, currency, provider, orderId } = parsed.data;
  const providerOrderId = makeProviderOrderId(provider);

  const orderObjectId = orderId && Types.ObjectId.isValid(orderId) ? new Types.ObjectId(orderId) : undefined;

  const payment = await PaymentModel.create({
    order: orderObjectId,
    user: new Types.ObjectId(req.userId),
    provider,
    providerOrderId,
    amount,
    currency,
    status: 'pending',
    paymentMethod: provider,
  });

  return res.json({
    paymentId: String(payment._id),
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
});

// Payment verification - mocked for now
router.post('/verify', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
  }

  const { paymentId, status, providerPaymentId, providerSignature, orderData } = parsed.data;

  const payment = await PaymentModel.findOne({ _id: paymentId, user: req.userId });
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  payment.status = status;
  if (providerPaymentId) payment.providerPaymentId = providerPaymentId;
  if (providerSignature) payment.providerSignature = providerSignature;

  if (status === 'completed') {
    // If caller provided orderData and this payment isn't linked yet, create and link the order.
    if (!payment.order && orderData) {
      const part = Math.random().toString(16).slice(2, 8).toUpperCase();
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${part}`;

      const createdOrder = await OrderModel.create({
        user: new Types.ObjectId(req.userId),
        orderNumber,
        status: 'paid',
        currency: orderData.currency,
        subtotal: orderData.subtotal,
        shipping: orderData.shipping,
        tax: orderData.tax,
        total: orderData.total,
        items: orderData.items,
        customer: orderData.customer,
        address: orderData.address,
        createdAtIso: new Date().toISOString(),
      });

      payment.order = createdOrder._id;
    }

    if (payment.order) {
      await OrderModel.updateOne({ _id: payment.order }, { $set: { status: 'paid' } });
    }
  }

  await payment.save();

  return res.json({
    paymentId: String(payment._id),
    status: payment.status,
    provider: payment.provider,
    orderId: payment.order ? String(payment.order) : undefined,
    message: 'Payment verification is mocked (providers not integrated yet).',
  });
});

// GET /api/payments/:paymentId/receipt (user/admin)
router.get('/:paymentId/receipt', authenticateAnyUserOrAdmin, async (req: AnyAuthenticatedRequest, res: Response) => {
  try {
    const paymentId = String(req.params.paymentId || '');
    if (!Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ success: false, message: 'Invalid payment id' });
    }

    const payment = await PaymentModel.findById(paymentId).lean();
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (req.authType === 'user') {
      const userId = req.userId;
      if (!userId || String(payment.user) !== String(userId)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    if (!payment.order) {
      return res.status(400).json({ success: false, message: 'No order linked to this payment' });
    }

    const order = await OrderModel.findById(payment.order).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const PDFDocument = require('pdfkit');

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
    doc.text(`Payment Method: ${String((payment as any).paymentMethod || (payment as any).provider || '')}`);
    doc.text(`Amount: ${String(payment.currency || 'INR')} ${Number((payment as any).amount || 0).toFixed(2)}`);
    doc.moveDown(1);

    doc.fontSize(13).text('Customer', { underline: true });
    doc.fontSize(12);
    doc.text(`Name: ${String(order.customer?.name || '')}`);
    doc.text(`Email: ${String(order.customer?.email || '')}`);
    if (order.customer?.phone) doc.text(`Phone: ${String(order.customer.phone)}`);
    doc.moveDown(0.5);

    doc.fontSize(13).text('Address', { underline: true });
    doc.fontSize(12);
    doc.text(String(order.address?.line1 || ''));
    if (order.address?.line2) doc.text(String(order.address.line2));
    doc.text(
      `${String(order.address?.city || '')}, ${String(order.address?.state || '')} ${String(order.address?.postalCode || '')}`,
    );
    doc.text(String(order.address?.country || ''));
    doc.moveDown(1);

    doc.fontSize(13).text('Items', { underline: true });
    doc.moveDown(0.25);

    const items = Array.isArray(order.items) ? order.items : [];
    for (const it of items) {
      const name = String(it?.name || '');
      const qty = Number(it?.quantity || 0);
      const price = Number(it?.price || 0);
      const size = String((it as any)?.selectedSize || '');
      const color = String((it as any)?.selectedColor || '');

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
    // eslint-disable-next-line no-console
    console.error('Receipt download error:', e);
    return res.status(500).json({ success: false, message: 'Failed to generate receipt' });
  }
});

// Provider webhook/callback endpoint - to be implemented next
router.post('/webhook/:provider', async (req: Request, res: Response) => {
  const provider = String(req.params.provider || '').toLowerCase();
  return res.status(501).json({
    error: 'Webhooks not implemented yet',
    provider,
  });
});

// GET /api/payments/transactions (admin)
router.get('/transactions', authenticateAnyAdmin, async (req: AnyAuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, Number((req.query as any)?.page ?? 1) || 1);
    const limit = Math.min(200, Math.max(1, Number((req.query as any)?.limit ?? 50) || 50));
    const status = String((req.query as any)?.status || '').trim();
    const paymentMethod = String((req.query as any)?.paymentMethod || '').trim();
    const search = String((req.query as any)?.search || '').trim();

    const q: any = {};
    if (status) q.status = status;
    if (paymentMethod) q.paymentMethod = paymentMethod;
    if (search) {
      const rx = new RegExp(escapeRegExp(search), 'i');
      q.$or = [{ providerOrderId: rx }, { providerPaymentId: rx }, { razorpayOrderId: rx }, { razorpayPaymentId: rx }];
    }

    const docs = await PaymentModel.find(q)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({ success: true, data: docs.map(mapPaymentTransaction) });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Payments transactions error:', e);
    return res.status(500).json({ success: false, message: 'Failed to load transactions' });
  }
});

// GET /api/payments/stats (admin)
router.get('/stats', authenticateAnyAdmin, async (_req: AnyAuthenticatedRequest, res: Response) => {
  try {
    const rows = await PaymentModel.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$status', 'pending'] },
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ['$amount', 0] } },
        },
      },
    ]);

    const stats: any = {
      total: 0,
      totalAmount: 0,
      pending: { count: 0, amount: 0 },
      processing: { count: 0, amount: 0 },
      completed: { count: 0, amount: 0 },
      failed: { count: 0, amount: 0 },
      refunded: { count: 0, amount: 0 },
    };

    for (const r of rows) {
      const key = String(r?._id || 'pending');
      const count = Number(r?.count ?? 0) || 0;
      const amount = Number(r?.amount ?? 0) || 0;
      stats.total += count;
      stats.totalAmount += amount;
      if (stats[key]) {
        stats[key].count = count;
        stats[key].amount = amount;
      }
    }

    return res.json({ success: true, data: stats });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Payments stats error:', e);
    return res.status(500).json({ success: false, message: 'Failed to load payment stats' });
  }
});

export default router;
