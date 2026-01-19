import { api } from "./client";

function applyManagementToProduct(product) {
    const management = product && product.management;
    if (!management) return product;

    const next = { ...product };
    const basic = (management && management.basic) || {};
    const pricing = (management && management.pricing) || {};
    const inventory = (management && management.inventory) || {};
    const marketing = (management && management.marketing) || {};
    const seo = (management && management.seo) || {};
    const shipping = (management && management.shipping) || {};

    if (typeof basic.name === "string" && basic.name.trim()) next.name = basic.name;
    if (typeof inventory.sku === "string" && inventory.sku.trim()) next.sku = inventory.sku;

    if (typeof pricing.sellingPrice === "number" && Number.isFinite(pricing.sellingPrice)) next.price = pricing.sellingPrice;
    if (typeof inventory.stockQuantity === "number" && Number.isFinite(inventory.stockQuantity)) next.stock = inventory.stockQuantity;

    if (typeof basic.status === "string" && basic.status) {
        next.status = basic.status === "archived" ? "inactive" : basic.status;
    }

    if (typeof basic.shortDescription === "string") next.description = basic.shortDescription;
    if (typeof basic.descriptionHtml === "string") next.descriptionHtml = basic.descriptionHtml;
    if (typeof basic.brand === "string") next.brand = basic.brand;
    if (typeof marketing.featured === "boolean") next.featured = marketing.featured;

    if (typeof seo.metaTitle === "string") next.metaTitle = seo.metaTitle;
    if (typeof seo.metaDescription === "string") next.metaDescription = seo.metaDescription;

    if (typeof shipping.weightKg === "number" && Number.isFinite(shipping.weightKg)) next.weight = shipping.weightKg;
    if (shipping.dimensionsCm && typeof shipping.dimensionsCm === "object") next.dimensions = shipping.dimensionsCm;

    return next;
}

function normalizeProductsResponse(data) {
    if (Array.isArray(data)) return data.map(applyManagementToProduct);
    if (data && Array.isArray(data.items)) return { ...data, items: data.items.map(applyManagementToProduct) };
    return data;
}

export async function fetchCategories() {
    const res = await api.get("/categories", { params: { mode: "public" } });
    return res.data;
}

export async function fetchProducts({
    page,
    limit,
    mode = "public",
    category,
    featured,
    q,
    minPrice,
    maxPrice,
    inStock,
    onSale,
    freeShipping,
    rating,
    sizes,
    colors,
    brands,
    sort,
    order
} = {}) {
    const params = {};
    if (mode) params.mode = mode;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    if (category) params.category = category;
    if (featured !== undefined) params.featured = featured;
    if (q) params.q = q;
    if (minPrice !== undefined) params.minPrice = minPrice;
    if (maxPrice !== undefined) params.maxPrice = maxPrice;
    if (inStock !== undefined) params.inStock = inStock;
    if (onSale !== undefined) params.onSale = onSale;
    if (freeShipping !== undefined) params.freeShipping = freeShipping;
    if (rating !== undefined) params.rating = rating;
    if (sizes && sizes.length > 0) params.sizes = sizes.join(',');
    if (colors && colors.length > 0) params.colors = colors.join(',');
    if (brands && brands.length > 0) params.brands = brands.join(',');
    if (sort) params.sort = sort;
    if (order) params.order = order;

    const res = await api.get("/products", { params });
    return normalizeProductsResponse(res.data);
}

export async function fetchProductById(id, { mode = "public" } = {}) {
    const res = await api.get(`/products/${id}`, { params: { mode } });
    return applyManagementToProduct(res.data);
}

export async function fetchProductBySlug(slug, { mode = "public" } = {}) {
    const res = await api.get(`/products/slug/${slug}`, { params: { mode } });
    return applyManagementToProduct(res.data);
}

export async function fetchBanners({ position } = {}) {
    const params = {};
    if (position) params.position = position;
    const res = await api.get("/banners", { params });

    const data = res.data;
    const banners = data && data.banners !== undefined ? data.banners : data;
    const list = Array.isArray(banners) ? banners : [];

    const apiBase = String(api.defaults.baseURL || "");
    const apiOrigin = apiBase.replace(/\/?api\/?$/, "");

    return list.map((b) => {
        const id = b.id || b._id;
        const rawImage = b.imageUrl || b.image;
        const imageUrl =
            typeof rawImage === "string" && rawImage.startsWith("/")
                ? `${apiOrigin}${rawImage}`
                : rawImage;

        return {
            ...b,
            id,
            imageUrl,
            linkUrl: b.linkUrl || b.link || "",
        };
    });
}
