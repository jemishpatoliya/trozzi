const express = require('express');
const mongoose = require('mongoose');
const { authenticateAny } = require('../middleware/authAny');
const { NotificationModel } = require('../models/notification');

const router = express.Router();

// GET /api/notifications
router.get('/', authenticateAny, async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query?.limit ?? 50) || 50));
    const page = Math.max(1, Number(req.query?.page ?? 1) || 1);
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.admin) {
      // Admin notifications are stored as userId: null and type starting with "admin_"
      filter.userId = null;
      filter.type = { $regex: /^admin_/ };
    } else {
      filter.userId = new mongoose.Types.ObjectId(String(req.userId));
    }

    const [items, total] = await Promise.all([
      NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      NotificationModel.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: items.map((n) => ({
        id: String(n._id),
        userId: n.userId ? String(n.userId) : null,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: Boolean(n.isRead),
        createdAt: n.createdAt,
      })),
      meta: { page, limit, total },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// POST /api/notifications/mark-read
router.post('/mark-read', authenticateAny, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const id = req.body?.id;

    const targetIds = [];
    if (id) targetIds.push(String(id));
    for (const x of ids) targetIds.push(String(x));

    const objectIds = targetIds.filter((x) => mongoose.Types.ObjectId.isValid(x)).map((x) => new mongoose.Types.ObjectId(x));
    if (!objectIds.length) {
      return res.status(400).json({ success: false, message: 'No valid notification ids provided' });
    }

    const filter = { _id: { $in: objectIds } };
    if (req.admin) {
      filter.userId = null;
      filter.type = { $regex: /^admin_/ };
    } else {
      filter.userId = new mongoose.Types.ObjectId(String(req.userId));
    }

    const result = await NotificationModel.updateMany(filter, { $set: { isRead: true } });

    return res.json({ success: true, data: { modifiedCount: result.modifiedCount } });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
  }
});

module.exports = router;
