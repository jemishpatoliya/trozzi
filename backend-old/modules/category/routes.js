const express = require('express');
const { CategoryModel } = require('../../models/Category');
const { auth, authorize } = require('../../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const { active = true } = req.query;
        
        const query = {};
        if (active !== 'all') {
            query.active = active === 'true';
        }

        const categories = await CategoryModel.find(query)
            .sort({ order: 1, name: 1 })
            .lean();

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const category = await CategoryModel.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        next(error);
    }
});

router.post('/', auth, authorize('admin'), async (req, res, next) => {
    try {
        const category = new CategoryModel(req.body);
        await category.save();

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        next(error);
    }
});

router.put('/:id', auth, authorize('admin'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const category = await CategoryModel.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', auth, authorize('admin'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const category = await CategoryModel.findByIdAndDelete(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
