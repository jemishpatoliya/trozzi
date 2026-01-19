import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { ProductModel } from "../models/product";
import { Types } from "mongoose";

const router = Router();

const AWS_REGION = process.env.AWS_REGION;
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;

function toAbsoluteUrl(req: Request, url: unknown) {
  const value = String(url ?? "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) {
    const proto = (req.headers["x-forwarded-proto"] as string | undefined) || req.protocol;
    return `${proto}://${req.get("host")}${value}`;
  }
  if (/^uploads\//i.test(value) && AWS_REGION && AWS_S3_BUCKET) {
    return `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${value}`;
  }
  return value;
}

// Question Schema
const questionSchema = z.object({
  question: z.string().min(1).max(500),
  customerName: z.string().min(1).max(100),
  customerEmail: z.string().email().optional()
});

// Answer Schema
const answerSchema = z.object({
  answer: z.string().min(1).max(1000),
  sellerName: z.string().min(1).max(100),
  isVerified: z.boolean().default(false)
});

// Review Schema
const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(100),
  comment: z.string().min(1).max(1000),
  customerName: z.string().min(1).max(100),
  customerEmail: z.string().email(),
  verifiedPurchase: z.boolean().default(false)
});

// Get Product Questions
router.get("/:productId/questions", async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Verify product exists
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get questions (in real implementation, these would be in a separate collection)
    const questions = (((product as any).questions || []) as any[]).slice(skip, skip + limit);
    const total = (((product as any).questions || []) as any[]).length;

    res.json({
      questions: questions.map((q: any) => ({
        id: q._id || q.id,
        question: q.question,
        customerName: q.customerName,
        customerEmail: q.customerEmail,
        date: q.date || new Date().toISOString(),
        answers: q.answers || [],
        upvotes: q.upvotes || 0,
        isAnswered: q.answers && q.answers.length > 0
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: "Failed to fetch questions" });
  }
});

// Ask Question
router.post("/:productId/questions", async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const parsed = questionSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid question data", issues: parsed.error.issues });
    }

    // Verify product exists
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const newQuestion = {
      _id: new Types.ObjectId(),
      ...parsed.data,
      date: new Date().toISOString(),
      answers: [],
      upvotes: 0
    };

    // Add question to product (in real implementation, use separate collection)
    if (!(product as any).questions) (product as any).questions = [];
    (product as any).questions.push(newQuestion);
    await product.save();

    res.status(201).json({
      id: newQuestion._id,
      ...newQuestion,
      isAnswered: false
    });
  } catch (error) {
    console.error("Error asking question:", error);
    res.status(500).json({ message: "Failed to submit question" });
  }
});

// Answer Question
router.post("/questions/:questionId/answers", async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    const parsed = answerSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid answer data", issues: parsed.error.issues });
    }

    // Find product containing this question
    const product = await ProductModel.findOne({ "questions._id": questionId });
    if (!product) {
      return res.status(404).json({ message: "Question not found" });
    }

    const newAnswer = {
      _id: new Types.ObjectId(),
      ...parsed.data,
      date: new Date().toISOString(),
      upvotes: 0
    };

    // Add answer to question
    const question = (product as any).questions?.id?.(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    if (!question.answers) question.answers = [];
    question.answers.push(newAnswer);
    await product.save();

    res.status(201).json({
      id: newAnswer._id,
      ...newAnswer
    });
  } catch (error) {
    console.error("Error answering question:", error);
    res.status(500).json({ message: "Failed to submit answer" });
  }
});

// Upvote Question
router.post("/questions/:questionId/upvote", async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;

    // Find product containing this question
    const product = await ProductModel.findOne({ "questions._id": questionId });
    if (!product) {
      return res.status(404).json({ message: "Question not found" });
    }

    const question = (product as any).questions?.id?.(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    question.upvotes = (question.upvotes || 0) + 1;
    await product.save();

    res.json({ upvotes: question.upvotes });
  } catch (error) {
    console.error("Error upvoting question:", error);
    res.status(500).json({ message: "Failed to upvote question" });
  }
});

