import { z } from "zod";

const money = z.number().finite().nonnegative();

export const productManagementSchema = z.object({
  basic: z.object({
    name: z.string().trim().min(1),
    slug: z.string().trim().min(1),
    shortDescription: z.string().trim().max(300),
    descriptionHtml: z.string().trim(),
    categoryIds: z.array(z.string()),
    subCategoryId: z.string().trim().min(1, "Sub Category is required"),
    brand: z.string().trim().max(80),
    status: z.enum(["draft", "active", "archived"]),
    visibility: z.enum(["public", "private"]),
  }),
  pricing: z.object({
    originalPrice: money,
    sellingPrice: money,
    taxClass: z.enum(["gst", "vat", "none"]),
  }),
  inventory: z.object({
    sku: z.string().trim().min(1),
    stockQuantity: z.number().int().min(0),
    lowStockThreshold: z.number().int().min(0),
    stockStatus: z.enum(["in_stock", "out_of_stock", "backorder"]),
    allowBackorders: z.boolean(),
    history: z.array(
      z.object({
        id: z.string(),
        at: z.string(),
        user: z.string(),
        reason: z.string(),
        delta: z.number().int(),
        resultingStock: z.number().int(),
      }),
    ),
  }),
  media: z.object({
    images: z.array(z.object({ id: z.string(), url: z.string().min(1), alt: z.string().optional() })),
    thumbnailId: z.string().nullable(),
  }),
  colorVariants: z
    .array(
      z.object({
        color: z.string().trim().min(1),
        colorName: z.string().trim().min(1),
        colorCode: z.string().trim().min(1),
        name: z.string().trim().optional(),
        images: z.array(z.string().trim().min(1)).default([]),
        price: z.number().optional(),
        stock: z.number().int().optional(),
        sku: z.string().trim().optional(),
      }),
    )
    .optional(),
  attributes: z.object({
    sets: z.array(z.object({ id: z.string(), name: z.string().min(1), values: z.array(z.string()), useForVariants: z.boolean() })),
    variants: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        attributes: z.record(z.string()),
        skuOverride: z.string().optional(),
        priceOverride: z.number().optional(),
        stockOverride: z.number().int().optional(),
      }),
    ),
    sizeGuideImageUrl: z.string().trim().optional(),
  }),
  seo: z.object({
    metaTitle: z.string().trim().max(60),
    metaDescription: z.string().trim().max(160),
    metaKeywords: z.array(z.string()).max(20),
  }),
  shipping: z.object({
    weightKg: z.number().finite().min(0),
    dimensionsCm: z.object({
      length: z.number().finite().min(0),
      width: z.number().finite().min(0),
      height: z.number().finite().min(0),
    }),
    shippingClass: z.string().trim().max(40),
    freeShipping: z.boolean(),
    codAvailable: z.boolean(),
    codCharge: money,
  }),
  marketing: z.object({
    featured: z.boolean(),
    saleBadge: z.boolean(),
    scheduleSale: z.object({ enabled: z.boolean(), startDate: z.string(), endDate: z.string() }),
    couponEligible: z.boolean(),
    relatedProductIds: z.array(z.string()).max(20),
    upsellProductIds: z.array(z.string()).max(20),
  }),
  details: z.object({
    technicalSpecs: z.array(z.object({ key: z.string(), value: z.string() })),
    warrantyInfo: z.string().trim(),
    returnPolicy: z.string().trim(),
    customFields: z.array(z.object({ key: z.string(), value: z.string() })),
  }),
  salePage: z.object({
    enabled: z.boolean(),
    bannerText: z.string().trim().max(120),
    priorityOrder: z.number().int().min(0),
    countdownEnd: z.string(),
  }),
});

export type ProductManagementValues = z.infer<typeof productManagementSchema>;
