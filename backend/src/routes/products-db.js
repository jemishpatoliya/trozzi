const express = require('express');
const router = express.Router();
const { ProductModel } = require('../models/product');
const { CategoryModel } = require('../models/category');

function parseIntQuery(value) {
    if (value === undefined || value === null) return undefined;
    const n = Number.parseInt(String(value), 10);
    if (!Number.isFinite(n)) return undefined;
    return n;
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mapProduct(p) {
    return {
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
        featured: p.featured,
        createdAt: p.createdAt,
        sizes: p.sizes,
        colors: p.colors,
        colorVariants: p.colorVariants,
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
    };
}

// GET /api/products/catalog - Get product catalog list
router.get('/catalog', async (req, res) => {
    try {
        const products = await ProductModel.find({}, { name: 1, sku: 1 }).sort({ createdAt: -1 }).lean();
        res.json(products.map((p) => ({ id: String(p._id), name: p.name, sku: p.sku })));
    } catch (error) {
        console.error('Error fetching product catalog:', error);
        res.status(500).json({ message: 'Failed to fetch product catalog' });
    }
});

// GET /api/products - Get products with filtering and pagination
router.get('/', async (req, res) => {
    try {
        const mode = String(req.query.mode ?? "admin");
        const filter = {};
        if (mode === "public") {
            filter.status = "active";
            filter.visibility = "public";
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
                ProductModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
            ]);

            const totalPages = Math.max(1, Math.ceil(total / safeLimit));
            return res.json({
                items: docs.map(mapProduct),
                page: safePage,
                limit: safeLimit,
                total,
                totalPages,
                totalItems: total,
            });
        }

        const products = await ProductModel.find(filter).sort({ createdAt: -1 }).lean();
        res.json(products.map(mapProduct));
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Failed to fetch products' });
    }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
    try {
        const mode = String(req.query.mode ?? "admin");
        const filter = { _id: req.params.id };
        if (mode === "public") {
            filter.status = "active";
            filter.visibility = "public";
        }

        const p = await ProductModel.findOne(filter).lean();
        if (!p) return res.status(404).json({ message: 'Product not found' });

        res.json(mapProduct(p));
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Failed to fetch product' });
    }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
    try {
        await ProductModel.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Failed to delete product' });
    }
});

module.exports = router;