// Get Product Reviews
router.get("/:productId/reviews", async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sort = req.query.sort as string || 'recent';
    const skip = (page - 1) * limit;

    // Verify product exists
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get reviews with sorting
    let reviews = (((product as any).reviews || []) as any[]);
    
    if (sort === 'helpful') {
      reviews.sort((a: any, b: any) => (b.helpful || 0) - (a.helpful || 0));
    } else if (sort === 'rating-high') {
      reviews.sort((a: any, b: any) => b.rating - a.rating);
    } else if (sort === 'rating-low') {
      reviews.sort((a: any, b: any) => a.rating - b.rating);
    } else {
      reviews.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    const paginatedReviews = reviews.slice(skip, skip + limit);
    const total = reviews.length;

    res.json({
      reviews: paginatedReviews.map((r: any) => ({
        id: r._id || r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        customerName: r.customerName,
        date: r.date,
        verifiedPurchase: r.verifiedPurchase,
        helpful: r.helpful || 0
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      averageRating: product.rating || 0,
      totalReviews: total
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

// Submit Review
router.post("/:productId/reviews", async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const parsed = reviewSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid review data", issues: parsed.error.issues });
    }

    // Verify product exists
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const newReview = {
      _id: new Types.ObjectId(),
      ...parsed.data,
      date: new Date().toISOString(),
      helpful: 0,
      status: "pending",
    };

    // Add review to product
    if (!(product as any).reviews) (product as any).reviews = [];
    (product as any).reviews.push(newReview);
    
    // Update product average rating
    const allRatings = (((product as any).reviews || []) as any[]).map((r: any) => r.rating);
    const averageRating = allRatings.reduce((sum: number, rating: number) => sum + rating, 0) / allRatings.length;
    product.rating = Math.round(averageRating * 10) / 10;
    
    await product.save();

    res.status(201).json({
      id: newReview._id,
      ...newReview
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ message: "Failed to submit review" });
  }
});

// Helpful Review
router.post("/reviews/:reviewId/helpful", async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;

    // Find product containing this review
    const product = await ProductModel.findOne({ "reviews._id": reviewId });
    if (!product) {
      return res.status(404).json({ message: "Review not found" });
    }

    const review = (product as any).reviews?.id?.(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    review.helpful = (review.helpful || 0) + 1;
    await product.save();

    res.json({ helpful: review.helpful });
  } catch (error) {
    console.error("Error marking review helpful:", error);
    res.status(500).json({ message: "Failed to mark review helpful" });
  }
});

// Get Product Details
router.get("/:productId/details", async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const colorVariantsRaw = Array.isArray(product.colorVariants) ? product.colorVariants : [];
    const colorVariants = colorVariantsRaw.map((v: any) => ({
      ...v,
      images: Array.isArray(v?.images) ? v.images.map((img: any) => toAbsoluteUrl(req, img)).filter(Boolean) : [],
    }));

    // Enhanced product details
    const details = {
      id: product._id,
      name: product.name,
      description: product.description,
      descriptionHtml:
        typeof (product as any)?.management?.basic?.descriptionHtml === "string"
          ? (product as any).management.basic.descriptionHtml
          : "",
      price: product.price,
      image: toAbsoluteUrl(req, product.image),
      galleryImages: (product.galleryImages || []).map((img) => toAbsoluteUrl(req, img)).filter(Boolean),
      brand: product.brand,
      category: product.category,
      stock: product.stock,
      rating: product.rating || 0,
      reviews: (((product as any).reviews || []) as any[]).length,
      questions: (((product as any).questions || []) as any[]).length,
      keyFeatures: product.keyFeatures || [],
      warranty: product.warranty,
      warrantyDetails: product.warrantyDetails,
      weight: product.weight,
      dimensions: product.dimensions,
      sizes: product.sizes || [],
      sizeGuideKey: (product as any).sizeGuideKey || "",
      colors: product.colors || [],
      colorVariants,
      tags: product.tags || [],
      saleEnabled: product.saleEnabled,
      saleDiscount: product.saleDiscount,
      saleStartDate: product.saleStartDate,
      saleEndDate: product.saleEndDate,
      freeShipping: product.freeShipping,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      createdAt: product.createdAt,
      updatedAt: (product as any).updatedAt
    };

    res.json(details);
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ message: "Failed to fetch product details" });
  }
});

export default router;
