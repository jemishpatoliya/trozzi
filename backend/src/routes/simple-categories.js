const express = require('express');
const router = express.Router();

const { CategoryModel } = require('../models/category');
const { ProductModel } = require('../models/product');

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
    try {
        const mode = String(req.query?.mode ?? 'admin');
        const parentId = typeof req.query?.parentId === 'string' ? req.query.parentId : undefined;
        const filter = parentId !== undefined ? { parentId } : {};
        if (mode === 'public') {
            filter.active = true;
        }
        const categories = await CategoryModel.find(filter).sort({ order: 1 }).lean();

        const categoryIds = categories.map((c) => String(c._id));
        const countById = new Map(categoryIds.map((id) => [id, 0]));

        await Promise.all(
            categoryIds.map(async (id) => {
                const productFilter = {
                    $or: [
                        { category: id },
                        { categoryId: id },
                        { 'management.basic.categoryIds': id },
                    ],
                };

                if (mode === 'public') {
                    productFilter.status = 'active';
                    productFilter.visibility = 'public';
                }

                const count = await ProductModel.countDocuments(productFilter);
                countById.set(id, Number(count ?? 0) || 0);
            })
        );

        res.json(
            categories.map((c) => ({
                id: String(c._id),
                name: c.name,
                shortDescription: c.shortDescription,
                description: c.description,
                parentId: c.parentId,
                order: c.order,
                active: c.active,
                productCount: countById.get(String(c._id)) ?? c.productCount,
                imageUrl: c.imageUrl,
            }))
        );
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
});

// GET /api/categories/:id - Get single category
router.get('/:id', async (req, res) => {
    try {
        const category = await CategoryModel.findById(req.params.id).lean();
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        res.json({
            id: String(category._id),
            name: category.name,
            shortDescription: category.shortDescription,
            description: category.description,
            parentId: category.parentId,
            order: category.order,
            active: category.active,
            productCount: category.productCount,
            imageUrl: category.imageUrl,
        });
    } catch (error) {
        console.error('Failed to fetch category:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch category' });
    }
});

router.post('/', async (req, res) => {
    try {
        const name = String(req.body?.name ?? '').trim();
        if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

        const created = await CategoryModel.create({
            name,
            shortDescription: String(req.body?.shortDescription ?? ''),
            description: String(req.body?.description ?? ''),
            parentId: req.body?.parentId ?? null,
            order: Number.isFinite(req.body?.order) ? req.body.order : Number(req.body?.order ?? 0),
            active: typeof req.body?.active === 'boolean' ? req.body.active : req.body?.active !== 'false',
            imageUrl: String(req.body?.imageUrl ?? ''),
            productCount: 0,
        });

        res.status(201).json({
            id: String(created._id),
            name: created.name,
            shortDescription: created.shortDescription,
            description: created.description,
            parentId: created.parentId,
            order: created.order,
            active: created.active,
            productCount: created.productCount,
            imageUrl: created.imageUrl,
        });
    } catch (error) {
        console.error('Failed to create category:', error);
        res.status(500).json({ success: false, message: 'Failed to create category' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const name = String(req.body?.name ?? '').trim();
        if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

        const updated = await CategoryModel.findByIdAndUpdate(
            req.params.id,
            {
                name,
                shortDescription: String(req.body?.shortDescription ?? ''),
                description: String(req.body?.description ?? ''),
                parentId: req.body?.parentId ?? null,
                order: Number.isFinite(req.body?.order) ? req.body.order : Number(req.body?.order ?? 0),
                active: typeof req.body?.active === 'boolean' ? req.body.active : req.body?.active !== 'false',
                imageUrl: String(req.body?.imageUrl ?? ''),
            },
            { new: true }
        ).lean();

        if (!updated) return res.status(404).json({ success: false, message: 'Category not found' });

        res.json({
            id: String(updated._id),
            name: updated.name,
            shortDescription: updated.shortDescription,
            description: updated.description,
            parentId: updated.parentId,
            order: updated.order,
            active: updated.active,
            productCount: updated.productCount,
            imageUrl: updated.imageUrl,
        });
    } catch (error) {
        console.error('Failed to update category:', error);
        res.status(500).json({ success: false, message: 'Failed to update category' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const child = await CategoryModel.findOne({ parentId: req.params.id }).lean();
        if (child) return res.status(400).json({ success: false, message: 'Cannot delete a category that has children' });

        const deleted = await CategoryModel.findByIdAndDelete(req.params.id).lean();
        if (!deleted) return res.status(404).json({ success: false, message: 'Category not found' });

        res.json({ ok: true });
    } catch (error) {
        console.error('Failed to delete category:', error);
        res.status(500).json({ success: false, message: 'Failed to delete category' });
    }
});

module.exports = router;
