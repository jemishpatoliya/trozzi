const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const { authenticateAdmin, requireAdmin } = require('../middleware/adminAuth');
const { CategoryModel } = require('../models/category');
const { authenticateAny } = require('../middleware/authAny');
const { ProductModel } = require('../models/product');
const { Order } = require('../models/order');

function parseIntQuery(value) {
    if (value === undefined || value === null) return undefined;
    const n = Number.parseInt(String(value), 10);
    if (!Number.isFinite(n)) return undefined;
    return n;
}

function escapeRegExp(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseCsvQuery(value) {
    if (value === undefined || value === null) return [];
    return String(value)
        .split(',')
        .map((v) => String(v).trim())
        .filter((v) => v.length > 0);
}

async function validateSubCategoryOrThrow(base) {
    const categoryIds = Array.isArray(base?.categoryIds) ? base.categoryIds : [];
    const categoryId = String(categoryIds[0] ?? '').trim();
    const subCategoryId = String(base?.subCategoryId ?? '').trim();

    if (!categoryId) {
        const err = new Error('Category is required');
        err.statusCode = 400;
        throw err;
    }

    if (!subCategoryId) {
        const err = new Error('Sub Category is required');
        err.statusCode = 400;
        throw err;
    }

    const sub = await CategoryModel.findById(subCategoryId).lean();
    // parentId null => this is a top-level category, not a sub-category
    if (!sub || sub.parentId === null || String(sub.parentId) !== String(categoryId)) {
        const err = new Error('Please enter a sub category');
        err.statusCode = 400;
        throw err;
    }
}

function pickAttributeValues(management, needle) {
    const sets = management && management.attributes && Array.isArray(management.attributes.sets)
        ? management.attributes.sets
        : [];
    const lower = String(needle || '').toLowerCase();
    const match = sets.find((s) => typeof (s && s.name) === 'string' && String(s.name).toLowerCase().includes(lower));
    const vals = match && Array.isArray(match.values) ? match.values : [];
    return vals
        .map((v) => String(v))
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
}

function mapProduct(p) {
    const management = p && p.management ? p.management : null;
    const shipping = management && management.shipping ? management.shipping : null;
    const descriptionHtml = management && management.basic && typeof management.basic.descriptionHtml === 'string'
        ? management.basic.descriptionHtml
        : '';
    const derivedSizes = pickAttributeValues(management, 'size').filter((v) => !v.toLowerCase().includes('guide'));
    const derivedColors = pickAttributeValues(management, 'color');
    const sizeGuide = pickAttributeValues(management, 'size guide');
    const sizeGuideKey = sizeGuide && sizeGuide.length ? String(sizeGuide[0]) : '';

    const incomingColorVariants = management && Array.isArray(management.colorVariants)
        ? management.colorVariants
        : null;
    const hasAnyVariantImages = (variants) => {
        if (!Array.isArray(variants) || variants.length === 0) return false;
        return variants.some((v) => Array.isArray(v?.images) && v.images.length > 0);
    };
    const generatedColorVariants = derivedColors.map((colorNameRaw) => {
        const colorName = String(colorNameRaw || '').trim();
        const color = colorName.toLowerCase().replace(/\s+/g, '-');
        return { color, colorName, colorCode: '', images: [] };
    });

    const storedVariants = Array.isArray(p.colorVariants) && p.colorVariants.length ? p.colorVariants : null;
    const preferredVariants = hasAnyVariantImages(incomingColorVariants)
        ? incomingColorVariants
        : (hasAnyVariantImages(storedVariants) ? storedVariants : null);

    return {
        _id: String(p._id),
        id: String(p._id),
        slug: p.slug,
        visibility: (p.visibility ?? (management && management.basic ? management.basic.visibility : undefined) ?? 'public'),
        name: p.name,
        sku: p.sku,
        price: p.price,
        stock: p.stock,
        status: p.status,
        image: p.image,
        galleryImages: p.galleryImages,
        category: p.category,
        description: p.description,
        descriptionHtml,
        featured: p.featured,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        freeShipping: typeof p?.freeShipping === 'boolean' ? p.freeShipping : Boolean(shipping?.freeShipping),
        codAvailable: typeof p?.codAvailable === 'boolean' ? p.codAvailable : Boolean(shipping?.codAvailable),
        codCharge: Number(p?.codCharge ?? shipping?.codCharge ?? 0) || 0,
        weight: Number(p?.weight ?? shipping?.weightKg ?? 0) || 0,
        dimensions: p?.dimensions ?? (shipping?.dimensionsCm ?? { length: 0, width: 0, height: 0 }),
        sizes: Array.isArray(p.sizes) && p.sizes.length ? p.sizes : derivedSizes,
        colors: Array.isArray(p.colors) && p.colors.length ? p.colors : derivedColors,
        sizeGuide,
        sizeGuideKey,
        colorVariants: Array.isArray(preferredVariants) && preferredVariants.length
            ? preferredVariants
            : (Array.isArray(incomingColorVariants) && incomingColorVariants.length ? incomingColorVariants : (storedVariants && storedVariants.length ? storedVariants : generatedColorVariants)),
        management: p.management,
    };
}

function mapStatusToCatalogStatus(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'active') return 'active';
    if (s === 'draft') return 'draft';
    return 'inactive';
}

