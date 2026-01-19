import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
const categoriesUploadDir = path.join(uploadsDir, 'categories');

// Create upload directories if they don't exist
const ensureUploadDirectories = () => {
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Created uploads directory:', uploadsDir);
    }
    
    if (!fs.existsSync(categoriesUploadDir)) {
      fs.mkdirSync(categoriesUploadDir, { recursive: true });
      console.log('Created categories upload directory:', categoriesUploadDir);
    }
  } catch (error) {
    console.error('Error creating upload directories:', error);
  }
};

// Initialize directories on module load
ensureUploadDirectories();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure categories directory exists before saving
    if (!fs.existsSync(categoriesUploadDir)) {
      fs.mkdirSync(categoriesUploadDir, { recursive: true });
    }
    cb(null, categoriesUploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `category-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'];
  
  const mimeType = file.mimetype.toLowerCase();
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(mimeType) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// POST /api/upload/image - Upload category image
router.post('/image', upload.single('image'), (req, res) => {
  try {
    // Double-check directory exists before processing
    if (!fs.existsSync(categoriesUploadDir)) {
      fs.mkdirSync(categoriesUploadDir, { recursive: true });
      console.log('Created categories directory on upload:', categoriesUploadDir);
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the URL that can be used to access the uploaded file
    const imageUrl = `/uploads/categories/${req.file.filename}`;
    
    console.log('Image uploaded successfully:', {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
    
    res.json({
      success: true,
      url: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Error handling middleware for multer
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
});

export default router;
