const express = require('express');
const { SizeGuideModel } = require('../models/sizeGuide');

const router = express.Router();

function normalizeCategory(raw) {
  // Allow arbitrary guide keys like "cap", "tshirt", etc.
  // Keep it URL-safe and consistent.
  const v = String(raw || '').trim().toLowerCase();
  const cleaned = v
    .replace(/[^a-z0-9\s\-_/]/g, '')
    .replace(/\s+/g, '-')
    .replace(/\/+?/g, '-')
    .replace(/_+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned || 'default';
}

function normalizeColumns(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => ({ key: String(c?.key ?? '').trim(), label: String(c?.label ?? '').trim() }))
    .filter((c) => c.key && c.label);
}

function normalizeRows(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => {
    const obj = r && typeof r === 'object' ? r : {};
    const next = {};
    for (const [k, v] of Object.entries(obj)) {
      next[String(k)] = String(v ?? '');
    }
    return next;
  });
}

// GET /api/size-guides (list available guide keys)
router.get('/', async (_req, res) => {
  try {
    const docs = await SizeGuideModel.find({}, { category: 1 }).sort({ category: 1 }).lean();
    const keys = (Array.isArray(docs) ? docs : [])
      .map((d) => String(d?.category ?? '').trim())
      .filter((k) => k.length > 0);
    return res.json({ keys });
  } catch (e) {
    console.error('Error listing size guides:', e);
    return res.status(500).json({ message: 'Failed to list size guides' });
  }
});

// GET /api/size-guides/:category
router.get('/:category', async (req, res) => {
  try {
    const category = normalizeCategory(req.params.category);
    const doc = await SizeGuideModel.findOne({ category }).lean();
    if (!doc) {
      return res.json({
        category,
        columns: [],
        rows: [],
        updatedAt: '',
      });
    }
    return res.json({
      category: doc.category,
      columns: Array.isArray(doc.columns) ? doc.columns : [],
      rows: Array.isArray(doc.rows) ? doc.rows : [],
      updatedAt: doc.updatedAt,
    });
  } catch (e) {
    console.error('Error fetching size guide:', e);
    return res.status(500).json({ message: 'Failed to fetch size guide' });
  }
});

// PUT /api/size-guides/:category
router.put('/:category', async (req, res) => {
  try {
    const category = normalizeCategory(req.params.category);
    const columns = normalizeColumns(req.body?.columns);
    const rows = normalizeRows(req.body?.rows);

    if (columns.length === 0) {
      return res.status(400).json({ message: 'Invalid body: columns are required' });
    }

    const updatedAt = new Date().toISOString();

    const doc = await SizeGuideModel.findOneAndUpdate(
      { category },
      { $set: { category, columns, rows, updatedAt } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    return res.json({
      category: doc?.category ?? category,
      columns: doc?.columns ?? columns,
      rows: Array.isArray(doc?.rows) ? doc.rows : rows,
      updatedAt: doc?.updatedAt ?? updatedAt,
    });
  } catch (e) {
    console.error('Error saving size guide:', e);
    return res.status(500).json({ message: 'Failed to save size guide' });
  }
});

module.exports = router;