// GET /api/products/catalog (admin)
router.get('/catalog', authenticateAdmin, requireAdmin, async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const docs = await db
            .collection('products')
            .find({}, { projection: { name: 1, sku: 1 } })
            .sort({ name: 1 })
            .toArray();
        res.json(docs.map((p) => ({ id: String(p._id), name: p.name ?? '', sku: p.sku ?? '' })));
    } catch (error) {
        console.error('Error fetching catalog products:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch catalog products' });
    }
});

// GET /api/products (mode=admin requires token, mode=public is open)
router.get('/', async (req, res, next) => {
    const mode = String(req.query?.mode ?? 'public');
    if (mode === 'admin') return authenticateAdmin(req, res, () => requireAdmin(req, res, next));
    return next();
});

router.get('/', async (req, res) => {
    try {
        const mode = String(req.query?.mode ?? 'public');
        const db = mongoose.connection.db;

        const filter = {};
        if (mode !== 'admin') {
            // public mode: only active products
            filter.status = { $in: ['active', 'published'] };
            filter.$or = [
                { visibility: 'public' },
                { visibility: { $exists: false } },
                { visibility: null },
                { 'management.basic.visibility': 'public' },
                { 'management.basic.visibility': { $exists: false } },
                { 'management.basic.visibility': null },
            ];
        }

        const category = req.query?.category ? String(req.query.category) : '';
        if (category) {
            filter.category = category;
        }

        const q = String(req.query?.q ?? '').trim();
        if (q) {
            const rx = new RegExp(escapeRegExp(q), 'i');
            filter.$or = [{ name: rx }, { sku: rx }, { brand: rx }, { category: rx }, { tags: rx }];
        }

        const minPrice = parseIntQuery(req.query?.minPrice);
        const maxPrice = parseIntQuery(req.query?.maxPrice);
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined) filter.price.$gte = minPrice;
            if (maxPrice !== undefined) filter.price.$lte = maxPrice;
        }

        if (String(req.query?.inStock ?? '').toLowerCase() === 'true') {
            filter.stock = { $gt: 0 };
        }

        if (String(req.query?.freeShipping ?? '').toLowerCase() === 'true') {
            filter.freeShipping = true;
        }

        if (String(req.query?.onSale ?? '').toLowerCase() === 'true') {
            filter.saleEnabled = true;
            filter.saleDiscount = { $gt: 0 };
        }

        const sizes = parseCsvQuery(req.query?.sizes);
        if (sizes.length > 0) {
            filter.sizes = { $in: sizes };
        }

        const colors = parseCsvQuery(req.query?.colors);
        if (colors.length > 0) {
            filter.colors = { $in: colors };
        }

        const brands = parseCsvQuery(req.query?.brands);
        if (brands.length > 0) {
            filter.brand = { $in: brands };
        }

        const sort = String(req.query?.sort ?? '').trim();
        const order = String(req.query?.order ?? '').trim().toLowerCase();
        const sortDir = order === 'asc' ? 1 : -1;
        const sortSpec = (() => {
            if (sort === 'price_asc') return { price: 1, createdAt: -1 };
            if (sort === 'price_desc') return { price: -1, createdAt: -1 };
            if (sort === 'name_asc') return { name: 1, createdAt: -1 };
            if (sort === 'name_desc') return { name: -1, createdAt: -1 };
            if (sort === 'rating_desc') return { rating: -1, createdAt: -1 };
            if (sort === 'newest') return { createdAt: -1 };
            if (sort) return { [sort]: sortDir, createdAt: -1 };
            return { createdAt: -1 };
        })();

        const page = parseIntQuery(req.query?.page);
        const limit = parseIntQuery(req.query?.limit);
        const shouldPaginate = page !== undefined || limit !== undefined;

        if (shouldPaginate) {
            const safePage = Math.max(1, page ?? 1);
            const safeLimit = Math.min(100, Math.max(1, limit ?? 24));
            const skip = (safePage - 1) * safeLimit;

            const [totalItems, docs] = await Promise.all([
                db.collection('products').countDocuments(filter),
                db.collection('products').find(filter).sort(sortSpec).skip(skip).limit(safeLimit).toArray(),
            ]);

            const totalPages = Math.max(1, Math.ceil(Number(totalItems || 0) / safeLimit));

            return res.json({
                items: docs.map(mapProduct),
                page: safePage,
                limit: safeLimit,
                total: totalItems,
                totalPages,
                totalItems,
            });
        }

        const docs = await db.collection('products').find(filter).sort(sortSpec).toArray();
        res.json(docs.map(mapProduct));
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch products' });
    }
});

