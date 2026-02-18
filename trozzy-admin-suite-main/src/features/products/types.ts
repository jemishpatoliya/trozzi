export type ProductStatus = "draft" | "active" | "archived";

export type ProductVisibility = "public" | "private";

export type TaxClass = "gst" | "vat" | "none";

export type StockStatus = "in_stock" | "out_of_stock" | "backorder";

export interface InventoryHistoryEvent {
  id: string;
  at: string;
  user: string;
  reason: string;
  delta: number;
  resultingStock: number;
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
}

export interface AttributeSet {
  id: string;
  name: string;
  values: string[];
  useForVariants: boolean;
}

export interface ProductVariantOverride {
  id: string;
  name: string;
  attributes: Record<string, string>;
  skuOverride?: string;
  priceOverride?: number;
  stockOverride?: number;
}

export interface ProductColorVariant {
  color: string;
  colorName: string;
  colorCode: string;
  name?: string;
  images: string[];
  price?: number;
  stock?: number;
  sku?: string;
}

export interface KeyValuePair {
  key: string;
  value: string;
}

export interface ProductManagementFormValues {
  basic: {
    name: string;
    slug: string;
    shortDescription: string;
    descriptionHtml: string;
    categoryIds: string[];
    subCategoryId: string;
    brand: string;
    status: ProductStatus;
    visibility: ProductVisibility;
  };
  pricing: {
    originalPrice: number;
    sellingPrice: number;
    taxClass: TaxClass;
  };
  inventory: {
    sku: string;
    stockQuantity: number;
    lowStockThreshold: number;
    stockStatus: StockStatus;
    allowBackorders: boolean;
    history: InventoryHistoryEvent[];
  };
  media: {
    images: ProductImage[];
    thumbnailId: string | null;
  };
  colorVariants?: ProductColorVariant[];
  attributes: {
    sets: AttributeSet[];
    variants: ProductVariantOverride[];
    sizeGuideImageUrl?: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string[];
  };
  shipping: {
    weightKg: number;
    dimensionsCm: { length: number; width: number; height: number };
    shippingClass: string;
    freeShipping: boolean;
    codAvailable: boolean;
    codCharge: number;
  };
  marketing: {
    featured: boolean;
    saleBadge: boolean;
    scheduleSale: { enabled: boolean; startDate: string; endDate: string };
    couponEligible: boolean;
    relatedProductIds: string[];
    upsellProductIds: string[];
  };
  details: {
    technicalSpecs: KeyValuePair[];
    warrantyInfo: string;
    returnPolicy: string;
    customFields: KeyValuePair[];
  };
  salePage: {
    enabled: boolean;
    bannerText: string;
    priorityOrder: number;
    countdownEnd: string;
  };
}
