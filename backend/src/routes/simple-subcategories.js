const express = require('express');
const router = express.Router();

const { CategoryModel } = require('../models/category');
const { ProductModel } = require('../models/product');

// GET /api/subcategories?parentCategoryId=XXX - Get subcategories for a parent category
router.get('/', async (req, res) => {
    try {
        const mode = String(req.query?.mode ?? 'admin');
        const parentCategoryId = typeof req.query?.parentCategoryId === 'string' ? req.query.parentCategoryId : '';
        if (!parentCategoryId.trim()) {
            return res.status(400).json({ success: false, message: 'parentCategoryId is required' });
        }

        const filter = { parentId: parentCategoryId };
        if (mode === 'public') {
            filter.active = true;
        }

        const categories = await CategoryModel.find(filter).sort({ order: 1 }).lean();

        const subCategoryIds = categories.map((c) => String(c._id));
        const countById = new Map(subCategoryIds.map((id) => [id, 0]));

        if (subCategoryIds.length > 0) {
            const productFilter = {
                $or: [
                    { subCategoryId: { $in: subCategoryIds } },
                    { 'management.basic.subCategoryId': { $in: subCategoryIds } },
                ],
            };

            if (mode === 'public') {
                productFilter.status = 'active';
                productFilter.visibility = 'public';
            }

            const rows = await ProductModel.aggregate([
                { $match: productFilter },
                {
                    $project: {
                        subId: {
                            $cond: [
                                {
                                    $and: [
                                        { $ne: ['$subCategoryId', null] },
                                        { $ne: ['$subCategoryId', ''] },
                                    ],
                                },
                                '$subCategoryId',
                                '$management.basic.subCategoryId',
                            ],
                        },
                    },
                },
                { $group: { _id: '$subId', count: { $sum: 1 } } },
            ]);

            rows.forEach((r) => {
                const id = String(r?._id ?? '').trim();
                if (!id) return;
                if (!countById.has(id)) return;
                countById.set(id, Number(r?.count ?? 0) || 0);
            });
        }

        res.json(
            categories.map((c) => {
                const id = String(c._id);
                return {
                    id,
                    name: c.name,
                    shortDescription: c.shortDescription,
                    description: c.description,
                    parentId: c.parentId,
                    order: c.order,
                    active: c.active,
                    productCount: countById.get(id) ?? 0,
                    imageUrl: c.imageUrl,
                };
            })
        );
    } catch (error) {
        console.error('Failed to fetch subcategories:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch subcategories' });
    }
});

// POST /api/subcategories - Create a subcategory (parentId is required)
router.post('/', async (req, res) => {
    try {
        const name = String(req.body?.name ?? '').trim();
        if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

        const parentId = String(req.body?.parentId ?? '').trim();
        if (!parentId) return res.status(400).json({ success: false, message: 'parentId is required' });

        const created = await CategoryModel.create({
            name,
            shortDescription: String(req.body?.shortDescription ?? ''),
            description: String(req.body?.description ?? ''),
            parentId,
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
        console.error('Failed to create subcategory:', error);
        res.status(500).json({ success: false, message: 'Failed to create subcategory' });
    }
});

// PUT /api/subcategories/:id - Update a subcategory (parentId is required)
router.put('/:id', async (req, res) => {
    try {
        const name = String(req.body?.name ?? '').trim();
        if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

        const parentId = String(req.body?.parentId ?? '').trim();
        if (!parentId) return res.status(400).json({ success: false, message: 'parentId is required' });

        const updated = await CategoryModel.findByIdAndUpdate(
            req.params.id,
            {
                name,
                shortDescription: String(req.body?.shortDescription ?? ''),
                description: String(req.body?.description ?? ''),
                parentId,
                order: Number.isFinite(req.body?.order) ? req.body.order : Number(req.body?.order ?? 0),
                active: typeof req.body?.active === 'boolean' ? req.body.active : req.body?.active !== 'false',
                imageUrl: String(req.body?.imageUrl ?? ''),
            },
            { new: true }
        ).lean();

        if (!updated) return res.status(404).json({ success: false, message: 'Subcategory not found' });

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
        console.error('Failed to update subcategory:', error);
        res.status(500).json({ success: false, message: 'Failed to update subcategory' });
    }
});

// DELETE /api/subcategories/:id - Delete a subcategory (cannot delete if it has children)
router.delete('/:id', async (req, res) => {
    try {
        const child = await CategoryModel.findOne({ parentId: req.params.id }).lean();
        if (child) return res.status(400).json({ success: false, message: 'Cannot delete a category that has children' });

        const deleted = await CategoryModel.findByIdAndDelete(req.params.id).lean();
        if (!deleted) return res.status(404).json({ success: false, message: 'Subcategory not found' });

        res.json({ ok: true });
    } catch (error) {
        console.error('Failed to delete subcategory:', error);
        res.status(500).json({ success: false, message: 'Failed to delete subcategory' });
    }
});

module.exports = router;
