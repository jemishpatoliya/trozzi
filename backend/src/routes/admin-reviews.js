const express = require('express');
const mongoose = require('mongoose');
const { ProductModel } = require('../models/product');
const { authenticateAdmin, requireAdmin } = require('../middleware/adminAuth');

const router = express.Router();

function csvEscape(v) {
  const s = v == null ? '' : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildMatch({ search, rating, status }) {
  const match = {};
  if (rating != null && rating !== '') match['reviews.rating'] = Number(rating);
  if (status) match['reviews.status'] = String(status);

  const q = search ? String(search).trim() : '';
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    match['$or'] = [
      { 'reviews.customerName': rx },
      { 'reviews.customerEmail': rx },
      { 'reviews.title': rx },
      { 'reviews.comment': rx },
      { name: rx },
    ];
  }

  return match;
}

function reviewsPipeline({ search, rating, status }) {
  const pipeline = [
    { $unwind: { path: '$reviews', preserveNullAndEmptyArrays: false } },
  ];

  const match = buildMatch({ search, rating, status });
  if (Object.keys(match).length) pipeline.push({ $match: match });

  pipeline.push({
    $project: {
      id: '$reviews._id',
      customerName: '$reviews.customerName',
      customerEmail: '$reviews.customerEmail',
      rating: '$reviews.rating',
      title: '$reviews.title',
      comment: '$reviews.comment',
      date: '$reviews.date',
      verifiedPurchase: '$reviews.verifiedPurchase',
      helpful: '$reviews.helpful',
      status: '$reviews.status',
      productId: '$_id',
      productName: '$name',
      productImage: '$image',
    },
  });

  pipeline.push({ $sort: { date: -1 } });
  return pipeline;
}

// GET /api/admin/reviews
router.get('/', authenticateAdmin, requireAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page || 1) || 1;
    const limit = Number(req.query.limit || 10) || 10;
    const search = req.query.search;
    const rating = req.query.rating;
    const status = req.query.status;

    const base = reviewsPipeline({ search, rating, status });

    const countPipeline = base.slice(0);
    countPipeline.push({ $count: 'total' });

    const [{ total } = { total: 0 }] = await ProductModel.aggregate(countPipeline);

    const skip = (page - 1) * limit;
    const pipeline = base.concat([{ $skip: skip }, { $limit: limit }]);

    const reviews = await ProductModel.aggregate(pipeline);

    return res.json({
      reviews,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// GET /api/admin/reviews/stats
router.get('/stats', authenticateAdmin, requireAdmin, async (_req, res) => {
  try {
    const pipeline = [
      { $unwind: { path: '$reviews', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$reviews.rating' },
          pendingReviews: { $sum: { $cond: [{ $eq: ['$reviews.status', 'pending'] }, 1, 0] } },
          approvedReviews: { $sum: { $cond: [{ $eq: ['$reviews.status', 'approved'] }, 1, 0] } },
          rejectedReviews: { $sum: { $cond: [{ $eq: ['$reviews.status', 'rejected'] }, 1, 0] } },
        },
      },
    ];

    const [stats] = await ProductModel.aggregate(pipeline);

    if (!stats) {
      return res.json({
        totalReviews: 0,
        averageRating: 0,
        pendingReviews: 0,
        approvedReviews: 0,
        rejectedReviews: 0,
      });
    }

    return res.json({
      totalReviews: stats.totalReviews || 0,
      averageRating: Math.round((stats.averageRating || 0) * 10) / 10,
      pendingReviews: stats.pendingReviews || 0,
      approvedReviews: stats.approvedReviews || 0,
      rejectedReviews: stats.rejectedReviews || 0,
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    return res.status(500).json({ message: 'Failed to fetch review statistics' });
  }
});

// PUT /api/admin/reviews/:reviewId/status
router.put('/:reviewId/status', authenticateAdmin, requireAdmin, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const status = String(req.body?.status || '');

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: 'Invalid review id' });
    }

    const valid = new Set(['pending', 'approved', 'rejected']);
    if (!valid.has(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await ProductModel.updateOne(
      { 'reviews._id': reviewId },
      { $set: { 'reviews.$.status': status } },
    );

    if (!result || result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    return res.json({ message: 'Review status updated successfully' });
  } catch (error) {
    console.error('Error updating review status:', error);
    return res.status(500).json({ message: 'Failed to update review status' });
  }
});

// DELETE /api/admin/reviews/:reviewId
router.delete('/:reviewId', authenticateAdmin, requireAdmin, async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: 'Invalid review id' });
    }

    const result = await ProductModel.updateOne(
      { 'reviews._id': reviewId },
      { $pull: { reviews: { _id: new mongoose.Types.ObjectId(reviewId) } } },
    );

    if (!result || result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    return res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ message: 'Failed to delete review' });
  }
});

// GET /api/admin/reviews/export?format=csv
router.get('/export', authenticateAdmin, requireAdmin, async (req, res) => {
  try {
    const format = String(req.query.format || 'csv');
    const search = req.query.search;
    const rating = req.query.rating;
    const status = req.query.status;

    const pipeline = reviewsPipeline({ search, rating, status });
    const rows = await ProductModel.aggregate(pipeline);

    if (format !== 'csv') {
      return res.json({ reviews: rows });
    }

    const headers = [
      'Customer Name',
      'Customer Email',
      'Rating',
      'Title',
      'Comment',
      'Date',
      'Verified Purchase',
      'Helpful',
      'Status',
      'Product ID',
      'Product Name',
    ];

    const csv = [
      headers.join(','),
      ...rows.map((r) => [
        csvEscape(r.customerName),
        csvEscape(r.customerEmail),
        csvEscape(r.rating),
        csvEscape(r.title),
        csvEscape(r.comment),
        csvEscape(r.date),
        csvEscape(r.verifiedPurchase),
        csvEscape(r.helpful),
        csvEscape(r.status),
        csvEscape(r.productId),
        csvEscape(r.productName),
      ].join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="reviews_${new Date().toISOString().split('T')[0]}.csv"`);
    return res.send(csv);
  } catch (error) {
    console.error('Error exporting reviews:', error);
    return res.status(500).json({ message: 'Failed to export reviews' });
  }
});

module.exports = router;
