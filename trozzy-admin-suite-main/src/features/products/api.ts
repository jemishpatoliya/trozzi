import type { Product } from "@/lib/mockData";
import type { ProductManagementFormValues } from "./types";

function resolveApiOrigin() {
  const envAny = (import.meta as any)?.env || {};
  const raw = String(envAny.VITE_API_URL || envAny.VITE_API_BASE_URL || "").trim();
  if (!raw) return "";
  return raw.replace(/\/+$/, "").replace(/\/api\/?$/, "");
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const apiOrigin = resolveApiOrigin();
  const resolvedInput =
    typeof input === "string" && apiOrigin && input.startsWith("/") ? `${apiOrigin}${input}` : input;
  const res = await fetch(resolvedInput, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

function applyManagementToProduct(product: any): Product {
  const management: ProductManagementFormValues | undefined = product?.management;
  if (!management) return product as Product;

  const next: any = { ...product };

  const basic = management.basic ?? ({} as any);
  const pricing = management.pricing ?? ({} as any);
  const inventory = management.inventory ?? ({} as any);
  const marketing = management.marketing ?? ({} as any);
  const seo = management.seo ?? ({} as any);
  const shipping = management.shipping ?? ({} as any);

  if (typeof basic.name === "string" && basic.name.trim()) next.name = basic.name;
  if (typeof inventory.sku === "string" && inventory.sku.trim()) next.sku = inventory.sku;

  if (typeof pricing.sellingPrice === "number" && Number.isFinite(pricing.sellingPrice)) {
    next.price = pricing.sellingPrice;
  }
  if (typeof inventory.stockQuantity === "number" && Number.isFinite(inventory.stockQuantity)) {
    next.stock = inventory.stockQuantity;
  }

  if (typeof basic.status === "string" && basic.status) {
    next.status = basic.status === "archived" ? "inactive" : basic.status;
  }

  if (typeof basic.shortDescription === "string") next.description = basic.shortDescription;
  if (typeof basic.brand === "string") next.brand = basic.brand;
  if (typeof marketing.featured === "boolean") next.featured = marketing.featured;

  if (typeof seo.metaTitle === "string") next.metaTitle = seo.metaTitle;
  if (typeof seo.metaDescription === "string") next.metaDescription = seo.metaDescription;

  if (typeof shipping.weightKg === "number" && Number.isFinite(shipping.weightKg)) next.weight = shipping.weightKg;
  if (shipping.dimensionsCm && typeof shipping.dimensionsCm === "object") {
    next.dimensions = shipping.dimensionsCm;
  }

  return next as Product;
}

export async function listCatalogProducts() {
  return requestJson<Array<{ id: string; name: string; sku: string }>>("/api/products/catalog");
}

export async function listCatalogProductsFull() {
  const data = await requestJson<any[]>("/api/products?mode=admin");
  return data.map(applyManagementToProduct);
}

export async function listCategories() {
  return requestJson<Array<{ id: string; name: string; shortDescription: string; description: string; parentId: string | null; order: number; active: boolean; productCount: number; imageUrl?: string }>>(
    "/api/categories",
  );
}

export async function listCategoriesByParent(parentId: string) {
  return requestJson<Array<{ id: string; name: string; shortDescription: string; description: string; parentId: string | null; order: number; active: boolean; productCount: number; imageUrl?: string }>>(
    `/api/categories?parentId=${encodeURIComponent(parentId)}`,
  );
}

export async function listSubCategoriesByParent(parentCategoryId: string) {
  return requestJson<Array<{ id: string; name: string; shortDescription: string; description: string; parentId: string | null; order: number; active: boolean; productCount: number; imageUrl?: string }>>(
    `/api/subcategories?parentCategoryId=${encodeURIComponent(parentCategoryId)}`,
  );
}

export async function createCategory(input: {
  name: string;
  shortDescription: string;
  description: string;
  parentId: string | null;
  order: number;
  active: boolean;
  imageUrl?: string;
}) {
  return requestJson<{ id: string }>("/api/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateCategory(input: {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  parentId: string | null;
  order: number;
  active: boolean;
  imageUrl?: string;
}) {
  return requestJson<{ id: string }>(`/api/categories/${input.id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: input.name,
      shortDescription: input.shortDescription,
      description: input.description,
      parentId: input.parentId,
      order: input.order,
      active: input.active,
      imageUrl: input.imageUrl,
    }),
  });
}

export async function deleteCategory(id: string) {
  return requestJson<{ ok: true }>(`/api/categories/${id}`, {
    method: "DELETE",
  });
}

export async function createSubCategory(input: {
  name: string;
  shortDescription: string;
  description: string;
  parentId: string;
  order: number;
  active: boolean;
  imageUrl?: string;
}) {
  return requestJson<{ id: string }>("/api/subcategories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateSubCategory(input: {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  parentId: string;
  order: number;
  active: boolean;
  imageUrl?: string;
}) {
  return requestJson<{ id: string }>(`/api/subcategories/${input.id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: input.name,
      shortDescription: input.shortDescription,
      description: input.description,
      parentId: input.parentId,
      order: input.order,
      active: input.active,
      imageUrl: input.imageUrl,
    }),
  });
}

export async function deleteSubCategory(id: string) {
  return requestJson<{ ok: true }>(`/api/subcategories/${id}`, {
    method: "DELETE",
  });
}

export async function getProductManagement(id: string) {
  return requestJson<ProductManagementFormValues>(`/api/products/${id}/management`);
}

export async function saveProductDraft(input: { id?: string; values: ProductManagementFormValues }) {
  return requestJson<{ id: string }>("/api/products/draft", {
    method: "POST",
    body: JSON.stringify({ id: input.id, values: input.values }),
  });
}

export async function publishProduct(input: { id?: string; values: ProductManagementFormValues }) {
  return requestJson<{ id: string }>("/api/products/publish", {
    method: "POST",
    body: JSON.stringify({ id: input.id, values: input.values }),
  });
}

export async function updateProduct(input: { id: string; values: ProductManagementFormValues }) {
  return requestJson<{ id: string }>(`/api/products/${input.id}`, {
    method: "PUT",
    body: JSON.stringify({ values: input.values }),
  });
}

export async function deleteProduct(id: string) {
  return requestJson<{ ok: true }>(`/api/products/${id}`, { method: "DELETE" });
}

export async function bulkUpdateCatalogProductStatus(input: { ids: string[]; status: Product["status"] }) {
  return requestJson<{ ok: true }>("/api/products/bulk/status", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
