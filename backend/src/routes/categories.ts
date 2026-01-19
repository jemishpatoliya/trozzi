import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { CategoryModel } from "../models/category";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const mode = String(req.query.mode ?? "admin");
  const parentIdParam = req.query.parentId;
  const parentId = typeof parentIdParam === "string" ? parentIdParam : undefined;
  const filter: any = parentId !== undefined ? { parentId } : {};
  if (mode === "public") {
    filter.active = true;
  }

  const categories = await CategoryModel.find(filter).sort({ order: 1 }).lean();
  res.json(
    categories.map((c) => ({
      id: String(c._id),
      name: c.name,
      shortDescription: c.shortDescription,
      description: c.description,
      parentId: c.parentId,
      order: c.order,
      active: c.active,
      productCount: c.productCount,
      imageUrl: c.imageUrl,
    })),
  );
});

router.post("/", async (req: Request, res: Response) => {
  const parsed = z
    .object({
      name: z.string().trim().min(1),
      shortDescription: z.string().default(""),
      description: z.string().default(""),
      parentId: z.string().nullable().default(null),
      order: z.number().int().min(0).default(0),
      active: z.boolean().default(true),
      imageUrl: z.string().default(""),
    })
    .safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body", issues: parsed.error.issues });

  const created = await CategoryModel.create({
    name: parsed.data.name,
    shortDescription: parsed.data.shortDescription,
    description: parsed.data.description,
    parentId: parsed.data.parentId,
    order: parsed.data.order,
    active: parsed.data.active,
    imageUrl: parsed.data.imageUrl,
    productCount: 0,
  });

  res.status(201).json({
    id: String(created._id),
    name: created.name,
    shortDescription: created.shortDescription,
    description: created.description,
    parentId: created.parentId,
    order: created.order,
    active: created.active,
    productCount: created.productCount,
    imageUrl: created.imageUrl,
  });
});

router.put("/:id", async (req: Request<{ id: string }>, res: Response) => {
  const parsed = z
    .object({
      name: z.string().trim().min(1),
      shortDescription: z.string().default(""),
      description: z.string().default(""),
      parentId: z.string().nullable().default(null),
      order: z.number().int().min(0).default(0),
      active: z.boolean().default(true),
      imageUrl: z.string().default(""),
    })
    .safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body", issues: parsed.error.issues });

  const updated = await CategoryModel.findByIdAndUpdate(
    req.params.id,
    {
      name: parsed.data.name,
      shortDescription: parsed.data.shortDescription,
      description: parsed.data.description,
      parentId: parsed.data.parentId,
      order: parsed.data.order,
      active: parsed.data.active,
      imageUrl: parsed.data.imageUrl,
    },
    { new: true },
  ).lean();

  if (!updated) return res.status(404).json({ message: "Category not found" });

  res.json({
    id: String(updated._id),
    name: updated.name,
    shortDescription: updated.shortDescription,
    description: updated.description,
    parentId: updated.parentId,
    order: updated.order,
    active: updated.active,
    productCount: updated.productCount,
    imageUrl: updated.imageUrl,
  });
});

router.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
  const child = await CategoryModel.findOne({ parentId: req.params.id }).lean();
  if (child) return res.status(400).json({ message: "Cannot delete a category that has children" });

  const deleted = await CategoryModel.findByIdAndDelete(req.params.id).lean();
  if (!deleted) return res.status(404).json({ message: "Category not found" });
  res.json({ ok: true });
});

export default router;
