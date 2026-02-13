const express = require('express');
const router = express.Router();

const { authenticateAdmin, requireAdmin } = require('../middleware/adminAuth');
const { ContentSettingsModel, getOrCreateContentSettings, SINGLETON_ID } = require('../models/contentSettings');

function sanitizeString(v, maxLen) {
  const s = v == null ? '' : String(v);
  const trimmed = s.trim();
  if (maxLen && trimmed.length > maxLen) return trimmed.slice(0, maxLen);
  return trimmed;
}

function parseBoolean(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    if (v.toLowerCase() === 'true') return true;
    if (v.toLowerCase() === 'false') return false;
  }
  return null;
}

router.get('/', authenticateAdmin, requireAdmin, async (_req, res) => {
  try {
    const settings = await getOrCreateContentSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Admin content settings GET error:', error);
    res.status(500).json({ success: false, message: 'Failed to load content settings' });
  }
});

router.put('/', authenticateAdmin, requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};

    const update = {};

    if (body.brandLogoUrl !== undefined) {
      update.brandLogoUrl = sanitizeString(body.brandLogoUrl, 2048);
    }

    if (body.defaultAvatarUrl !== undefined) {
      update.defaultAvatarUrl = sanitizeString(body.defaultAvatarUrl, 2048);
    }

    if (body.bioMaxLength !== undefined) {
      const n = Number(body.bioMaxLength);
      if (!Number.isFinite(n) || n < 10 || n > 5000) {
        return res.status(400).json({ success: false, message: 'bioMaxLength must be a number between 10 and 5000' });
      }
      update.bioMaxLength = Math.floor(n);
    }

    if (body.showOrderHistory !== undefined) {
      const b = parseBoolean(body.showOrderHistory);
      if (b === null) return res.status(400).json({ success: false, message: 'showOrderHistory must be boolean' });
      update.showOrderHistory = b;
    }

    if (body.showWishlistCount !== undefined) {
      const b = parseBoolean(body.showWishlistCount);
      if (b === null) return res.status(400).json({ success: false, message: 'showWishlistCount must be boolean' });
      update.showWishlistCount = b;
    }

    if (body.enableProfileEditing !== undefined) {
      const b = parseBoolean(body.enableProfileEditing);
      if (b === null) return res.status(400).json({ success: false, message: 'enableProfileEditing must be boolean' });
      update.enableProfileEditing = b;
    }

    const updated = await ContentSettingsModel.findByIdAndUpdate(
      SINGLETON_ID,
      { $set: update, $setOnInsert: { _id: SINGLETON_ID } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );

    res.json({ success: true, message: 'Content settings saved', data: updated });
  } catch (error) {
    console.error('Admin content settings PUT error:', error);
    res.status(500).json({ success: false, message: 'Failed to save content settings' });
  }
});

module.exports = router;
