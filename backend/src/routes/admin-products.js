const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateAdmin, requireAdmin } = require('../middleware/adminAuth');

function mapProduct(p) {
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
        featured: p.featured,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
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

// GET /api/admin/products - Get all products
router.get('/', authenticateAdmin, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, category } = req.query;
        const db = mongoose.connection.db;

        // Build filter
        const filter = {};
        if (category) {
            filter.category = category;
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [
                { name: searchRegex },
                { description: searchRegex },
                { sku: searchRegex },
                { brand: searchRegex }
            ];
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [products, total] = await Promise.all([
            db.collection('products').find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).toArray(),
            db.collection('products').countDocuments(filter)
        ]);

        const mappedProducts = products.map(mapProduct);

        res.json({
            success: true,
            products: mappedProducts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products'
        });
    }
});

// GET /api/admin/products/:id - Get single product
router.get('/:id', authenticateAdmin, requireAdmin, async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const { ObjectId } = require('mongodb');

        const product = await db.collection('products').findOne({ _id: new ObjectId(req.params.id) });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            product: mapProduct(product)
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product'
        });
    }
});

// POST /api/admin/products - Create new product
router.post('/', authenticateAdmin, requireAdmin, async (req, res) => {
    try {
        const productData = req.body;
        const db = mongoose.connection.db;

        // Generate slug from name
        const slug = productData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        const newProduct = {
            ...productData,
            slug,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('products').insertOne(newProduct);

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product: mapProduct({ ...newProduct, _id: result.insertedId })
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create product'
        });
    }
});

// PUT /api/admin/products/:id - Update product
router.put('/:id', authenticateAdmin, requireAdmin, async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const { ObjectId } = require('mongodb');

        const updateData = {
            ...req.body,
            updatedAt: new Date()
        };

        const result = await db.collection('products').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const updatedProduct = await db.collection('products').findOne({ _id: new ObjectId(req.params.id) });

        res.json({
            success: true,
            message: 'Product updated successfully',
            product: mapProduct(updatedProduct)
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product'
        });
    }
});

// DELETE /api/admin/products/:id - Delete product
router.delete('/:id', authenticateAdmin, requireAdmin, async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const { ObjectId } = require('mongodb');

        const result = await db.collection('products').deleteOne({ _id: new ObjectId(req.params.id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product'
        });
    }
});

module.exports = router;
