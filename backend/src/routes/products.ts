import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { CategoryModel } from "../models/category";
import { ProductModel } from "../models/product";
import { productManagementSchema } from "../validation/productManagement";

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

function parseIntQuery(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mapProduct(req: Request, p: any) {
  const colorVariantsRaw = Array.isArray(p?.colorVariants) ? p.colorVariants : [];
  const colorVariants = colorVariantsRaw.map((v: any) => ({
    ...v,
    images: Array.isArray(v?.images) ? v.images.map((img: any) => toAbsoluteUrl(req, img)).filter(Boolean) : [],
  }));

  const sellingPrice = Number(p?.management?.pricing?.sellingPrice ?? p?.management?.pricing?.selling_price ?? NaN);
  const price = Number.isFinite(sellingPrice) ? sellingPrice : Number(p?.price ?? 0) || 0;

  return {
    id: String(p._id),
    slug: p.slug,
    visibility: (p.visibility ?? p?.management?.basic?.visibility ?? "public"),
    name: p.name,
    sku: p.sku,
    originalPrice: Number(p?.originalPrice ?? p?.management?.pricing?.originalPrice ?? 0) || 0,
    price,
    stock: p.stock,
    status: p.status,
    image: toAbsoluteUrl(req, p.image),
    galleryImages: (Array.isArray(p?.galleryImages) ? p.galleryImages : []).map((img: any) => toAbsoluteUrl(req, img)).filter(Boolean),
    category: p.category,
    categoryId: p.categoryId,
    subCategoryId: p.subCategoryId,
    description: p.description,
    descriptionHtml:
      typeof p?.management?.basic?.descriptionHtml === "string" ? p.management.basic.descriptionHtml : "",
    featured: p.featured,
    createdAt: p.createdAt,
    sizes: p.sizes,
    colors: p.colors,
    sizeGuideKey: p.sizeGuideKey,
    sizeGuide: Array.isArray(p?.management?.attributes?.sets)
      ? (p.management.attributes.sets
          .filter((s: any) => typeof s?.name === "string" && s.name.toLowerCase().includes("size guide"))
          .flatMap((s: any) => (Array.isArray(s?.values) ? s.values : []))
          .map((v: any) => String(v))
          .filter((v: string) => v.trim().length > 0))
      : [],
    colorVariants: colorVariants.map((v: any) => ({
      ...v,
      price: Number.isFinite(Number(v?.price)) ? Number(v.price) : undefined,
    })),
    variants: p.variants,
    tags: p.tags,
    keyFeatures: p.keyFeatures,
    warranty: p.warranty,
    warrantyDetails: p.warrantyDetails,
    saleEnabled: p.saleEnabled,
    saleDiscount: p.saleDiscount,
    saleStartDate: p.saleStartDate,
    saleEndDate: p.saleEndDate,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    weight: p.weight,
    dimensions: p.dimensions,
    badge: p.badge,
    brand: p.brand,
    freeShipping: typeof p?.freeShipping === 'boolean' ? p.freeShipping : Boolean(p?.management?.shipping?.freeShipping),
    salePageEnabled: Boolean(p?.management?.salePage?.enabled),
    salePageBannerText: typeof p?.management?.salePage?.bannerText === 'string' ? p.management.salePage.bannerText : "",
    codAvailable: typeof p?.codAvailable === 'boolean' ? p.codAvailable : Boolean(p?.management?.shipping?.codAvailable),
    codCharge: Number(p?.codCharge ?? p?.management?.shipping?.codCharge ?? 0) || 0,
  };
}

function mapStatusToCatalogStatus(status: "draft" | "active" | "archived"): "draft" | "active" | "inactive" {
  if (status === "active") return "active";
  if (status === "draft") return "draft";
  return "inactive";
}

router.get("/catalog", async (_req: Request, res: Response) => {
  const products = await ProductModel.find({}, { name: 1, sku: 1 }).sort({ createdAt: -1 }).lean();
  res.json(products.map((p) => ({ id: String(p._id), name: p.name, sku: p.sku })));
});

router.get("/", async (req: Request, res: Response) => {
  const mode = String(req.query.mode ?? "admin");
  const filter: any = {};
  if (mode === "public") {
    filter.status = "active";
    filter.$or = [
      { visibility: "public" },
      { visibility: { $exists: false } },
      { visibility: null },
      { "management.basic.visibility": "public" },
      { "management.basic.visibility": { $exists: false } },
      { "management.basic.visibility": null },
    ];
  }

  const category = req.query.category ? String(req.query.category) : "";
  if (category) {
    filter.category = category;
  }

  const featured = req.query.featured === undefined ? undefined : String(req.query.featured);
  if (featured === "true") {
    filter.featured = true;
  }
  if (featured === "false") {
    filter.featured = false;
  }

  // Search query
  const q = String(req.query.q ?? "").trim();
  if (q) {
    const rx = new RegExp(escapeRegExp(q), "i");
    filter.$or = [{ name: rx }, { sku: rx }, { brand: rx }, { category: rx }, { tags: rx }];
  }

  // Price range filtering
  const minPrice = parseIntQuery(req.query.minPrice);
  const maxPrice = parseIntQuery(req.query.maxPrice);
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  // Stock filtering
  const inStock = req.query.inStock === "true";
  if (inStock) {
    filter.stock = { $gt: 0 };
  }

  // Sale filtering
  const onSale = req.query.onSale === "true";
  if (onSale) {
    filter.saleEnabled = true;
    const now = new Date();
    filter.$and = Array.isArray(filter.$and) ? filter.$and : [];
    filter.$and.push({
      $or: [
        { saleStartDate: { $lte: now }, saleEndDate: { $gte: now } },
        { saleStartDate: { $lte: now }, saleEndDate: { $exists: false } },
        { saleStartDate: { $exists: false }, saleEndDate: { $gte: now } },
        { saleStartDate: { $exists: false }, saleEndDate: { $exists: false } }
      ]
    });
  }

  // Free shipping filtering
  const freeShipping = req.query.freeShipping === "true";
  if (freeShipping) {
    filter.freeShipping = true;
  }

  // Rating filtering (average rating from reviews would need to be calculated)
  const minRating = parseIntQuery(req.query.rating);
  if (minRating !== undefined && minRating > 0) {
    // This would require a reviews collection or rating field in products
    // For now, we'll assume products have a rating field
    filter.rating = { $gte: minRating };
  }

  // Size filtering
  const sizes = req.query.sizes;
  if (sizes && typeof sizes === "string") {
    const sizeArray = sizes.split(",").filter(s => s.trim());
    if (sizeArray.length > 0) {
      filter.sizes = { $in: sizeArray };
    }
  } else if (Array.isArray(sizes)) {
    const sizeArray = sizes.filter(s => typeof s === "string" && s.trim());
    if (sizeArray.length > 0) {
      filter.sizes = { $in: sizeArray };
    }
  }

  // Color filtering
  const colors = req.query.colors;
  if (colors && typeof colors === "string") {
    const colorArray = colors.split(",").filter(c => c.trim());
    if (colorArray.length > 0) {
      filter.colors = { $in: colorArray };
    }
  } else if (Array.isArray(colors)) {
    const colorArray = colors.filter(c => typeof c === "string" && c.trim());
    if (colorArray.length > 0) {
      filter.colors = { $in: colorArray };
    }
  }

  // Brand filtering
  const brands = req.query.brands;
  if (brands && typeof brands === "string") {
    const brandArray = brands.split(",").filter(b => b.trim());
    if (brandArray.length > 0) {
      filter.brand = { $in: brandArray };
    }
  } else if (Array.isArray(brands)) {
    const brandArray = brands.filter(b => typeof b === "string" && b.trim());
    if (brandArray.length > 0) {
      filter.brand = { $in: brandArray };
    }
  }

  // Sorting
  const sort = String(req.query.sort ?? "createdAt");
  const order = String(req.query.order ?? "desc");
  const sortOptions: any = {};
  
  switch (sort) {
    case "price_asc":
      sortOptions.price = 1;
      break;
    case "price_desc":
      sortOptions.price = -1;
      break;
    case "name_asc":
      sortOptions.name = 1;
      break;
    case "name_desc":
      sortOptions.name = -1;
      break;
    case "rating_desc":
      sortOptions.rating = -1;
      break;
    case "newest":
      sortOptions.createdAt = -1;
      break;
    case "relevance":
    default:
      sortOptions.createdAt = -1;
      break;
  }

  // Pagination
  const page = parseIntQuery(req.query.page);
  const limit = parseIntQuery(req.query.limit);
  const shouldPaginate = page !== undefined || limit !== undefined;

  if (shouldPaginate) {
    const safePage = Math.max(1, page ?? 1);
    const safeLimit = Math.min(100, Math.max(1, limit ?? 24));
    const skip = (safePage - 1) * safeLimit;

    const [total, docs] = await Promise.all([
      ProductModel.countDocuments(filter),
      ProductModel.find(filter).sort(sortOptions).skip(skip).limit(safeLimit).lean(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    return res.json({
      items: docs.map((p) => mapProduct(req, p)),
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      totalItems: total,
    });
  }

  const products = await ProductModel.find(filter).sort(sortOptions).lean();
  res.json(products.map((p) => mapProduct(req, p)));
});

router.get("/slug/:slug", async (req: Request, res: Response) => {
  const mode = String(req.query.mode ?? "admin");
  const filter: any = { slug: req.params.slug };
  if (mode === "public") {
    filter.status = "active";
    filter.$or = [
      { visibility: "public" },
      { visibility: { $exists: false } },
      { visibility: null },
      { "management.basic.visibility": "public" },
      { "management.basic.visibility": { $exists: false } },
      { "management.basic.visibility": null },
    ];
  }

  const p = await ProductModel.findOne(filter).lean();
  if (!p) return res.status(404).json({ message: "Product not found" });

  res.json({
    ...mapProduct(req, p),
  });
});

router.get("/:id", async (req: Request, res: Response) => {
  const mode = String(req.query.mode ?? "admin");
  const filter: any = { _id: req.params.id };
  if (mode === "public") {
    filter.status = "active";
    filter.$or = [
      { visibility: "public" },
      { visibility: { $exists: false } },
      { visibility: null },
      { "management.basic.visibility": "public" },
      { "management.basic.visibility": { $exists: false } },
      { "management.basic.visibility": null },
    ];
  }

  const p = await ProductModel.findOne(filter).lean();
  if (!p) return res.status(404).json({ message: "Product not found" });
  res.json(mapProduct(req, p));
});

router.get("/:id/management", async (req: Request, res: Response) => {
  const product = await ProductModel.findById(req.params.id).lean();
  if (!product) return res.status(404).json({ message: "Product not found" });
  if (!product.management) return res.status(404).json({ message: "Management data not found" });
  res.json(product.management);
});

const saveBodySchema = z.object({ values: productManagementSchema });

async function upsertFromManagement(id: string, values: any) {
  const existing: any | null = await ProductModel.findById(id).lean();
  const categories = await CategoryModel.find({}).lean();
  const categoryId = values.basic?.categoryIds?.[0];
  const categoryName = categoryId ? categories.find((c) => String(c._id) === String(categoryId))?.name : undefined;
  const subCategoryId = values.basic?.subCategoryId;

  const attributeSets = Array.isArray(values?.attributes?.sets) ? values.attributes.sets : [];
  const pickValues = (needle: string) => {
    const lower = needle.toLowerCase();
    const match = attributeSets.find((s: any) => typeof s?.name === "string" && s.name.toLowerCase().includes(lower));
    const vals = match && Array.isArray(match.values) ? match.values : [];
    return vals
      .map((v: any) => String(v))
      .map((v: string) => v.trim())
      .filter((v: string) => v.length > 0);
  };

  const derivedSizes = pickValues("size").filter((v: string) => !v.toLowerCase().includes("guide"));
  const derivedColors = pickValues("color");
  const derivedSizeGuideKeys = pickValues("size guide");
  const derivedSizeGuideKey = derivedSizeGuideKeys.length > 0 ? derivedSizeGuideKeys[0] : "";

  const incomingColorVariants =
    (Array.isArray(values?.colorVariants) ? values.colorVariants : undefined) ??
    (Array.isArray(values?.variants?.colorVariants) ? values.variants.colorVariants : undefined);

  const normalizedGeneratedColorVariants = derivedColors.map((c: string) => {
    const colorName = String(c);
    const color = colorName.trim().toLowerCase().replace(/\s+/g, "-");
    return {
      color,
      colorName,
      colorCode: "",
      images: [],
    };
  });

  const nextColorVariants =
    incomingColorVariants ??
    (Array.isArray(existing?.colorVariants) && existing.colorVariants.length > 0 ? existing.colorVariants : undefined) ??
    (normalizedGeneratedColorVariants.length > 0 ? normalizedGeneratedColorVariants : []);

  const thumbnailUrl = values.media?.thumbnailId
    ? values.media?.images?.find((i: any) => i.id === values.media.thumbnailId)?.url
    : values.media?.images?.[0]?.url;

  const next = {
    slug: values.basic.slug,
    visibility: values.basic.visibility,
    name: values.basic.name,
    sku: values.inventory.sku,
    originalPrice: values.pricing.originalPrice,
    price: values.pricing.sellingPrice,
    stock: values.inventory.stockQuantity,
    status: mapStatusToCatalogStatus(values.basic.status),
    image: thumbnailUrl ?? "",
    galleryImages: (values.media.images ?? []).map((i: any) => i.url),
    category: categoryName ?? "",
    categoryId: categoryId ? String(categoryId) : "",
    subCategoryId: subCategoryId ? String(subCategoryId) : "",
    description: values.basic.shortDescription ?? "",
    featured: !!values.marketing.featured,
    sizes: derivedSizes,
    sizeGuideKey: derivedSizeGuideKey,
    colors: derivedColors,
    tags: values.seo.metaKeywords ?? [],
    keyFeatures: (values.details.technicalSpecs ?? []).map((kv: any) => kv.key).filter(Boolean),
    warranty: values.details.warrantyInfo ?? "",
    warrantyDetails: values.details.returnPolicy ?? "",
    saleEnabled: !!values.marketing.scheduleSale?.enabled,
    saleDiscount: 0,
    saleStartDate: values.marketing.scheduleSale?.startDate ?? "",
    saleEndDate: values.marketing.scheduleSale?.endDate ?? "",
    metaTitle: values.seo.metaTitle ?? "",
    metaDescription: values.seo.metaDescription ?? "",
    weight: values.shipping.weightKg ?? 0,
    dimensions: values.shipping.dimensionsCm ?? { length: 0, width: 0, height: 0 },
    badge: values.marketing.saleBadge ? "sale" : "",
    brand: values.basic.brand ?? "",
    freeShipping: !!values.shipping.freeShipping,
    codAvailable: !!values.shipping.codAvailable,
    codCharge: Number(values.shipping.codCharge ?? 0) || 0,
    colorVariants: nextColorVariants,
    management: values,
    managementUpdatedAt: new Date().toISOString(),
  };

  await ProductModel.findByIdAndUpdate(
    id,
    { $set: next, $setOnInsert: { createdAt: new Date().toISOString().split("T")[0] } },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );
}

router.post("/draft", async (req: Request, res: Response) => {
  const parsed = saveBodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid body", issues: parsed.error.issues });

  const id = req.body?.id as string | undefined;
  const values = parsed.data.values;
  const categoryId = values.basic?.categoryIds?.[0];
  if (!categoryId) return res.status(400).json({ message: "Category is required" });
  if (!values.basic?.subCategoryId) return res.status(400).json({ message: "Sub Category is required" });
  const draftValues = { ...values, basic: { ...values.basic, status: "draft" } };

  if (id) {
    await upsertFromManagement(id, draftValues);
    return res.json({ id });
  }

  const createdAt = new Date().toISOString().split("T")[0];
  const doc = await ProductModel.create({
    slug: draftValues.basic.slug,
    visibility: draftValues.basic.visibility,
    name: draftValues.basic.name,
    sku: draftValues.inventory.sku,
    price: draftValues.pricing.sellingPrice,
    stock: draftValues.inventory.stockQuantity,
    status: mapStatusToCatalogStatus("draft"),
    image: "",
    galleryImages: [],
    category: "",
    description: draftValues.basic.shortDescription ?? "",
    featured: !!draftValues.marketing.featured,
    createdAt,
    sizes: [],
    colors: [],
    colorVariants: [],
    variants: [],
    tags: [],
    keyFeatures: [],
    warranty: "",
    warrantyDetails: "",
    saleEnabled: false,
    saleDiscount: 0,
    saleStartDate: "",
    saleEndDate: "",
    metaTitle: "",
    metaDescription: "",
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    badge: "",
    brand: "",
    management: draftValues,
    managementUpdatedAt: new Date().toISOString(),
  });

  await upsertFromManagement(String(doc._id), draftValues);
  res.json({ id: String(doc._id) });
});

router.post("/publish", async (req: Request, res: Response) => {
  const parsed = saveBodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid body", issues: parsed.error.issues });

  const id = req.body?.id as string | undefined;
  const values = parsed.data.values;
  const categoryId = values.basic?.categoryIds?.[0];
  if (!categoryId) return res.status(400).json({ message: "Category is required" });
  if (!values.basic?.subCategoryId) return res.status(400).json({ message: "Sub Category is required" });
  const nextValues = { ...values, basic: { ...values.basic, status: "active" } };

  if (id) {
    await upsertFromManagement(id, nextValues);
    return res.json({ id });
  }

  const createdAt = new Date().toISOString().split("T")[0];
  const doc = await ProductModel.create({
    slug: nextValues.basic.slug,
    visibility: nextValues.basic.visibility,
    name: nextValues.basic.name,
    sku: nextValues.inventory.sku,
    price: nextValues.pricing.sellingPrice,
    stock: nextValues.inventory.stockQuantity,
    status: mapStatusToCatalogStatus("active"),
    image: "",
    galleryImages: [],
    category: "",
    description: nextValues.basic.shortDescription ?? "",
    featured: !!nextValues.marketing.featured,
    createdAt,
    sizes: [],
    colors: [],
    colorVariants: [],
    variants: [],
    tags: [],
    keyFeatures: [],
    warranty: "",
    warrantyDetails: "",
    saleEnabled: false,
    saleDiscount: 0,
    saleStartDate: "",
    saleEndDate: "",
    metaTitle: "",
    metaDescription: "",
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    freeShipping: !!nextValues.shipping.freeShipping,
    codAvailable: typeof nextValues.shipping.codAvailable === 'boolean' ? nextValues.shipping.codAvailable : Boolean(nextValues.shipping.codAvailable),
    codCharge: Number(nextValues.shipping.codCharge ?? 0) || 0,
    badge: "",
    brand: "",
    management: nextValues,
    managementUpdatedAt: new Date().toISOString(),
  });

  await upsertFromManagement(String(doc._id), nextValues);
  res.json({ id: String(doc._id) });
});

router.put("/:id", async (req: Request, res: Response) => {
  const parsed = saveBodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid body", issues: parsed.error.issues });

  const product = await ProductModel.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const values: any = parsed.data.values;
  const categoryId = values.basic?.categoryIds?.[0];
  if (!categoryId) return res.status(400).json({ message: "Category is required" });
  if (!values.basic?.subCategoryId) return res.status(400).json({ message: "Sub Category is required" });

  await upsertFromManagement(req.params.id, parsed.data.values);
  res.json({ id: req.params.id });
});

router.delete("/:id", async (req: Request, res: Response) => {
  await ProductModel.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.post("/bulk/status", async (req: Request, res: Response) => {
  const parsed = z.object({ ids: z.array(z.string()).min(1), status: z.enum(["active", "inactive", "draft"]) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid body", issues: parsed.error.issues });

  await ProductModel.updateMany({ _id: { $in: parsed.data.ids } }, { $set: { status: parsed.data.status } });
  res.json({ ok: true });
});

export default router;
