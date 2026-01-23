import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { ProductModel } from "../models/product";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user";

const router = Router();

// Admin authentication middleware
const adminAuth = async (req: Request, res: Response, next: Function) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await UserModel.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all reviews with filtering and pagination
router.get("/", adminAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const rating = req.query.rating ? parseInt(req.query.rating as string) : undefined;
    const status = req.query.status as string;

    // Build aggregation pipeline
    const pipeline: any[] = [
      { $unwind: { path: "$reviews", preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" }
    ];

    // Add search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "reviews.customerName": { $regex: search, $options: "i" } },
            { "reviews.title": { $regex: search, $options: "i" } },
            { "reviews.comment": { $regex: search, $options: "i" } },
            { "product.name": { $regex: search, $options: "i" } }
          ]
        }
      });
    }

    // Add rating filter
    if (rating !== undefined) {
      pipeline.push({ $match: { "reviews.rating": rating } });
    }

    // Add status filter (assuming reviews have status field)
    if (status) {
      pipeline.push({ $match: { "reviews.status": status } });
    }

    // Project review fields with product info
    pipeline.push({
      $project: {
        id: "$reviews._id",
        customerName: "$reviews.customerName",
        customerEmail: "$reviews.customerEmail",
        rating: "$reviews.rating",
        title: "$reviews.title",
        comment: "$reviews.comment",
        date: "$reviews.date",
        verifiedPurchase: "$reviews.verifiedPurchase",
        helpful: "$reviews.helpful",
        status: "$reviews.status",
        productId: "$_id",
        productName: "$product.name",
        productImage: "$product.image"
      }
    });

    // Sort by date (newest first)
    pipeline.push({ $sort: { date: -1 } });

    // Get total count
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: "total" });
    
    const [countResult] = await ProductModel.aggregate(countPipeline);
    const total = countResult?.total || 0;

    // Add pagination and execute
    pipeline.push({ $skip: skip }, { $limit: limit });
    const reviews = await ProductModel.aggregate(pipeline);

    res.json({
      reviews,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

// Delete a review
router.delete("/:reviewId", adminAuth, async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;

    // Find and remove the review
    const result = await ProductModel.updateOne(
      { "reviews._id": reviewId },
      { $pull: { reviews: { _id: reviewId } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Failed to delete review" });
  }
});

// Update review status
router.put("/:reviewId/status", adminAuth, async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const result = await ProductModel.updateOne(
      { "reviews._id": reviewId },
      { $set: { "reviews.$.status": status } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({ message: "Review status updated successfully" });
  } catch (error) {
    console.error("Error updating review status:", error);
    res.status(500).json({ message: "Failed to update review status" });
  }
});

// Bulk update review status
router.put("/bulk-status", adminAuth, async (req: Request, res: Response) => {
  try {
    const { reviewIds, status } = req.body;

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({ message: "Invalid review IDs" });
    }

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const objectIds = reviewIds.map(id => new Types.ObjectId(id));

    const result = await ProductModel.updateMany(
      { "reviews._id": { $in: objectIds } },
      { $set: { "reviews.$.status": status } }
    );

    res.json({ 
      message: "Reviews status updated successfully",
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error("Error bulk updating review status:", error);
    res.status(500).json({ message: "Failed to update review status" });
  }
});

// Get review statistics
router.get("/stats", adminAuth, async (req: Request, res: Response) => {
  try {
    const pipeline = [
      { $unwind: { path: "$reviews", preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$reviews.rating" },
          ratingDistribution: {
            $push: "$reviews.rating"
          },
          statusDistribution: {
            $push: "$reviews.status"
          }
        }
      }
    ];

    const [stats] = await ProductModel.aggregate(pipeline);

    if (!stats) {
      return res.json({
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        statusDistribution: { pending: 0, approved: 0, rejected: 0 }
      });
    }

    // Calculate rating distribution
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats.ratingDistribution.forEach((rating: number) => {
      ratingCounts[rating as keyof typeof ratingCounts]++;
    });

    // Calculate status distribution
    const statusCounts = { pending: 0, approved: 0, rejected: 0 };
    stats.statusDistribution.forEach((status: string) => {
      if (status in statusCounts) {
        statusCounts[status as keyof typeof statusCounts]++;
      }
    });

    res.json({
      totalReviews: stats.totalReviews,
      averageRating: Math.round(stats.averageRating * 10) / 10,
      ratingDistribution: ratingCounts,
      statusDistribution: statusCounts
    });
  } catch (error) {
    console.error("Error fetching review stats:", error);
    res.status(500).json({ message: "Failed to fetch review statistics" });
  }
});

// Export reviews
router.get("/export", adminAuth, async (req: Request, res: Response) => {
  try {
    const format = req.query.format as string || 'json';
    const search = req.query.search as string;
    const rating = req.query.rating ? parseInt(req.query.rating as string) : undefined;
    const status = req.query.status as string;

    // Build aggregation pipeline
    const pipeline: any[] = [
      { $unwind: { path: "$reviews", preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" }
    ];

    // Add filters
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "reviews.customerName": { $regex: search, $options: "i" } },
            { "reviews.title": { $regex: search, $options: "i" } },
            { "reviews.comment": { $regex: search, $options: "i" } },
            { "product.name": { $regex: search, $options: "i" } }
          ]
        }
      });
    }

    if (rating !== undefined) {
      pipeline.push({ $match: { "reviews.rating": rating } });
    }

    if (status) {
      pipeline.push({ $match: { "reviews.status": status } });
    }

    // Project fields
    pipeline.push({
      $project: {
        customerName: "$reviews.customerName",
        customerEmail: "$reviews.customerEmail",
        rating: "$reviews.rating",
        title: "$reviews.title",
        comment: "$reviews.comment",
        date: "$reviews.date",
        verifiedPurchase: "$reviews.verifiedPurchase",
        helpful: "$reviews.helpful",
        status: "$reviews.status",
        productName: "$product.name",
        productImage: "$product.image",
        productPrice: "$product.price",
        productCategory: "$product.category"
      }
    });

    pipeline.push({ $sort: { date: -1 } });

    const reviews = await ProductModel.aggregate(pipeline);

    if (format === 'csv') {
      // Convert to CSV
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
        'Product Name',
        'Product Price',
        'Product Category'
      ];

      const csvRows = reviews.map((review: any) => [
        review.customerName,
        review.customerEmail,
        review.rating,
        `"${review.title.replace(/"/g, '""')}"`,
        `"${review.comment.replace(/"/g, '""')}"`,
        review.date,
        review.verifiedPurchase,
        review.helpful,
        review.status,
        `"${review.productName.replace(/"/g, '""')}"`,
        review.productPrice,
        review.productCategory
      ]);

      const csvContent = [headers, ...csvRows].map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="reviews_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      res.json({ reviews });
    }
  } catch (error) {
    console.error("Error exporting reviews:", error);
    res.status(500).json({ message: "Failed to export reviews" });
  }
});

export default router;
