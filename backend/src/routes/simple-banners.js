const express = require('express');
const router = express.Router();
const Banner = require('../models/banner');

// GET /api/banners - Get banners by position
router.get('/', async (req, res) => {
    try {
        const { position, grouped } = req.query;

        if (position) {
            const activeBanners = await Banner.find({
                position: position,
                active: true
            }).sort({ order: 1, createdAt: -1 });

            if (!activeBanners || activeBanners.length === 0) {
                return res.json({
                    success: true,
                    message: 'No banners yet',
                    banners: []
                });
            }

            return res.json({
                success: true,
                banners: activeBanners
            });
        }

        const shouldGroup = grouped === undefined ? true : grouped === 'true';

        // If no position specified, return all active banners grouped by position
        const allBanners = await Banner.find({ active: true }).sort({ order: 1, createdAt: -1 });

        if (!allBanners || allBanners.length === 0) {
            return res.json({
                success: true,
                message: 'No banners yet',
                banners: shouldGroup ? {} : []
            });
        }

        if (!shouldGroup) {
            return res.json({
                success: true,
                banners: allBanners
            });
        }

        // Group banners by position
        const groupedBanners = {};
        allBanners.forEach(banner => {
            if (!groupedBanners[banner.position]) {
                groupedBanners[banner.position] = [];
            }
            groupedBanners[banner.position].push(banner);
        });

        res.json({
            success: true,
            banners: groupedBanners
        });
    } catch (error) {
        console.error('Error fetching banners:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch banners'
        });
    }
});

module.exports = router;
