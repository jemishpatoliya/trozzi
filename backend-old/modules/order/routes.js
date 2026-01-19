const express = require('express');
const { OrderModel } = require('../../models/Order');
const { PaymentModel } = require('../../models/Payment');
const { auth, authorize } = require('../../middleware/auth');
const { Types } = require('mongoose');

const router = express.Router();

function makeOrderNumber() {
    const part = Math.random().toString(16).slice(2, 8).toUpperCase();
    return `ORD-${Date.now().toString().slice(-6)}-${part}`;
}

router.get('/', auth, authorize('admin'), async (req, res, next) => {
    try {
        const { status, search, page = 1, limit = 50 } = req.query;

        const query = {};
        if (status && status !== 'all') query.status = status;

        if (search && search.trim()) {
            const q = search.trim();
            query.$or = [
                { orderNumber: { $regex: q, $options: 'i' } },
                { 'customer.name': { $regex: q, $options: 'i' } },
                { 'customer.email': { $regex: q, $options: 'i' } },
            ];
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const orders = await OrderModel.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        const total = await OrderModel.countDocuments(query);

        res.json({
            success: true,
            data: orders.map(order => ({
                id: String(order._id),
                orderNumber: order.orderNumber,
                customer: order.customer?.name ?? '',
                email: order.customer?.email ?? '',
                total: order.total,
                items: Array.isArray(order.items)
                    ? order.items.reduce((sum, i) => sum + (i.quantity ?? 0), 0)
                    : 0,
                date: order.createdAtIso,
                paymentMethod: 'unknown',
                status: order.status,
            })),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        next(error);
    }
});

router.get('/my', auth, async (req, res, next) => {
    try {
        const userId = req.user._id;

        const directDocs = await OrderModel.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(200)
            .lean();

        const payments = await PaymentModel.find({ user: userId, order: { $exists: true, $ne: null } })
            .select({ order: 1 })
            .lean();

        const paymentOrderIds = payments
            .map(p => p.order ? String(p.order) : null)
            .filter(id => Boolean(id));

        const missingOrderIds = paymentOrderIds.filter(
            id => !directDocs.some(d => String(d._id) === id),
        );

        const paymentDocs = missingOrderIds.length
            ? await OrderModel.find({ _id: { $in: missingOrderIds } })
                .sort({ createdAt: -1 })
                .lean()
            : [];

        if (missingOrderIds.length) {
            await OrderModel.updateMany(
                { _id: { $in: missingOrderIds }, user: { $exists: false } },
                { $set: { user: userId } },
            );
        }

        const docs = [...directDocs, ...paymentDocs].sort((a, b) => {
            const aTime = new Date(a.createdAtIso || 0).getTime();
            const bTime = new Date(b.createdAtIso || 0).getTime();
            return bTime - aTime;
        });

        res.json({
            success: true,
            data: docs.map(order => ({
                id: String(order._id),
                orderNumber: order.orderNumber,
                customer: order.customer?.name ?? '',
                email: order.customer?.email ?? '',
                total: order.total,
                items: Array.isArray(order.items)
                    ? order.items.reduce((sum, i) => sum + (i.quantity ?? 0), 0)
                    : 0,
                date: order.createdAtIso,
                paymentMethod: 'unknown',
                status: order.status,
            }))
        });
    } catch (error) {
        next(error);
    }
});

router.post('/', auth, async (req, res, next) => {
    try {
        const { currency = 'INR', items, customer, address } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Items are required'
            });
        }

        if (!customer || !customer.name || !customer.email) {
            return res.status(400).json({
                success: false,
                error: 'Customer name and email are required'
            });
        }

        if (!address || !address.line1 || !address.city || !address.state || !address.postalCode || !address.country) {
            return res.status(400).json({
                success: false,
                error: 'Complete address is required'
            });
        }

        const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const shipping = 0;
        const tax = 0;
        const total = subtotal + shipping + tax;

        const created = await OrderModel.create({
            user: req.user._id,
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
            success: true,
            data: {
                id: String(created._id),
                orderNumber: created.orderNumber,
                status: created.status,
                currency: created.currency,
                subtotal: created.subtotal,
                shipping: created.shipping,
                tax: created.tax,
                total: created.total,
            }
        });
    } catch (error) {
        next(error);
    }
});

router.put('/:id/status', auth, authorize('admin'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ["new", "processing", "paid", "shipped", "delivered", "cancelled", "returned"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }

        const updated = await OrderModel.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).lean();

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.json({
            success: true,
            data: {
                id: String(updated._id),
                status: updated.status,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:id', auth, async (req, res, next) => {
    try {
        const { id } = req.params;

        const order = await OrderModel.findById(id).lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (req.user.role !== 'admin' && 
            String(order.user) !== String(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        res.json({
            success: true,
            data: {
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
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
