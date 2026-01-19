const express = require('express');
const router = express.Router();

// Mock database models - replace with actual models
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Review = require('../models/Review');
const Analytics = require('../models/Analytics');

// Helper function to calculate date ranges
function getDateRange(period) {
    const now = new Date();
    let startDate, previousStartDate;

    switch (period) {
        case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
            break;
        case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    }

    return { startDate, previousStartDate, endDate: now };
}

// Helper function to calculate growth percentage
function calculateGrowth(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
}

// GET /api/admin/dashboard/stats - Top level stats
router.get('/stats', async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const { startDate, previousStartDate, endDate } = getDateRange(period);

        // Get current period stats
        const [
            totalProducts,
            currentOrders,
            currentRevenue,
            totalCustomers,
            reviewStats
        ] = await Promise.all([
            Product.countDocuments({ isActive: true }),
            Order.countDocuments({ 
                createdAt: { $gte: startDate, $lte: endDate },
                status: { $ne: 'cancelled' }
            }),
            Order.aggregate([
                { $match: { 
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $ne: 'cancelled' }
                }},
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            User.countDocuments({ role: 'customer' }),
            Review.aggregate([
                { $group: { 
                    _id: null, 
                    totalReviews: { $sum: 1 },
                    averageRating: { $avg: '$rating' }
                }}
            ])
        ]);

        // Get previous period stats for growth calculation
        const [previousOrders, previousRevenue] = await Promise.all([
            Order.countDocuments({ 
                createdAt: { $gte: previousStartDate, $lt: startDate },
                status: { $ne: 'cancelled' }
            }),
            Order.aggregate([
                { $match: { 
                    createdAt: { $gte: previousStartDate, $lt: startDate },
                    status: { $ne: 'cancelled' }
                }},
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ])
        ]);

        const revenue = currentRevenue[0]?.total || 0;
        const previousRevenueAmount = previousRevenue[0]?.total || 0;

        const stats = {
            totalProducts,
            totalOrders: currentOrders,
            revenue,
            customers: totalCustomers,
            growth: {
                orders: calculateGrowth(currentOrders, previousOrders),
                revenue: calculateGrowth(revenue, previousRevenueAmount),
                customers: 0 // Would need previous customer count for accurate growth
            },
            reviewStats: {
                totalReviews: reviewStats[0]?.totalReviews || 0,
                averageRating: reviewStats[0]?.averageRating || 0
            }
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard stats',
            data: {
                totalProducts: 0,
                totalOrders: 0,
                revenue: 0,
                customers: 0,
                growth: { orders: 0, revenue: 0, customers: 0 },
                reviewStats: { totalReviews: 0, averageRating: 0 }
            }
        });
    }
});

// GET /api/admin/dashboard/analytics - Analytics metrics
router.get('/analytics', async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const { startDate, endDate } = getDateRange(period);

        // Get analytics data
        const [
            totalSessions,
            bouncedSessions,
            totalSessionTime,
            conversionData
        ] = await Promise.all([
            Analytics.countDocuments({ 
                type: 'session',
                timestamp: { $gte: startDate, $lte: endDate }
            }),
            Analytics.countDocuments({ 
                type: 'session',
                timestamp: { $gte: startDate, $lte: endDate },
                bounced: true
            }),
            Analytics.aggregate([
                { $match: { 
                    type: 'session',
                    timestamp: { $gte: startDate, $lte: endDate }
                }},
                { $group: { _id: null, totalTime: { $sum: '$duration' } } }
            ]),
            Promise.all([
                Order.countDocuments({ 
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $ne: 'cancelled' }
                }),
                Analytics.countDocuments({ 
                    type: 'session',
                    timestamp: { $gte: startDate, $lte: endDate }
                })
            ])
        ]);

        const [orders, sessions] = conversionData;
        const avgSessionTime = totalSessionTime[0]?.totalTime ? 
            Math.round(totalSessionTime[0].totalTime / totalSessions) : 0;

        const analytics = {
            conversionRate: sessions > 0 ? Math.round((orders / sessions) * 100) : 0,
            bounceRate: totalSessions > 0 ? Math.round((bouncedSessions / totalSessions) * 100) : 0,
            avgSessionTime: avgSessionTime,
            totalSessions,
            totalOrders: orders
        };

        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics',
            data: {
                conversionRate: 0,
                bounceRate: 0,
                avgSessionTime: 0,
                totalSessions: 0,
                totalOrders: 0
            }
        });
    }
});

