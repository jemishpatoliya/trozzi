import { z } from "zod";

import type { ProductManagementFormValues } from "./types";

const money = z
  .number({ required_error: "Required" })
  .finite("Invalid amount")
  .nonnegative("Must be 0 or greater");

const nonEmpty = (message: string) => z.string().trim().min(1, message);

export const productManagementSchema = z
  .object({
    basic: z.object({
      name: nonEmpty("Product name is required"),
      slug: nonEmpty("Product slug is required"),
      shortDescription: z.string().trim().max(300, "Max 300 characters"),
      descriptionHtml: z.string().trim(),
      categoryIds: z.array(z.string()).min(1, "Select at least 1 category"),
      subCategoryId: nonEmpty("Select a sub category"),
      brand: z.string().trim().max(80, "Max 80 characters"),
      status: z.enum(["draft", "active", "archived"]),
      visibility: z.enum(["public", "private"]),
    }),
    pricing: z.object({
      originalPrice: money.min(0.01, "Original price is required"),
      sellingPrice: money.min(0.01, "Selling price is required"),
      taxClass: z.enum(["gst", "vat", "none"]),
    }),
    inventory: z.object({
      sku: nonEmpty("SKU is required"),
      stockQuantity: z.number().int().min(0, "Must be 0 or greater"),
      lowStockThreshold: z.number().int().min(0, "Must be 0 or greater"),
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
      images: z
        .array(
          z.object({
            id: z.string(),
            url: nonEmpty("Image URL is required"),
            alt: z.string().optional(),
          }),
        )
        .max(12, "Max 12 images"),
      thumbnailId: z.string().nullable(),
    }),
    attributes: z.object({
      sets: z.array(
        z.object({
          id: z.string(),
          name: nonEmpty("Attribute name is required"),
          values: z.array(z.string()),
          useForVariants: z.boolean(),
        }),
      ),
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
    }),
    seo: z.object({
      metaTitle: z.string().trim().max(60, "Recommended: up to 60 chars"),
      metaDescription: z.string().trim().max(160, "Recommended: up to 160 chars"),
      metaKeywords: z.array(z.string()).max(20, "Max 20 keywords"),
    }),
    shipping: z.object({
      weightKg: z.number().finite().min(0, "Must be 0 or greater"),
      dimensionsCm: z.object({
        length: z.number().finite().min(0, "Must be 0 or greater"),
        width: z.number().finite().min(0, "Must be 0 or greater"),
        height: z.number().finite().min(0, "Must be 0 or greater"),
      }),
      shippingClass: z.string().trim().max(40, "Max 40 characters"),
      freeShipping: z.boolean(),
      codAvailable: z.boolean(),
      codCharge: z.number().finite().min(0, "Must be 0 or greater"),
    }),
    marketing: z.object({
      featured: z.boolean(),
      saleBadge: z.boolean(),
      scheduleSale: z.object({
        enabled: z.boolean(),
        startDate: z.string(),
        endDate: z.string(),
      }),
      couponEligible: z.boolean(),
      relatedProductIds: z.array(z.string()).max(20, "Max 20 related products"),
      upsellProductIds: z.array(z.string()).max(20, "Max 20 upsell products"),
    }),
    details: z.object({
      technicalSpecs: z.array(z.object({ key: z.string(), value: z.string() })),
      warrantyInfo: z.string().trim(),
      returnPolicy: z.string().trim(),
      customFields: z.array(z.object({ key: z.string(), value: z.string() })),
    }),
    salePage: z.object({
      enabled: z.boolean(),
      bannerText: z.string().trim().max(120, "Max 120 characters"),
      priorityOrder: z.number().int().min(0, "Must be 0 or greater"),
      countdownEnd: z.string(),
    }),
  })
  .superRefine((val, ctx) => {
    if (val.pricing.sellingPrice > val.pricing.originalPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pricing", "sellingPrice"],
        message: "Selling price cannot exceed original price",
      });
    }

    if (val.marketing.scheduleSale.enabled) {
      if (!val.marketing.scheduleSale.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["marketing", "scheduleSale", "startDate"],
          message: "Start date is required",
        });
      }
      if (!val.marketing.scheduleSale.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["marketing", "scheduleSale", "endDate"],
          message: "End date is required",
        });
      }
      if (
        val.marketing.scheduleSale.startDate &&
        val.marketing.scheduleSale.endDate &&
        new Date(val.marketing.scheduleSale.endDate).getTime() < new Date(val.marketing.scheduleSale.startDate).getTime()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["marketing", "scheduleSale", "endDate"],
          message: "End date must be after start date",
        });
      }
    }
  });

export type ProductManagementSchema = z.infer<typeof productManagementSchema>;

export const productManagementDefaults: ProductManagementFormValues = {
  basic: {
    name: "",
    slug: "",
    shortDescription: "",
    descriptionHtml: "",
    categoryIds: [],
    subCategoryId: "",
    brand: "",
    status: "draft",
    visibility: "public",
  },
  pricing: {
    originalPrice: 0,
    sellingPrice: 0,
    taxClass: "gst",
  },
  inventory: {
    sku: "",
    stockQuantity: 0,
    lowStockThreshold: 5,
    stockStatus: "in_stock",
    allowBackorders: false,
    history: [],
  },
  media: {
    images: [],
    thumbnailId: null,
  },
  attributes: {
    sets: [
      { id: "attr-color", name: "Color", values: [], useForVariants: true },
      { id: "attr-size", name: "Size", values: [], useForVariants: true },
      { id: "attr-material", name: "Material", values: [], useForVariants: false },
    ],
    variants: [],
  },
  seo: {
    metaTitle: "",
    metaDescription: "",
    metaKeywords: [],
  },
  shipping: {
    weightKg: 0,
    dimensionsCm: { length: 0, width: 0, height: 0 },
    shippingClass: "Standard",
    freeShipping: false,
    codAvailable: true,
    codCharge: 0,
  },
  marketing: {
    featured: false,
    saleBadge: false,
    scheduleSale: { enabled: false, startDate: "", endDate: "" },
    couponEligible: true,
    relatedProductIds: [],
    upsellProductIds: [],
  },
  details: {
    technicalSpecs: [{ key: "", value: "" }],
    warrantyInfo: "",
    returnPolicy: "",
    customFields: [{ key: "", value: "" }],
  },
  salePage: {
    enabled: false,
    bannerText: "",
    priorityOrder: 0,
    countdownEnd: "",
  },
};
