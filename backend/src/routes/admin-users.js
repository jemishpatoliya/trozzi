const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const { authenticateAdmin, requireAdmin } = require('../middleware/adminAuth');

// GET /api/admin/users
router.get('/', authenticateAdmin, requireAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not ready' });
    }

    const page = Math.max(1, Number(req.query?.page ?? 1) || 1);
    const limit = Math.min(500, Math.max(1, Number(req.query?.limit ?? 20) || 20));
    const search = String(req.query?.search ?? '').trim();
    const role = String(req.query?.role ?? '').trim();

    const filter = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && role !== 'all') {
      filter.role = role;
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      db
        .collection('users')
        .aggregate([
          { $match: filter },
          { $sort: { createdAt: -1, _id: -1 } },
          { $skip: skip },
          { $limit: limit },
          { $project: { password: 0 } },
          {
            $lookup: {
              from: 'carts',
              localField: '_id',
              foreignField: 'user',
              as: 'cartDocs',
            },
          },
          {
            $lookup: {
              from: 'orders',
              let: { userId: '$_id', email: '$email' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $or: [
                        { $eq: ['$user', '$$userId'] },
                        { $eq: ['$customer.email', '$$email'] },
                      ],
                    },
                  },
                },
                { $group: { _id: '$_id', total: { $first: '$total' } } },
              ],
              as: 'ordersAll',
            },
          },
          {
            $addFields: {
              cartItems: {
                $cond: [
                  { $gt: [{ $size: '$cartDocs' }, 0] },
                  {
                    $let: {
                      vars: { items: { $ifNull: [{ $arrayElemAt: ['$cartDocs.items', 0] }, []] } },
                      in: {
                        $cond: [
                          { $gt: [{ $size: '$$items' }, 0] },
                          {
                            $reduce: {
                              input: '$$items',
                              initialValue: 0,
                              in: { $add: ['$$value', { $ifNull: ['$$this.quantity', 1] }] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  },
                  0,
                ],
              },
            },
          },
          {
            $addFields: {
              stats: {
                orderCount: { $size: '$ordersAll' },
                totalSpent: {
                  $reduce: {
                    input: '$ordersAll',
                    initialValue: 0,
                    in: { $add: ['$$value', { $ifNull: ['$$this.total', 0] }] },
                  },
                },
                cartItems: '$cartItems',
              },
            },
          },
          { $project: { cartDocs: 0, ordersAll: 0, cartItems: 0 } },
        ])
        .toArray(),
      db.collection('users').countDocuments(filter),
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/:id/cart
router.get('/:id/cart', authenticateAdmin, requireAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not ready' });
    }

    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    const uid = new mongoose.Types.ObjectId(userId);
    const items = await db
      .collection('carts')
      .aggregate([
        { $match: { user: uid } },
        { $project: { items: 1, totalAmount: 1, updatedAt: 1 } },
        { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productDocs',
          },
        },
        {
          $addFields: {
            product: { $arrayElemAt: ['$productDocs', 0] },
          },
        },
        {
          $project: {
            _id: 0,
            totalAmount: 1,
            updatedAt: 1,
            item: {
              productId: '$items.product',
              quantity: '$items.quantity',
              price: '$items.price',
              productName: { $ifNull: ['$product.name', '$product.title'] },
              productSlug: '$product.slug',
              productImage: {
                $ifNull: [
                  '$product.thumbnail',
                  {
                    $ifNull: [
                      { $arrayElemAt: ['$product.images', 0] },
                      { $arrayElemAt: ['$product.media.images.url', 0] },
                    ],
                  },
                ],
              },
            },
          },
        },
      ])
      .toArray();

    const normalized = items
      .filter((x) => x.item && x.item.productId)
      .map((x) => x.item);

    res.json({ success: true, items: normalized });
  } catch (error) {
    console.error('Error fetching user cart:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user cart' });
  }
});

// GET /api/admin/users/:id/orders
router.get('/:id/orders', authenticateAdmin, requireAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, message: 'Database not ready' });
    }

    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    const user = await db.collection('users').findOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { projection: { email: 1 } }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const uid = new mongoose.Types.ObjectId(userId);
    const email = String(user.email || '').toLowerCase();

    const orders = await db
      .collection('orders')
      .find(
        {
          $or: [
            { user: uid },
            { 'customer.email': email },
          ],
        },
        { projection: { items: 1, total: 1, status: 1, orderNumber: 1, createdAt: 1, createdAtIso: 1, currency: 1 } }
      )
      .sort({ createdAt: -1, _id: -1 })
      .limit(50)
      .toArray();

    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user orders' });
  }
});

module.exports = router;
