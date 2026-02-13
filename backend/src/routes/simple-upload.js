const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { authenticateAdmin, requireAdmin } = require('../middleware/adminAuth');

const AWS_REGION = process.env.AWS_REGION;
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;

const s3 = new S3Client({ region: AWS_REGION });

const UploadSchema = new mongoose.Schema(
    {
        key: { type: String, required: true },
        url: { type: String, required: true },
        bucket: { type: String, required: true },
        region: { type: String, required: true },
        contentType: { type: String, default: '' },
        size: { type: Number, default: 0 },
        originalName: { type: String, default: '' },
    },
    { timestamps: true }
);

const Upload = mongoose.models.Upload || mongoose.model('Upload', UploadSchema);

router.get('/list', authenticateAdmin, requireAdmin, async (req, res) => {
    try {
        const folder = String(req.query?.folder ?? '').trim();
        const folderSafe = folder && /^[a-zA-Z0-9_-]+$/.test(folder) ? folder : '';

        const filter = folderSafe ? { key: new RegExp(`^uploads/${folderSafe}/`) } : {};

        const docs = await Upload.find(filter)
            .sort({ createdAt: -1 })
            .limit(500)
            .lean();

        res.json(
            docs.map((d) => {
                const key = String(d.key ?? '');
                const parts = key.split('/');
                const derivedFolder = parts.length >= 2 && parts[0] === 'uploads' ? parts[1] : '';
                return {
                    id: String(d._id),
                    key,
                    url: d.url,
                    contentType: d.contentType || '',
                    size: Number(d.size || 0),
                    originalName: d.originalName || '',
                    createdAt: d.createdAt,
                    folder: derivedFolder,
                };
            })
        );
    } catch (error) {
        console.error('List uploads error:', error);
        res.status(500).json({ success: false, message: 'Failed to list uploads' });
    }
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

router.post('/admin-image', authenticateAdmin, requireAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!AWS_REGION || !AWS_S3_BUCKET) {
            return res.status(500).json({
                success: false,
                message: 'Missing AWS configuration (AWS_REGION, AWS_S3_BUCKET)'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const ext = (req.file.originalname || '').split('.').pop() || 'bin';
        const random = crypto.randomBytes(12).toString('hex');
        const folder = String(req.query?.folder ?? '').trim();
        const folderSafe = folder && /^[a-zA-Z0-9_-]+$/.test(folder) ? folder : 'misc';
        const key = `uploads/${folderSafe}/${Date.now()}-${random}.${ext}`;

        await s3.send(
            new PutObjectCommand({
                Bucket: AWS_S3_BUCKET,
                Key: key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            })
        );

        const imageUrl = `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;

        const saved = await Upload.create({
            key,
            url: imageUrl,
            bucket: AWS_S3_BUCKET,
            region: AWS_REGION,
            contentType: req.file.mimetype,
            size: req.file.size,
            originalName: req.file.originalname,
        });

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            id: String(saved._id),
            key: saved.key,
            url: saved.url,
            bucket: saved.bucket,
            region: saved.region,
            originalname: saved.originalName,
            size: saved.size,
            contentType: saved.contentType,
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image: ' + error.message
        });
    }
});

// POST /api/upload/image - Upload image
router.post('/image', upload.single('image'), async (req, res) => {
    try {
        if (!AWS_REGION || !AWS_S3_BUCKET) {
            return res.status(500).json({
                success: false,
                message: 'Missing AWS configuration (AWS_REGION, AWS_S3_BUCKET)'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const ext = (req.file.originalname || '').split('.').pop() || 'bin';
        const random = crypto.randomBytes(12).toString('hex');
        const folder = String(req.query?.folder ?? '').trim();
        const folderSafe = folder && /^[a-zA-Z0-9_-]+$/.test(folder) ? folder : 'misc';
        const key = `uploads/${folderSafe}/${Date.now()}-${random}.${ext}`;

        await s3.send(
            new PutObjectCommand({
                Bucket: AWS_S3_BUCKET,
                Key: key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            })
        );

        const imageUrl = `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;

        const saved = await Upload.create({
            key,
            url: imageUrl,
            bucket: AWS_S3_BUCKET,
            region: AWS_REGION,
            contentType: req.file.mimetype,
            size: req.file.size,
            originalName: req.file.originalname,
        });

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            id: String(saved._id),
            key: saved.key,
            url: saved.url,
            bucket: saved.bucket,
            region: saved.region,
            originalname: saved.originalName,
            size: saved.size,
            contentType: saved.contentType,
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image: ' + error.message
        });
    }
});

// GET /api/uploads/:filename - Serve uploaded files
router.get('/uploads/:filename', (req, res) => {
    res.status(410).json({
        success: false,
        message: 'Local file serving is disabled. Use the returned S3 url/key.'
    });
});

module.exports = router;
