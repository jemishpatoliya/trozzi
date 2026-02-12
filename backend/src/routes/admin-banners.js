const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const Banner = require('../models/banner');

const { authenticateAdmin, requireAdmin } = require('../middleware/adminAuth');

const AWS_REGION = process.env.AWS_REGION;
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;

const s3 = new S3Client({ region: AWS_REGION });

router.use(authenticateAdmin, requireAdmin);

// POST /api/admin/banners/json - Create new banner via JSON (no multipart/form-data required)
router.post('/json', async (req, res) => {
    try {
        const { title, subtitle, link, position, active, order, image } = req.body || {};

        if (!title || !position) {
            return res.status(400).json({
                success: false,
                message: 'Title and position are required'
            });
        }

        if (!image) {
            return res.status(400).json({
                success: false,
                message: 'Image is required (provide image URL or /uploads path)'
            });
        }

        const newBanner = new Banner({
            title,
            subtitle: subtitle || '',
            image: String(image),
            link: link || '',
            position,
            active: active !== undefined ? Boolean(active) : true,
            order: order !== undefined ? parseInt(order, 10) : 0,
        });

        await newBanner.save();

        res.status(201).json({
            success: true,
            message: 'Banner created successfully',
            banner: newBanner
        });
    } catch (error) {
        console.error('Error creating banner (json):', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create banner: ' + error.message
        });
    }
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit for banners
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

async function uploadBannerToS3(file) {
    if (!AWS_REGION || !AWS_S3_BUCKET) {
        throw new Error('Missing AWS configuration (AWS_REGION, AWS_S3_BUCKET)');
    }

    const ext = (file.originalname || '').split('.').pop() || 'bin';
    const random = crypto.randomBytes(12).toString('hex');
    const key = `uploads/banners/${Date.now()}-${random}.${ext}`;

    await s3.send(
        new PutObjectCommand({
            Bucket: AWS_S3_BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        })
    );

    return {
        key,
        url: `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`,
    };
}

// GET /api/admin/banners - Get all banners
router.get('/', async (req, res) => {
    try {
        const { position, active, grouped } = req.query;
        let filter = {};

        if (position) {
            filter.position = position;
        }

        if (active !== undefined) {
            filter.active = active === 'true';
        }

        const banners = await Banner.find(filter).sort({ order: 1, createdAt: -1 });

        const shouldGroup = grouped === 'true';

        if (shouldGroup && !position) {
            const groupedBanners = {};
            banners.forEach(banner => {
                if (!groupedBanners[banner.position]) {
                    groupedBanners[banner.position] = [];
                }
                groupedBanners[banner.position].push(banner);
            });

            return res.json({
                success: true,
                banners: groupedBanners
            });
        }

        res.json({
            success: true,
            banners: banners
        });
    } catch (error) {
        console.error('Error fetching banners:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch banners'
        });
    }
});

// GET /api/admin/banners/:id - Get single banner
router.get('/:id', async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        res.json({
            success: true,
            banner: banner
        });
    } catch (error) {
        console.error('Error fetching banner:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch banner'
        });
    }
});

// POST /api/admin/banners - Create new banner with image upload
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { title, subtitle, link, position, active, order } = req.body;

        if (!title || !position) {
            return res.status(400).json({
                success: false,
                message: 'Title and position are required'
            });
        }

        let imageUrl = req.body.image; // For external URLs

        if (req.file) {
            const s3Obj = await uploadBannerToS3(req.file);
            imageUrl = s3Obj.url;
        }

        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Image is required (either upload file or provide URL)'
            });
        }

        const newBanner = new Banner({
            title,
            subtitle: subtitle || '',
            image: imageUrl,
            link: link || '',
            position,
            active: active !== undefined ? active === 'true' : true,
            order: order ? parseInt(order) : 0
        });

        await newBanner.save();

        res.status(201).json({
            success: true,
            message: 'Banner created successfully',
            banner: newBanner
        });
    } catch (error) {
        console.error('Error creating banner:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create banner: ' + error.message
        });
    }
});

// PUT /api/admin/banners/:id - Update banner
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        const { title, subtitle, link, position, active, order } = req.body;

        // Update fields
        if (title !== undefined) banner.title = title;
        if (subtitle !== undefined) banner.subtitle = subtitle;
        if (link !== undefined) banner.link = link;
        if (position !== undefined) banner.position = position;
        if (active !== undefined) banner.active = active === 'true';
        if (order !== undefined) banner.order = parseInt(order);

        if (req.file) {
            const s3Obj = await uploadBannerToS3(req.file);
            banner.image = s3Obj.url;
        } else if (req.body.image && req.body.image !== banner.image) {
            // If external image URL was provided
            banner.image = req.body.image;
        }

        banner.updatedAt = new Date();
        await banner.save();

        res.json({
            success: true,
            message: 'Banner updated successfully',
            banner: banner
        });
    } catch (error) {
        console.error('Error updating banner:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update banner: ' + error.message
        });
    }
});

// PUT /api/admin/banners/:id/json - Update banner via JSON (no multipart/form-data required)
router.put('/:id/json', async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        const { title, subtitle, link, position, active, order, image } = req.body || {};

        if (title !== undefined) banner.title = title;
        if (subtitle !== undefined) banner.subtitle = subtitle;
        if (link !== undefined) banner.link = link;
        if (position !== undefined) banner.position = position;
        if (active !== undefined) banner.active = Boolean(active);
        if (order !== undefined) banner.order = parseInt(order, 10);
        if (image !== undefined) banner.image = String(image);

        banner.updatedAt = new Date();
        await banner.save();

        res.json({
            success: true,
            message: 'Banner updated successfully',
            banner: banner
        });
    } catch (error) {
        console.error('Error updating banner (json):', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update banner: ' + error.message
        });
    }
});

// DELETE /api/admin/banners/:id - Delete banner
router.delete('/:id', async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        await Banner.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Banner deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting banner:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete banner: ' + error.message
        });
    }
});

// PUT /api/admin/banners/:id/toggle - Toggle banner active status
router.put('/:id/toggle', async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        banner.active = !banner.active;
        banner.updatedAt = new Date();
        await banner.save();

        res.json({
            success: true,
            message: 'Banner status updated successfully',
            banner: banner
        });
    } catch (error) {
        console.error('Error updating banner status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update banner status: ' + error.message
        });
    }
});

// POST /api/admin/banners/upload - Upload banner image separately
router.post('/upload', authenticateAdmin, requireAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const s3Obj = await uploadBannerToS3(req.file);

        res.json({
            success: true,
            message: 'Banner image uploaded successfully',
            url: s3Obj.url,
            key: s3Obj.key,
            originalname: req.file.originalname,
            size: req.file.size
        });
    } catch (error) {
        console.error('Banner upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload banner image: ' + error.message
        });
    }
});

module.exports = router;
