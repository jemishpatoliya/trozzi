const express = require('express');
const router = express.Router();

// In-memory storage for demo (in production, use MongoDB)
let categories = [
    {
        _id: '1',
        name: 'Fashion',
        slug: 'fashion',
        description: 'Fashion and clothing items',
        imageUrl: 'https://serviceapi.spicezgold.com/download/1755610847575_file_1734525204708_fash.png',
        productCount: 45,
        active: true,
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        _id: '2',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and gadgets',
        imageUrl: 'https://serviceapi.spicezgold.com/download/1741660988059_ele.png',
        productCount: 32,
        active: true,
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

// GET /api/admin/categories - Get all categories
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;

        let filteredCategories = [...categories];

        if (search) {
            filteredCategories = filteredCategories.filter(c =>
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.description.toLowerCase().includes(search.toLowerCase())
            );
        }

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

        res.json({
            success: true,
            categories: paginatedCategories,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: filteredCategories.length,
                pages: Math.ceil(filteredCategories.length / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories'
        });
    }
});

// GET /api/admin/categories/:id - Get single category
router.get('/:id', async (req, res) => {
    try {
        const category = categories.find(c => c._id === req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category'
        });
    }
});

// POST /api/admin/categories - Create new category
router.post('/', async (req, res) => {
    try {
        const categoryData = req.body;

        // Generate slug from name
        const slug = categoryData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        const newCategory = {
            _id: Date.now().toString(),
            ...categoryData,
            slug,
            productCount: 0,
            active: true,
            order: categories.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        categories.push(newCategory);

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            category: newCategory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create category'
        });
    }
});

// PUT /api/admin/categories/:id - Update category
router.put('/:id', async (req, res) => {
    try {
        const index = categories.findIndex(c => c._id === req.params.id);

        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const updatedCategory = {
            ...categories[index],
            ...req.body,
            updatedAt: new Date().toISOString()
        };

        categories[index] = updatedCategory;

        res.json({
            success: true,
            message: 'Category updated successfully',
            category: updatedCategory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update category'
        });
    }
});

// DELETE /api/admin/categories/:id - Delete category
router.delete('/:id', async (req, res) => {
    try {
        const index = categories.findIndex(c => c._id === req.params.id);

        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        categories.splice(index, 1);

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete category'
        });
    }
});

module.exports = router;
