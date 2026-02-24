import { api } from "./client";

function getApiOrigin() {
    const apiBase = String(api.defaults.baseURL || "");
    return apiBase.replace(/\/?api\/?$/, "");
}

function toAbsoluteUrl(value) {
    const raw = typeof value === "string" ? value : "";
    const s = raw.trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) return s;
    if (s.startsWith("//")) return `https:${s}`;
    if (s.startsWith("/")) return `${getApiOrigin()}${s}`;
    return s;
}

function applyManagementToProduct(product) {
    const management = product && product.management;
    if (!product || typeof product !== 'object') return product;

    const stableId = product.id || product._id;

    // Normalize core media fields even if management is absent
    const normalizedBase = {
        ...product,
        ...(stableId ? { id: stableId } : {}),
    };

    if (typeof normalizedBase.image === 'string') {
        normalizedBase.image = toAbsoluteUrl(normalizedBase.image);
    }

    if (Array.isArray(normalizedBase.galleryImages)) {
        normalizedBase.galleryImages = normalizedBase.galleryImages.map((u) => toAbsoluteUrl(u)).filter(Boolean);
    }

    if (Array.isArray(normalizedBase.colorVariants)) {
        normalizedBase.colorVariants = normalizedBase.colorVariants.map((v) => {
            const images = Array.isArray(v?.images)
                ? v.images.map((u) => toAbsoluteUrl(u)).filter(Boolean)
                : v?.images;
            return {
                ...v,
                ...(images ? { images } : {}),
            };
        });
    }

    if (!management) return normalizedBase;

    const next = { ...normalizedBase };
    const basic = (management && management.basic) || {};
    const pricing = (management && management.pricing) || {};
    const inventory = (management && management.inventory) || {};
    const marketing = (management && management.marketing) || {};
    const seo = (management && management.seo) || {};
    const shipping = (management && management.shipping) || {};
    const attributes = (management && management.attributes) || {};

    const pickAttributeValues = (needle) => {
        const sets = attributes && Array.isArray(attributes.sets) ? attributes.sets : [];
        const lower = String(needle || '').toLowerCase();
        const match = sets.find((s) => {
            const name = typeof s?.name === 'string' ? String(s.name).toLowerCase() : '';
            if (!name) return false;
            return name.includes(lower);
        });
        const raw = match ? match.values : [];
        const vals = Array.isArray(raw) ? raw : (raw === undefined || raw === null ? [] : [raw]);
        return vals
            .map((v) => String(v ?? ''))
            .map((v) => v.trim())
            .filter((v) => v.length > 0);
    };

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

    // Fallback: derive sizes/colors from attribute sets when missing on the catalog product.
    // (Admin stores size values in management.attributes.sets)
    if (!Array.isArray(next.sizes) || next.sizes.length === 0) {
        const derivedSizes = pickAttributeValues('size').filter((v) => !v.toLowerCase().includes('guide'));
        if (derivedSizes.length > 0) next.sizes = derivedSizes;
    }
    if (!Array.isArray(next.colors) || next.colors.length === 0) {
        const derivedColors = pickAttributeValues('color');
        if (derivedColors.length > 0) next.colors = derivedColors;
    }

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
    subCategoryId,
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
    if (subCategoryId) params.subCategoryId = subCategoryId;
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