// GET /api/admin/dashboard/charts - Chart data
router.get('/charts', async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const { startDate, endDate } = getDateRange(period);

        // Sales overview chart data
        const salesChart = await Order.aggregate([
            { $match: { 
                createdAt: { $gte: startDate, $lte: endDate },
                status: { $ne: 'cancelled' }
            }},
            { $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                sales: { $sum: '$totalAmount' },
                orders: { $sum: 1 }
            }},
            { $sort: { '_id': 1 } }
        ]);

        // Visitor traffic chart data
        const trafficChart = await Analytics.aggregate([
            { $match: { 
                type: 'session',
                timestamp: { $gte: startDate, $lte: endDate }
            }},
            { $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                visitors: { $sum: 1 },
                pageViews: { $sum: '$pageViews' }
            }},
            { $sort: { '_id': 1 } }
        ]);

        res.json({
            success: true,
            data: {
                salesChart,
                trafficChart
            }
        });
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch chart data',
            data: {
                salesChart: [],
                trafficChart: []
            }
        });
    }
});

// GET /api/admin/dashboard/top-products - Top selling products
router.get('/top-products', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const topProducts = await Order.aggregate([
            { $unwind: '$items' },
            { $group: {
                _id: '$items.productId',
                totalSold: { $sum: '$items.quantity' },
                revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                productName: { $first: '$items.name' },
                productImage: { $first: '$items.image' }
            }},
            { $sort: { totalSold: -1 } },
            { $limit: parseInt(limit) },
            { $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'product'
            }},
            { $unwind: '$product' },
            { $project: {
                productId: '$_id',
                productName: 1,
                productImage: 1,
                totalSold: 1,
                revenue: 1,
                price: '$product.price',
                stock: '$product.stock'
            }}
        ]);

        res.json({
            success: true,
            data: topProducts
        });
    } catch (error) {
        console.error('Error fetching top products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch top products',
            data: []
        });
    }
});

// GET /api/admin/dashboard/alerts - System alerts
router.get('/alerts', async (req, res) => {
    try {
        const alerts = [];

        // Low stock alerts
        const lowStockProducts = await Product.find({ 
            stock: { $lt: 10 },
            isActive: true 
        }).limit(5).select('name stock');

        if (lowStockProducts.length > 0) {
            alerts.push({
                type: 'warning',
                title: 'Low Stock Alert',
                message: `${lowStockProducts.length} products are running low on stock`,
                count: lowStockProducts.length,
                action: '/admin/products?filter=low-stock'
            });
        }

        // No orders in last 24 hours
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentOrders = await Order.countDocuments({
            createdAt: { $gte: yesterday }
        });

        if (recentOrders === 0) {
            alerts.push({
                type: 'error',
                title: 'No Recent Orders',
                message: 'No orders received in the last 24 hours',
                count: 0,
                action: '/admin/orders'
            });
        }

        // Pending reviews
        const pendingReviews = await Review.countDocuments({ status: 'pending' });
        if (pendingReviews > 0) {
            alerts.push({
                type: 'info',
                title: 'Pending Reviews',
                message: `${pendingReviews} reviews awaiting approval`,
                count: pendingReviews,
                action: '/admin/reviews?status=pending'
            });
        }

        res.json({
            success: true,
            data: alerts
        });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch alerts',
            data: []
        });
    }
});

// GET /api/admin/dashboard/complete - Complete dashboard data
router.get('/complete', async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        
        // Fetch all dashboard data in parallel
        const [
            statsResponse,
            analyticsResponse,
            chartsResponse,
            topProductsResponse,
            alertsResponse
        ] = await Promise.all([
            fetch(`${req.protocol}://${req.get('host')}/api/admin/dashboard/stats?period=${period}`),
            fetch(`${req.protocol}://${req.get('host')}/api/admin/dashboard/analytics?period=${period}`),
            fetch(`${req.protocol}://${req.get('host')}/api/admin/dashboard/charts?period=${period}`),
            fetch(`${req.protocol}://${req.get('host')}/api/admin/dashboard/top-products?limit=10`),
            fetch(`${req.protocol}://${req.get('host')}/api/admin/dashboard/alerts`)
        ]);

        const [stats, analytics, charts, topProducts, alerts] = await Promise.all([
            statsResponse.json(),
            analyticsResponse.json(),
            chartsResponse.json(),
            topProductsResponse.json(),
            alertsResponse.json()
        ]);

        const completeData = {
            stats: stats.data || {},
            analytics: analytics.data || {},
            charts: charts.data || {},
            topProducts: topProducts.data || [],
            alerts: alerts.data || [],
            lastUpdated: new Date().toISOString()
        };

        res.json({
            success: true,
            data: completeData
        });
    } catch (error) {
        console.error('Error fetching complete dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch complete dashboard data',
            data: {
                stats: { totalProducts: 0, totalOrders: 0, revenue: 0, customers: 0, growth: { orders: 0, revenue: 0, customers: 0 } },
                analytics: { conversionRate: 0, bounceRate: 0, avgSessionTime: 0 },
                charts: { salesChart: [], trafficChart: [] },
                topProducts: [],
                alerts: [],
                lastUpdated: new Date().toISOString()
            }
        });
    }
});

module.exports = router;
