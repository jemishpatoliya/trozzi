const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import routes
const reviewsRouter = require('./src/routes/simple-reviews');
const productsRouter = require('./src/routes/simple-products');
const categoriesRouter = require('./src/routes/simple-categories');
const subCategoriesRouter = require('./src/routes/simple-subcategories');
const bannersRouter = require('./src/routes/simple-banners');
const uploadRouter = require('./src/routes/simple-upload');
const adminProductsRouter = require('./src/routes/admin-products');
const adminCategoriesRouter = require('./src/routes/admin-categories');
const adminBannersRouter = require('./src/routes/admin-banners');
const adminDashboardRouter = require('./src/routes/admin-dashboard');
const adminUsersRouter = require('./src/routes/admin-users');
const authRouter = require('./src/routes/auth');
const adminAuthRouter = require('./src/routes/adminAuth');
const userAuthRouter = require('./src/routes/userAuth');
const wishlistRouter = require('./src/routes/wishlist');
const cartRouter = require('./src/routes/cart');
const paymentsRouter = require('./src/routes/payments');
const ordersRouter = require('./src/routes/simple-orders');
const productDetailsRouter = require('./src/routes/product-details');
const adminReviewsRouter = require('./src/routes/admin-reviews');
const adminContentSettingsRouter = require('./src/routes/admin-content-settings');
const contentSettingsRouter = require('./src/routes/content-settings');
const sizeGuidesRouter = require('./src/routes/size-guides');
const shiprocketWebhookRouter = require('./src/routes/shiprocket-webhook');
const adminOverridesRouter = require('./src/routes/adminOverrides');
const notificationsRouter = require('./src/routes/notifications');

const { AdminModel } = require('./src/models/admin');
const { UserModel } = require('./src/models/user');

const app = express();
const BASE_PORT = Number(process.env.PORT || 5050);

let isDbConnected = false;

mongoose.connection.on('connected', () => {
  isDbConnected = true;
});

mongoose.connection.on('disconnected', () => {
  isDbConnected = false;
});

mongoose.connection.on('error', () => {
  isDbConnected = false;
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 2000, // higher limit in dev to avoid 429 during admin actions
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors());
// app.options('*', cors(corsOptions));
app.use(limiter);

// Shiprocket webhooks need raw body for signature verification.
app.use('/api/shipping/webhook/shiprocket', express.raw({ type: 'application/json' }), shiprocketWebhookRouter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api/admin', adminOverridesRouter);
app.use('/api/orders', ordersRouter);
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use((req, res, next) => {
  if (req.path === '/api/health') return next();
  if (req.method === 'OPTIONS') return next();
  if (isDbConnected) return next();
  return res.status(503).json({
    success: false,
    message: 'Database not connected. Please try again in a moment.',
  });
});

// Routes
app.use('/api/reviews', reviewsRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/subcategories', subCategoriesRouter);
app.use('/api/banners', bannersRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/product-details', productDetailsRouter);
app.use('/api/admin/reviews', adminReviewsRouter);
app.use('/api/admin/products', adminProductsRouter);
app.use('/api/admin/categories', adminCategoriesRouter);
app.use('/api/admin/banners', adminBannersRouter);
app.use('/api/admin/users', adminUsersRouter);
app.use('/api/admin/content-settings', adminContentSettingsRouter);
app.use('/api/admin', adminDashboardRouter);
app.use('/api/auth/admin', adminAuthRouter);
app.use('/api/auth/user', userAuthRouter);
app.use('/api/auth', authRouter); // Keep for backward compatibility
app.use('/api/content-settings', contentSettingsRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/cart', cartRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/size-guides', sizeGuidesRouter);
app.use('/api/notifications', notificationsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'TROZZY Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// MongoDB connection
let activePort = BASE_PORT;

const startServer = (port, attempt = 0) => {
  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  app.set('io', io);

  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

  io.use(async (socket, next) => {
    try {
      const token = socket?.handshake?.auth?.token || socket?.handshake?.query?.token;
      if (!token) return next();

      const decoded = jwt.verify(String(token), JWT_SECRET);
      const id = decoded && (decoded.id || decoded.userId);
      const type = decoded && decoded.type;

      if (!id) return next();

      socket.data.auth = { id: String(id), type: String(type || '') };
      return next();
    } catch (_e) {
      return next();
    }
  });

  io.on('connection', async (socket) => {
    try {
      const auth = socket.data.auth;
      if (!auth?.id) return;

      if (auth.type === 'admin') {
        const admin = await AdminModel.findById(auth.id);
        if (admin && admin.active && admin.role === 'admin') {
          socket.join('admin');
        }
        return;
      }

      if (auth.type === 'user') {
        const user = await UserModel.findById(auth.id);
        if (user && user.active) {
          socket.join(`user:${String(user._id)}`);
          socket.join(`user_${String(user._id)}`);
          const email = String(user.email || '').toLowerCase();
          if (email) socket.join(`user_email:${email}`);
        }
      }
    } catch (_e) {
      // ignore
    }
  });

  const server = httpServer.listen(port, '0.0.0.0', () => {
    activePort = port;
    console.log(`🚀 TROZZY Backend Server running on port ${port}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      if (attempt >= 20) {
        console.error(
          `\n❌ Could not find a free port starting from ${BASE_PORT}.\n` +
            `Stop the process using that port range or set a custom PORT.\n` +
            `Example (PowerShell): $env:PORT=6000; npm run dev\n`,
        );
        return;
      }

      const nextPort = port + 1;
      console.error(
        `\n❌ Port ${port} is already in use. Trying ${nextPort}...\n`,
      );

      try {
        server.close(() => startServer(nextPort, attempt + 1));
      } catch (_e) {
        startServer(nextPort, attempt + 1);
      }
      return;
    }

    console.error('❌ Server error:', err);
  });
};

startServer(BASE_PORT);

const mongoUri = process.env.MONGODB_URI;

const connectWithRetry = async () => {
  if (!mongoUri) {
    console.error('❌ Missing MONGODB_URI. Create a .env file (copy from .env.example) and set MONGODB_URI.');
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isDbConnected = true;
    console.log('✅ MongoDB Atlas Connected');
  } catch (error) {
    isDbConnected = false;
    console.error('❌ MongoDB connection error:', error);
    console.error('⏳ Retrying MongoDB connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

connectWithRetry();

// Cron: retry failed Shiprocket shipments every 5 minutes
const cron = require('node-cron');
cron.schedule('*/5 * * * *', async () => {
  try {
    const { retryFailedShipments } = require('./src/workers/shipmentRetryWorker');
    await retryFailedShipments();
  } catch (e) {
    console.error('Cron retry error:', e);
  }
});

module.exports = app;
