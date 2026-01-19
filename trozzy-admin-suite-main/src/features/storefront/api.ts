import type {
  OrderCreateInput,
  OrderCreateResponse,
  OrderDetails,
  PublicProduct,
} from "./types";

import type { ProductManagementFormValues } from "@/features/products/types";

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      msg = data?.message ?? msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  return (await res.json()) as T;
}

function applyManagementToPublicProduct(product: any): PublicProduct {
  const management: ProductManagementFormValues | undefined = product?.management;
  if (!management) return product as PublicProduct;

  const next: any = { ...product };

  const basic = management.basic ?? ({} as any);
  const pricing = management.pricing ?? ({} as any);
  const inventory = management.inventory ?? ({} as any);
  const marketing = management.marketing ?? ({} as any);
  const seo = management.seo ?? ({} as any);
  const shipping = management.shipping ?? ({} as any);

  if (typeof basic.name === "string" && basic.name.trim()) next.name = basic.name;
  if (typeof inventory.sku === "string" && inventory.sku.trim()) next.sku = inventory.sku;
  if (typeof pricing.sellingPrice === "number" && Number.isFinite(pricing.sellingPrice)) next.price = pricing.sellingPrice;
  if (typeof inventory.stockQuantity === "number" && Number.isFinite(inventory.stockQuantity)) next.stock = inventory.stockQuantity;

  if (typeof basic.status === "string" && basic.status) {
    next.status = basic.status === "archived" ? "inactive" : basic.status;
  }

  if (typeof basic.shortDescription === "string") next.description = basic.shortDescription;
  if (typeof basic.brand === "string") next.brand = basic.brand;
  if (typeof marketing.featured === "boolean") next.featured = marketing.featured;

  if (typeof seo.metaTitle === "string") next.metaTitle = seo.metaTitle;
  if (typeof seo.metaDescription === "string") next.metaDescription = seo.metaDescription;

  if (typeof shipping.weightKg === "number" && Number.isFinite(shipping.weightKg)) next.weight = shipping.weightKg;
  if (shipping.dimensionsCm && typeof shipping.dimensionsCm === "object") next.dimensions = shipping.dimensionsCm;

  return next as PublicProduct;
}

export async function listPublicProducts() {
  const data = await requestJson<any[]>("/api/products?mode=public");
  return data.map(applyManagementToPublicProduct);
}

export async function getPublicProductBySlug(slug: string) {
  const data = await requestJson<any>(`/api/products/slug/${encodeURIComponent(slug)}?mode=public`);
  return applyManagementToPublicProduct(data);
}

export async function createOrder(input: OrderCreateInput) {
  return requestJson<OrderCreateResponse>("/api/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getOrder(id: string) {
  return requestJson<OrderDetails>(`/api/orders/${id}`);
}