// GET /api/products/:id/management (admin)
router.get('/:id/management', authenticateAdmin, requireAdmin, async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const { ObjectId } = require('mongodb');
        const doc = await db.collection('products').findOne({ _id: new ObjectId(req.params.id) });
        if (!doc) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json(doc.management ?? {});
    } catch (error) {
        console.error('Error fetching product management:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch product management' });
    }
});

// GET /api/products/slug/:slug (mode=admin requires token, mode=public is open)
router.get('/slug/:slug', async (req, res, next) => {
    const mode = String(req.query?.mode ?? 'public');
    if (mode === 'admin') return authenticateAdmin(req, res, () => requireAdmin(req, res, next));
    return next();
});

router.get('/slug/:slug', async (req, res) => {
    try {
        const mode = String(req.query?.mode ?? 'public');
        const db = mongoose.connection.db;

        const filter = { slug: String(req.params.slug) };
        if (mode !== 'admin') {
            filter.status = { $in: ['active', 'published'] };
            filter.$or = [
                { visibility: 'public' },
                { visibility: { $exists: false } },
                { visibility: null },
                { 'management.basic.visibility': 'public' },
                { 'management.basic.visibility': { $exists: false } },
                { 'management.basic.visibility': null },
            ];
        }

        const doc = await db.collection('products').findOne(filter);
        if (!doc) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json(mapProduct(doc));
    } catch (error) {
        console.error('Error fetching product by slug:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch product' });
    }
});

router.post('/:productId/reviews', authenticateAny, async (req, res) => {
    try {
        if (!req.userId || !req.user) {
            return res.status(401).json({ success: false, message: 'Access token required' });
        }

        const productId = String(req.params.productId || '').trim();
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product id' });
        }

        const rating = Number(req.body?.rating);
        const title = String(req.body?.title || '').trim();
        const comment = String(req.body?.comment || '').trim();
        const imagesRaw = Array.isArray(req.body?.images) ? req.body.images : [];
        const images = imagesRaw
            .map((u) => String(u || '').trim())
            .filter((u) => u.length > 0)
            .slice(0, 5);

        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }
        if (!title) return res.status(400).json({ success: false, message: 'Title is required' });
        if (!comment) return res.status(400).json({ success: false, message: 'Comment is required' });

        const userId = new mongoose.Types.ObjectId(String(req.userId));
        const email = String(req.user?.email || '').trim().toLowerCase();
        const name = String(req.user?.name || '').trim() || 'Customer';

        const hasDelivered = await Order.exists({
            user: userId,
            status: 'delivered',
            items: { $elemMatch: { productId: String(productId) } },
        });
        if (!hasDelivered) {
            return res.status(403).json({ success: false, message: 'You can review only after delivery' });
        }

        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const already = (Array.isArray(product.reviews) ? product.reviews : []).some((r) => String(r?.customerEmail || '').toLowerCase() === email);
        if (already) {
            return res.status(409).json({ success: false, message: 'You have already reviewed this product' });
        }

        const nowIso = new Date().toISOString();
        product.reviews.push({
            rating: Math.round(rating),
            title,
            comment,
            customerName: name,
            customerEmail: email,
            images,
            date: nowIso,
            verifiedPurchase: true,
            helpful: 0,
            status: 'pending',
        });

        const approved = (product.reviews || []).filter((r) => String(r?.status || '') === 'approved');
        const avg = approved.length
            ? approved.reduce((sum, r) => sum + Number(r?.rating || 0), 0) / approved.length
            : 0;
        product.rating = Math.round(avg * 10) / 10;
        await product.save();

        const created = product.reviews[product.reviews.length - 1];
        return res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: {
                id: String(created?._id || ''),
                status: String(created?.status || 'pending'),
            },
        });
    } catch (error) {
        console.error('Error submitting product review:', error);
        return res.status(500).json({ success: false, message: 'Failed to submit review' });
    }
});

