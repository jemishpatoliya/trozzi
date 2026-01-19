const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const { authenticateAdmin, requireAdmin } = require('../middleware/adminAuth');
const { CategoryModel } = require('../models/category');

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
        visibility: p.visibility,
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
        }

        const category = req.query?.category ? String(req.query.category) : '';
        if (category) {
            filter.category = category;
        }

        const docs = await db.collection('products').find(filter).sort({ createdAt: -1 }).toArray();
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
            filter.visibility = 'public';
        }

        const doc = await db.collection('products').findOne(filter);
        if (!doc) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json(mapProduct(doc));
    } catch (error) {
        console.error('Error fetching product by slug:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch product' });
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

        await db.collection('products').updateOne(
            { _id: new ObjectId(req.params.id) },
            {
                $set: {
                    management: values,
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
            filter.visibility = 'public';
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
