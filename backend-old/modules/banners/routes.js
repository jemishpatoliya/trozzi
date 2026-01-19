const express = require('express');
const { BannerModel } = require('../../models/Banner');
const { auth, authorize } = require('../../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const { position, active = true } = req.query;

        const query = {};
        
        if (position) {
            query.position = position;
        }
        
        if (active !== 'all') {
            query.active = active === 'true';
        }

        const banners = await BannerModel.find(query)
            .sort({ order: 1, createdAt: -1 })
            .lean();

        res.json({
            success: true,
            data: banners
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const banner = await BannerModel.findById(id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        res.json({
            success: true,
            data: banner
        });
    } catch (error) {
        next(error);
    }
});

router.post('/', auth, authorize('admin'), async (req, res, next) => {
    try {
        const { title, image, link, position, active = true, order = 0 } = req.body;

        if (!title || !image || !position) {
            return res.status(400).json({
                success: false,
                error: 'Title, image, and position are required'
            });
        }

        const validPositions = ['home', 'category', 'product'];
        if (!validPositions.includes(position)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid position. Must be home, category, or product'
            });
        }

        const banner = new BannerModel({
            title,
            image,
            link,
            position,
            active,
            order
        });

        await banner.save();

        res.status(201).json({
            success: true,
            message: 'Banner created successfully',
            data: banner
        });
    } catch (error) {
        next(error);
    }
});

router.put('/:id', auth, authorize('admin'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const banner = await BannerModel.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        res.json({
            success: true,
            message: 'Banner updated successfully',
            data: banner
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', auth, authorize('admin'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const banner = await BannerModel.findByIdAndDelete(id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        res.json({
            success: true,
            message: 'Banner deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