// POST /api/products/draft (admin)
router.post('/draft', authenticateAdmin, requireAdmin, async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const { ObjectId } = require('mongodb');
        const id = req.body?.id;
        const values = req.body?.values;
        if (!values) return res.status(400).json({ success: false, message: 'Missing values' });

        const now = new Date();
        const base = values?.basic ?? {};
        await validateSubCategoryOrThrow(base);
        const pricing = values?.pricing ?? {};
        const inventory = values?.inventory ?? {};
        const media = values?.media ?? {};
        const shipping = values?.shipping ?? {};
        const dimensions = shipping?.dimensionsCm ?? { length: 0, width: 0, height: 0 };

        const images = Array.isArray(media?.images) ? media.images : [];
        const thumbId = media?.thumbnailId ?? null;
        const thumb = thumbId ? images.find((i) => i?.id === thumbId) : null;
        const primaryImageUrl = String((thumb?.url ?? images[0]?.url ?? '') || '');
        const galleryImages = images
            .map((i) => i?.url)
            .filter((u) => typeof u === 'string' && u.trim().length)
            .map((u) => String(u));

        const categoryIds = Array.isArray(base?.categoryIds) ? base.categoryIds : [];
        const category = String(categoryIds[0] ?? '');

        const doc = {
            slug: base.slug,
            visibility: base.visibility,
            name: base.name,
            sku: inventory.sku,
            price: pricing.sellingPrice,
            stock: inventory.stockQuantity,
            status: 'draft',
            image: primaryImageUrl,
            galleryImages,
            category,
            description: base.shortDescription ?? '',
            featured: !!(values?.marketing?.featured),
            freeShipping: !!shipping.freeShipping,
            codAvailable: !!shipping.codAvailable,
            codCharge: Number(shipping.codCharge ?? 0) || 0,
            weight: Number(shipping.weightKg ?? 0) || 0,
            dimensions,
            management: values,
            createdAt: now,
            updatedAt: now,
        };

        if (id) {
            await db.collection('products').updateOne({ _id: new ObjectId(id) }, { $set: { ...doc, updatedAt: now } });
            return res.json({ id: String(id) });
        }

        const result = await db.collection('products').insertOne(doc);
        res.json({ id: String(result.insertedId) });
    } catch (error) {
        if (error && error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('Error saving draft:', error);
        res.status(500).json({ success: false, message: 'Failed to save draft' });
    }
});

// POST /api/products/publish (admin)
router.post('/publish', authenticateAdmin, requireAdmin, async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const { ObjectId } = require('mongodb');
        const id = req.body?.id;
        const values = req.body?.values;
        if (!values) return res.status(400).json({ success: false, message: 'Missing values' });

        const now = new Date();
        const base = values?.basic ?? {};
        await validateSubCategoryOrThrow(base);
        const pricing = values?.pricing ?? {};
        const inventory = values?.inventory ?? {};

        const media = values?.media ?? {};
        const shipping = values?.shipping ?? {};
        const dimensions = shipping?.dimensionsCm ?? { length: 0, width: 0, height: 0 };

        const images = Array.isArray(media?.images) ? media.images : [];
        const thumbId = media?.thumbnailId ?? null;
        const thumb = thumbId ? images.find((i) => i?.id === thumbId) : null;
        const primaryImageUrl = String((thumb?.url ?? images[0]?.url ?? '') || '');
        const galleryImages = images
            .map((i) => i?.url)
            .filter((u) => typeof u === 'string' && u.trim().length)
            .map((u) => String(u));

        const categoryIds = Array.isArray(base?.categoryIds) ? base.categoryIds : [];
        const category = String(categoryIds[0] ?? '');

        const doc = {
            slug: base.slug,
            visibility: base.visibility,
            name: base.name,
            sku: inventory.sku,
            price: pricing.sellingPrice,
            stock: inventory.stockQuantity,
            status: 'active',
            image: primaryImageUrl,
            galleryImages,
            category,
            description: base.shortDescription ?? '',
            featured: !!(values?.marketing?.featured),
            freeShipping: !!shipping.freeShipping,
            codAvailable: !!shipping.codAvailable,
            codCharge: Number(shipping.codCharge ?? 0) || 0,
            weight: Number(shipping.weightKg ?? 0) || 0,
            dimensions,
            management: values,
            updatedAt: now,
        };

        if (id) {
            await db.collection('products').updateOne({ _id: new ObjectId(id) }, { $set: doc });
            return res.json({ id: String(id) });
        }

        const created = { ...doc, createdAt: now };
        const result = await db.collection('products').insertOne(created);
        res.json({ id: String(result.insertedId) });
    } catch (error) {
        if (error && error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('Error publishing product:', error);
        res.status(500).json({ success: false, message: 'Failed to publish product' });
    }
});

