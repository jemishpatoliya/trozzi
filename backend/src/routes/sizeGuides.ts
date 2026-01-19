import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { SizeGuideModel } from "../models/sizeGuide";

const router = Router();

type CategoryKey = "apparel" | "shoes" | "accessories";

const categorySchema = z.enum(["apparel", "shoes", "accessories"]);

const columnSchema = z.object({
  key: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(60),
});

const bodySchema = z.object({
  columns: z.array(columnSchema).min(1),
  rows: z.array(z.record(z.string())).default([]),
});

function normalizeCategory(raw: unknown): CategoryKey {
  const parsed = categorySchema.safeParse(String(raw ?? "").trim().toLowerCase());
  return parsed.success ? parsed.data : "apparel";
}

// GET /api/size-guides/:category
router.get("/:category", async (req: Request, res: Response) => {
  try {
    const category = normalizeCategory(req.params.category);
    const doc = await SizeGuideModel.findOne({ category }).lean();
    if (!doc) return res.status(404).json({ message: "Size guide not found" });
    return res.json({
      category: doc.category,
      columns: doc.columns,
      rows: Array.isArray(doc.rows) ? doc.rows : [],
      updatedAt: doc.updatedAt,
    });
  } catch (e) {
    console.error("Error fetching size guide:", e);
    return res.status(500).json({ message: "Failed to fetch size guide" });
  }
});

// PUT /api/size-guides/:category
router.put("/:category", async (req: Request, res: Response) => {
  try {
    const category = normalizeCategory(req.params.category);
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid body", issues: parsed.error.issues });
    }

    const updatedAt = new Date().toISOString();

    const doc = await SizeGuideModel.findOneAndUpdate(
      { category },
      {
        $set: {
          category,
          columns: parsed.data.columns,
          rows: parsed.data.rows,
          updatedAt,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    return res.json({
      category: doc?.category ?? category,
      columns: doc?.columns ?? parsed.data.columns,
      rows: Array.isArray(doc?.rows) ? doc?.rows : parsed.data.rows,
      updatedAt: doc?.updatedAt ?? updatedAt,
    });
  } catch (e) {
    console.error("Error saving size guide:", e);
    return res.status(500).json({ message: "Failed to save size guide" });
  }
});

export default router;
