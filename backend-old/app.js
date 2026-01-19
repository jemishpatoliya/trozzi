require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./modules/auth/routes');
const productRoutes = require('./modules/product/routes');
const categoryRoutes = require('./modules/category/routes');
const cartRoutes = require('./modules/cart/routes');
const paymentRoutes = require('./modules/payment/routes');
const orderRoutes = require('./modules/order/routes');
const reviewRoutes = require('./modules/review/routes');
const bannerRoutes = require('./modules/banners/routes');

const app = express();

connectDB();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/banners', bannerRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'TROZZY Backend API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.use(errorHandler);

module.exports = app;
