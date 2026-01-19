import { Router, type Request, type Response } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import { OrderModel, type OrderDoc } from "../models/order";
import { PaymentModel } from "../models/payment";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

type AuthenticatedRequest = Request & { userId?: string };

type AnyAuthRequest = Request & { userId?: string; adminId?: string; authType?: 'user' | 'admin' };

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: () => void) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string; id?: string };
    req.userId = decoded.userId ?? decoded.id;
    if (!req.userId) return res.status(401).json({ success: false, message: "Invalid or expired token" });
    next();
  } catch (_error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

const authenticateAny = (req: AnyAuthRequest, res: Response, next: () => void) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string; id?: string; type?: string };
    const id = decoded.userId ?? decoded.id;
    const type = decoded.type;

    if (!id) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    if (type === 'admin') {
      req.adminId = String(id);
      req.authType = 'admin';
      return next();
    }

    req.userId = String(id);
    req.authType = 'user';
    return next();
  } catch (_error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const listQuerySchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

const createOrderSchema = z.object({
  currency: z.string().default("USD"),
  items: z
    .array(
      z.object({
        productId: z.string(),
        name: z.string(),
        price: z.number().finite().nonnegative(),
        quantity: z.number().int().min(1),
        image: z.string().optional(),
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
});

function makeOrderNumber() {
  const part = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `ORD-${Date.now().toString().slice(-6)}-${part}`;
}

router.get("/", authenticateAny, async (req: AnyAuthRequest, res: Response) => {
  if (req.authType !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Admin token required' });
  }
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: "Invalid query", issues: parsed.error.issues });
  }

  const { status, search } = parsed.data;
  const page = parsed.data.page ?? 1;
  const limit = parsed.data.limit ?? 50;

  const query: Record<string, unknown> = {};
  if (status && status !== 'all') query.status = status;

  if (search && search.trim()) {
    const q = search.trim();
    query.$or = [
      { orderNumber: { $regex: q, $options: 'i' } },
      { 'customer.name': { $regex: q, $options: 'i' } },
      { 'customer.email': { $regex: q, $options: 'i' } },
    ];
  }

  const docs = await OrderModel.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean<(OrderDoc & { _id: unknown })[]>();

  res.json({
    success: true,
    data: docs.map((order: OrderDoc & { _id: unknown }) => ({
      id: String(order._id),
      orderNumber: order.orderNumber,
      customer: order.customer?.name ?? '',
      email: order.customer?.email ?? '',
      total: order.total,
      items: Array.isArray(order.items)
        ? order.items.reduce((sum: number, i: { quantity?: number }) => sum + (i.quantity ?? 0), 0)
        : 0,
      date: order.createdAtIso,
      paymentMethod: 'unknown',
      status: order.status,
    })),
  });
});

router.get("/my", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  if (!userId || !Types.ObjectId.isValid(userId)) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }

  const userObjectId = new Types.ObjectId(userId);

  // Preferred: orders explicitly linked to user.
  const directDocs = await OrderModel.find({ user: userObjectId })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean<(OrderDoc & { _id: unknown })[]>();

  // Fallback: orders linked via payments (covers older orders created before `order.user` existed).
  const payments = await PaymentModel.find({ user: userObjectId, order: { $exists: true, $ne: null } })
    .select({ order: 1 })
    .lean<{ order?: Types.ObjectId }[]>();

  const paymentOrderIds = payments
    .map((p) => (p.order ? String(p.order) : null))
    .filter((id): id is string => Boolean(id));

  const missingOrderIds = paymentOrderIds.filter(
    (id) => !directDocs.some((d) => String(d._id) === id),
  );

  const paymentDocs = missingOrderIds.length
    ? await OrderModel.find({ _id: { $in: missingOrderIds } })
        .sort({ createdAt: -1 })
        .lean<(OrderDoc & { _id: unknown })[]>()
    : [];

  // Best-effort backfill so future queries are fast.
  if (missingOrderIds.length) {
    await OrderModel.updateMany(
      { _id: { $in: missingOrderIds }, user: { $exists: false } },
      { $set: { user: userObjectId } },
    );
  }

  const docs = [...directDocs, ...paymentDocs].sort((a, b) => {
    const aTime = new Date(a.createdAtIso || 0).getTime();
    const bTime = new Date(b.createdAtIso || 0).getTime();
    return bTime - aTime;
  });

  res.json({
    success: true,
    data: docs.map((order: OrderDoc & { _id: unknown }) => ({
      id: String(order._id),
      orderNumber: order.orderNumber,
      customer: order.customer?.name ?? '',
      email: order.customer?.email ?? '',
      total: order.total,
      items: Array.isArray(order.items)
        ? order.items.reduce((sum: number, i: { quantity?: number }) => sum + (i.quantity ?? 0), 0)
        : 0,
      date: order.createdAtIso,
      paymentMethod: 'unknown',
      status: order.status,
    })),
  });
});

router.post("/", async (req: Request, res: Response) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid body", issues: parsed.error.issues });
  }

  const { currency, items, customer, address } = parsed.data;
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = 0;
  const tax = 0;
  const total = subtotal + shipping + tax;

  const created = await OrderModel.create({
    orderNumber: makeOrderNumber(),
    status: "new",
    currency,
    subtotal,
    shipping,
    tax,
    total,
    items,
    customer,
    address,
    createdAtIso: new Date().toISOString(),
  });

  res.status(201).json({
    id: String(created._id),
    orderNumber: created.orderNumber,
    status: created.status,
    currency: created.currency,
    subtotal: created.subtotal,
    shipping: created.shipping,
    tax: created.tax,
    total: created.total,
  });
});

router.put("/:id/status", async (req: Request<{ id: string }>, res: Response) => {
  const parsed = z
    .object({
      status: z.enum(["new", "processing", "paid", "shipped", "delivered", "cancelled", "returned"]),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ success: false, message: "Invalid body", issues: parsed.error.issues });
  }

  const updated = await OrderModel.findByIdAndUpdate(
    req.params.id,
    { status: parsed.data.status },
    { new: true },
  ).lean<OrderDoc & { _id: unknown }>();

  if (!updated) return res.status(404).json({ success: false, message: "Order not found" });

  res.json({
    success: true,
    data: {
      id: String(updated._id),
      status: updated.status,
    },
  });
});

router.get("/:id", async (req: Request, res: Response) => {
  const order = await OrderModel.findById(req.params.id).lean<OrderDoc & { _id: unknown }>();
  if (!order) return res.status(404).json({ message: "Order not found" });

  res.json({
    id: String(order._id),
    orderNumber: order.orderNumber,
    status: order.status,
    currency: order.currency,
    subtotal: order.subtotal,
    shipping: order.shipping,
    tax: order.tax,
    total: order.total,
    items: order.items,
    customer: order.customer,
    address: order.address,
    createdAtIso: order.createdAtIso,
  });
});

export default router;
