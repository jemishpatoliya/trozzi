const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// GET /api/admin/categories - Get all categories
router.get('/', async (req, res) => {
    try {
        console.log('Fetching categories from database...');
        const db = mongoose.connection.db;
        const categories = await db.collection('categories').find({}).sort({ order: 1 }).toArray();
        console.log('Found categories:', categories.length);
        const result = categories.map((c) => ({
            id: String(c._id),
            name: c.name,
            shortDescription: c.shortDescription,
            description: c.description,
            parentId: c.parentId,
            order: c.order,
            active: c.active,
            productCount: c.productCount,
            imageUrl: c.imageUrl,
        }));
        console.log('Returning categories:', result.length);
        res.json(result);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Failed to fetch categories' });
    }
});

// POST /api/admin/categories - Create new category
router.post('/', async (req, res) => {
    try {
        const categoryData = req.body;
        const db = mongoose.connection.db;

        const newCategory = {
            name: categoryData.name,
            shortDescription: categoryData.shortDescription || "",
            description: categoryData.description || "",
            parentId: categoryData.parentId || null,
            order: categoryData.order || 0,
            active: categoryData.active !== undefined ? categoryData.active : true,
            imageUrl: categoryData.imageUrl || "",
            productCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('categories').insertOne(newCategory);

        res.status(201).json({
            id: String(result.insertedId),
            name: newCategory.name,
            shortDescription: newCategory.shortDescription,
            description: newCategory.description,
            parentId: newCategory.parentId,
            order: newCategory.order,
            active: newCategory.active,
            productCount: newCategory.productCount,
            imageUrl: newCategory.imageUrl,
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Failed to create category' });
    }
});

// PUT /api/admin/categories/:id - Update category
router.put('/:id', async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const { ObjectId } = require('mongodb');

        const updateData = {
            name: req.body.name,
            shortDescription: req.body.shortDescription,
            description: req.body.description,
            parentId: req.body.parentId,
            order: req.body.order,
            active: req.body.active,
            imageUrl: req.body.imageUrl,
            updatedAt: new Date()
        };

        const result = await db.collection('categories').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) return res.status(404).json({ message: 'Category not found' });

        const updated = await db.collection('categories').findOne({ _id: new ObjectId(req.params.id) });

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
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Failed to update category' });
    }
});

// DELETE /api/admin/categories/:id - Delete category
router.delete('/:id', async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const { ObjectId } = require('mongodb');

        const child = await db.collection('categories').findOne({ parentId: req.params.id });
        if (child) return res.status(400).json({ message: 'Cannot delete a category that has children' });

        const result = await db.collection('categories').deleteOne({ _id: new ObjectId(req.params.id) });
        if (result.deletedCount === 0) return res.status(404).json({ message: 'Category not found' });

        res.json({ ok: true });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Failed to delete category' });
    }
});

module.exports = router;