// PUT /api/products/:id (admin)
router.put('/:id', authenticateAdmin, requireAdmin, async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const { ObjectId } = require('mongodb');
        const values = req.body?.values;
        if (!values) return res.status(400).json({ success: false, message: 'Missing values' });

        const now = new Date();
        const base = values?.basic ?? {};
        await validateSubCategoryOrThrow(base);
        const pricing = values?.pricing ?? {};
        const inventory = values?.inventory ?? {};
        const media = values?.media ?? {};
        const shipping = values?.shipping ?? {};
        const dimensions = shipping?.dimensionsCm ?? { length: 0, width: 0, height: 0 };

        const images = Array.isArray(media?.images) ? media.images : [];
        const thumbId = media?.thumbnailId ?? null;
        const thumb = thumbId ? images.find((i) => i?.id === thumbId) : null;
        const primaryImageUrl = String((thumb?.url ?? images[0]?.url ?? '') || '');
        const galleryImages = images
            .map((i) => i?.url)
            .filter((u) => typeof u === 'string' && u.trim().length)
            .map((u) => String(u));

        const categoryIds = Array.isArray(base?.categoryIds) ? base.categoryIds : [];
        const category = String(categoryIds[0] ?? '');

        const nextStatus = mapStatusToCatalogStatus(base?.status);
        const nextVisibility = String(base?.visibility || 'public');
        const nextName = String(base?.name || '').trim();
        const nextSlug = String(base?.slug || '').trim();
        const nextSku = String(inventory?.sku || '').trim();
        const nextPrice = Number(pricing?.sellingPrice ?? NaN);
        const nextStock = Number(inventory?.stockQuantity ?? NaN);
        const nextDescription = typeof base?.shortDescription === 'string' ? base.shortDescription : '';

        await db.collection('products').updateOne(
            { _id: new ObjectId(req.params.id) },
            {
                $set: {
                    management: values,
                    status: nextStatus,
                    visibility: nextVisibility,
                    ...(nextName ? { name: nextName } : {}),
                    ...(nextSlug ? { slug: nextSlug } : {}),
                    ...(nextSku ? { sku: nextSku } : {}),
                    ...(Number.isFinite(nextPrice) ? { price: nextPrice } : {}),
                    ...(Number.isFinite(nextStock) ? { stock: nextStock } : {}),
                    description: nextDescription,
                    image: primaryImageUrl,
                    galleryImages,
                    category,
                    freeShipping: !!shipping.freeShipping,
                    codAvailable: !!shipping.codAvailable,
                    codCharge: Number(shipping.codCharge ?? 0) || 0,
                    weight: Number(shipping.weightKg ?? 0) || 0,
                    dimensions,
                    updatedAt: now,
                },
            }
        );
        res.json({ id: req.params.id });
    } catch (error) {
        if (error && error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, message: 'Failed to update product' });
    }
});

// DELETE /api/products/:id (admin)
router.delete('/:id', authenticateAdmin, requireAdmin, async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const { ObjectId } = require('mongodb');
        const result = await db.collection('products').deleteOne({ _id: new ObjectId(req.params.id) });
        if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ ok: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, message: 'Failed to delete product' });
    }
});

// GET /api/products/:id (mode=admin requires token, mode=public is open)
router.get('/:id', async (req, res, next) => {
    const mode = String(req.query?.mode ?? 'public');
    if (mode === 'admin') return authenticateAdmin(req, res, () => requireAdmin(req, res, next));
    return next();
});

router.get('/:id', async (req, res) => {
    try {
        const mode = String(req.query?.mode ?? 'public');
        const db = mongoose.connection.db;
        const { ObjectId } = require('mongodb');

        const filter = { _id: new ObjectId(req.params.id) };
        if (mode !== 'admin') {
            filter.status = { $in: ['active', 'published'] };
            filter.$or = [
                { visibility: 'public' },
                { visibility: { $exists: false } },
                { visibility: null },
                { 'management.basic.visibility': 'public' },
                { 'management.basic.visibility': { $exists: false } },
                { 'management.basic.visibility': null },
            ];
        }

        const doc = await db.collection('products').findOne(filter);
        if (!doc) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json(mapProduct(doc));
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch product' });
    }
});

module.exports = router;
