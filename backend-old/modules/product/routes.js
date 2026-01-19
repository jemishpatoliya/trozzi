const express = require('express');
const { ProductModel } = require('../../models/Product');
const { auth, authorize } = require('../../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            mode = 'public',
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
        } = req.query;

        const query = {};

        if (mode === 'public') {
            query.visibility = 'public';
            query.status = 'active';
        }

        if (category) {
            query.category = category;
        }

        if (featured !== undefined) {
            query.featured = featured === 'true';
        }

        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { tags: { $in: [new RegExp(q, 'i')] } }
            ];
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};
            if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
            if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
        }

        if (inStock !== undefined) {
            query.stock = inStock === 'true' ? { $gt: 0 } : { $eq: 0 };
        }

        if (onSale !== undefined) {
            query.saleEnabled = onSale === 'true';
        }

        if (freeShipping !== undefined) {
            query.freeShipping = freeShipping === 'true';
        }

        if (rating !== undefined) {
            query.rating = { $gte: parseFloat(rating) };
        }

        if (sizes) {
            const sizeArray = sizes.split(',');
            query.sizes = { $in: sizeArray };
        }

        if (colors) {
            const colorArray = colors.split(',');
            query.colors = { $in: colorArray };
        }

        if (brands) {
            const brandArray = brands.split(',');
            query.brand = { $in: brandArray };
        }

        const sortOptions = {};
        if (sort) {
            sortOptions[sort] = order === 'desc' ? -1 : 1;
        } else {
            sortOptions.createdAt = -1;
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const products = await ProductModel.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .lean();

        const total = await ProductModel.countDocuments(query);

        res.json({
            success: true,
            data: products,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { mode = 'public' } = req.query;

        const query = { _id: id };
        
        if (mode === 'public') {
            query.visibility = 'public';
            query.status = 'active';
        }

        const product = await ProductModel.findOne(query);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
});

router.get('/slug/:slug', async (req, res, next) => {
    try {
        const { slug } = req.params;
        const { mode = 'public' } = req.query;

        const query = { slug };
        
        if (mode === 'public') {
            query.visibility = 'public';
            query.status = 'active';
        }

        const product = await ProductModel.findOne(query);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
});

router.post('/', auth, authorize('admin'), async (req, res, next) => {
    try {
        const productData = {
            ...req.body,
            createdAt: new Date().toISOString().split('T')[0]
        };

        const product = new ProductModel(productData);
        await product.save();

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        next(error);
    }
});

router.put('/:id', auth, authorize('admin'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await ProductModel.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', auth, authorize('admin'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await ProductModel.findByIdAndDelete(id);

        if (!product) {
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
        next(error);
    }
});

module.exports = router;
