import React, { useCallback, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaChartBar, FaChartLine, FaUsers, FaShoppingCart, FaBox, FaComments, FaEye, FaTrash, FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';
import { fetchCompleteDashboard } from '../../api/adminDashboard';
import AdminSidebar from '../../components/AdminSidebar';

const AdminDashboard = () => {
    const [dashboardData, setDashboardData] = useState({
        stats: {
            totalProducts: 0,
            totalOrders: 0,
            revenue: 0,
            customers: 0,
            growth: {
                orders: 0,
                revenue: 0,
                customers: 0
            },
            reviewStats: {
                totalReviews: 0,
                averageRating: 0
            }
        },
        analytics: {
            conversionRate: 0,
            bounceRate: 0,
            avgSessionTime: 0,
            totalSessions: 0,
            totalOrders: 0
        },
        charts: {
            salesChart: [],
            trafficChart: []
        },
        topProducts: [],
        alerts: [],
        reviewStats: {
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            statusDistribution: { pending: 0, approved: 0, rejected: 0 }
        }
    });
    const [loading, setLoading] = useState(true);
    const [recentReviews, setRecentReviews] = useState([]);
    const [error, setError] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('today');

    const loadDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            // Fetch complete dashboard data from backend
            try {
                const response = await fetchCompleteDashboard({ period: selectedPeriod });
                
                if (response.success && response.data) {
                    const data = response.data;
                    
                    setDashboardData({
                        stats: {
                            totalProducts: data.totalProducts || 0,
                            totalOrders: data.orders || 0,
                            revenue: data.totalRevenue || 0,
                            customers: data.customers || data.totalUsers || 0,
                            growth: data.growth || {
                                orders: '0%',
                                revenue: '0%',
                                customers: '0%'
                            }
                        },
                        analytics: {
                            conversionRate: data.analytics?.conversionRate || '0%',
                            bounceRate: data.analytics?.bounceRate || '0%',
                            avgSessionTime: data.analytics?.avgSession || '0m',
                            totalSessions: 0,
                            totalOrders: data.orders || 0
                        },
                        charts: {
                            salesChart: data.analytics?.salesChart || [],
                            trafficChart: data.analytics?.trafficChart || []
                        },
                        topProducts: data.analytics?.topProducts || [],
                        alerts: data.analytics?.alerts || [],
                        reviewStats: data.analytics?.reviewStats || {
                            totalReviews: 0,
                            averageRating: 0,
                            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                            statusDistribution: { pending: 0, approved: 0, rejected: 0 }
                        }
                    });
                    
                    // Set recent reviews if available
                    if (data.analytics?.recentReviews) {
                        setRecentReviews(data.analytics.recentReviews);
                    }
                }
            } catch (dashboardErr) {
                console.warn('Dashboard API not available:', dashboardErr);
                setError('Unable to connect to dashboard API');
            }
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error('Error loading dashboard data:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const formatDuration = (seconds) => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        return `${Math.round(seconds / 3600)}h`;
    };

    const getGrowthIcon = (value) => {
        if (value > 0) return <FaArrowUp className="text-green-500" />;
        if (value < 0) return <FaArrowDown className="text-red-500" />;
        return <FaMinus className="text-gray-500" />;
    };

    const getGrowthColor = (value) => {
        if (value > 0) return 'text-green-600';
        if (value < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const getAlertIcon = (type) => {
        switch (type) {
            case 'error': return <FaExclamationTriangle className="text-red-500" />;
            case 'warning': return <FaExclamationTriangle className="text-yellow-500" />;
            case 'info': return <FaInfoCircle className="text-blue-500" />;
            case 'success': return <FaCheckCircle className="text-green-500" />;
            default: return <FaInfoCircle className="text-gray-500" />;
        }
    };

    const getAlertColor = (type) => {
        switch (type) {
            case 'error': return 'border-red-200 bg-red-50';
            case 'warning': return 'border-yellow-200 bg-yellow-50';
            case 'info': return 'border-blue-200 bg-blue-50';
            case 'success': return 'border-green-200 bg-green-50';
            default: return 'border-gray-200 bg-gray-50';
        }
    };

    const getRatingColor = (rating) => {
        if (rating >= 4.5) return 'text-green-600';
        if (rating >= 3.5) return 'text-yellow-600';
        if (rating >= 2.5) return 'text-orange-600';
        return 'text-red-600';
    };

    const getStatusColor = (status) => {
        const colors = {
            approved: 'text-green-600',
            pending: 'text-yellow-600',
            rejected: 'text-red-600'
        };
        return colors[status] || 'text-gray-600';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
                    <p className="text-gray-600">{error}</p>
                    <button
                        onClick={loadDashboardData}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <AdminSidebar>
            <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Period:</label>
                        <select 
                            value={selectedPeriod} 
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="today">Today</option>
                            <option value="week">Last Week</option>
                            <option value="month">Last Month</option>
                            <option value="year">Last Year</option>
                        </select>
                    </div>
                </div>

                {/* Alerts Section */}
                {dashboardData.alerts && dashboardData.alerts.length > 0 && (
                    <div className="mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {dashboardData.alerts.map((alert, index) => (
                                <Link key={index} to={alert.action || '#'} className="block">
                                    <div className={`p-4 rounded-lg border ${getAlertColor(alert.type)} hover:shadow-md transition-shadow`}>
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1">{getAlertIcon(alert.type)}</div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                                                {alert.count !== undefined && (
                                                    <span className="inline-block mt-2 px-2 py-1 bg-white rounded-full text-xs font-medium">
                                                        {alert.count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Top Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Products */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FaBox className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Total Products</h3>
                                    <p className="text-sm text-gray-500">Active products</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-blue-600">{dashboardData.stats.totalProducts}</div>
                            </div>
                        </div>
                    </div>

                    {/* Total Orders */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <FaShoppingCart className="text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Total Orders</h3>
                                    <p className="text-sm text-gray-500">Completed orders</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-green-600">{dashboardData.stats.totalOrders}</div>
                                <div className={`flex items-center justify-end gap-1 text-sm ${getGrowthColor(dashboardData.stats.growth.orders)}`}>
                                    {getGrowthIcon(dashboardData.stats.growth.orders)}
                                    <span>{dashboardData.stats.growth.orders}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Revenue */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <FaChartLine className="text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Revenue</h3>
                                    <p className="text-sm text-gray-500">Total sales</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-purple-600">{formatCurrency(dashboardData.stats.revenue)}</div>
                                <div className={`flex items-center justify-end gap-1 text-sm ${getGrowthColor(dashboardData.stats.growth.revenue)}`}>
                                    {getGrowthIcon(dashboardData.stats.growth.revenue)}
                                    <span>{dashboardData.stats.growth.revenue}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customers */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <FaUsers className="text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Customers</h3>
                                    <p className="text-sm text-gray-500">Total customers</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-orange-600">{dashboardData.stats.customers}</div>
                                <div className={`flex items-center justify-end gap-1 text-sm ${getGrowthColor(dashboardData.stats.growth.customers)}`}>
                                    {getGrowthIcon(dashboardData.stats.growth.customers)}
                                    <span>{dashboardData.stats.growth.customers}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analytics Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Conversion Rate */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">Conversion Rate</h3>
                            <FaChartBar className="text-blue-500" />
                        </div>
                        <div className="text-3xl font-bold text-blue-600">{dashboardData.analytics.conversionRate}%</div>
                        <p className="text-sm text-gray-500 mt-2">Visitors to customers</p>
                    </div>

                    {/* Bounce Rate */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">Bounce Rate</h3>
                            <FaChartBar className="text-red-500" />
                        </div>
                        <div className="text-3xl font-bold text-red-600">{dashboardData.analytics.bounceRate}%</div>
                        <p className="text-sm text-gray-500 mt-2">Single page visits</p>
                    </div>

                    {/* Avg Session Time */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">Avg Session Time</h3>
                            <FaChartBar className="text-green-500" />
                        </div>
                        <div className="text-3xl font-bold text-green-600">{formatDuration(dashboardData.analytics.avgSessionTime)}</div>
                        <p className="text-sm text-gray-500 mt-2">Time on site</p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Sales Overview Chart */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Sales Overview</h2>
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <FaChartBar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                                <p>Chart data would be displayed here</p>
                                <p className="text-sm">{dashboardData.charts.salesChart.length} data points</p>
                            </div>
                        </div>
                    </div>

                    {/* Visitor Traffic Chart */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Visitor Traffic</h2>
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <FaChartBar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                                <p>Chart data would be displayed here</p>
                                <p className="text-sm">{dashboardData.charts.trafficChart.length} data points</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Products Section */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Top Products</h2>
                        <Link
                            to="/admin/products"
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                            View All Products
                        </Link>
                    </div>

                    {dashboardData.topProducts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FaBox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p>No products available</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Product</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Price</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Stock</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboardData.topProducts.map((product, index) => (
                                        <tr key={product.productId || product._id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{product.productName || product.name}</div>
                                                        <div className="text-sm text-gray-500">{product.category || 'No category'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-right py-3 px-4">
                                                <span className="font-medium text-gray-900">
                                                    {formatCurrency(product.price || product.revenue || 0)}
                                                </span>
                                            </td>
                                            <td className="text-right py-3 px-4">
                                                <span className={`font-medium ${(product.stock || 0) < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {product.stock || 0}
                                                </span>
                                            </td>
                                            <td className="text-right py-3 px-4">
                                                {product.totalSold !== undefined ? (
                                                    <span className="font-medium text-green-600">{product.totalSold} sold</span>
                                                ) : (
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {product.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Reviews Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Recent Reviews */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Recent Reviews</h2>
                            <Link
                                to="/admin/reviews"
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                                View All Reviews
                            </Link>
                        </div>

                        {recentReviews.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <FaComments className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p>No reviews yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentReviews.map((review) => (
                                    <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="flex items-center">
                                                        {[...Array(5)].map((_, i) => (
                                                            <FaStar
                                                                key={i}
                                                                className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">{review.title}</span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {review.customerName} • {formatDate(review.date)}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                                                    {review.status || 'pending'}
                                                </span>
                                                <button className="text-blue-600 hover:text-blue-700 text-sm">
                                                    <FaEye />
                                                </button>
                                                <button className="text-red-600 hover:text-red-700 text-sm">
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Review Stats */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Review Statistics</h2>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{dashboardData.reviewStats.totalReviews}</div>
                                <p className="text-sm text-gray-500">Total Reviews</p>
                            </div>
                            <div className="text-center">
                                <div className={`text-2xl font-bold ${getRatingColor(dashboardData.reviewStats.averageRating)}`}>
                                    {dashboardData.reviewStats.averageRating.toFixed(1)}
                                </div>
                                <p className="text-sm text-gray-500">Average Rating</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-medium text-gray-900">Rating Distribution</h3>
                            {[5, 4, 3, 2, 1].map((rating) => (
                                <div key={rating} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {[...Array(rating)].map((_, i) => (
                                            <FaStar
                                                key={i}
                                                className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                                    }`}
                                            />
                                        ))}
                                        <span className="text-sm text-gray-600">{rating}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-yellow-400 h-2 rounded-full"
                                                style={{ width: `${(dashboardData.reviewStats.ratingDistribution[rating] / (dashboardData.reviewStats.totalReviews || 1)) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-gray-600 w-8 text-right">
                                            {dashboardData.reviewStats.ratingDistribution[rating]}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Link
                        to="/admin/products"
                        className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 text-center transition-colors"
                    >
                        <FaBox className="h-6 w-6 mx-auto mb-2" />
                        <div>Manage Products</div>
                    </Link>

                    <Link
                        to="/admin/orders"
                        className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 text-center transition-colors"
                    >
                        <FaShoppingCart className="h-6 w-6 mx-auto mb-2" />
                        <div>Manage Orders</div>
                    </Link>

                    <Link
                        to="/admin/reviews"
                        className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 text-center transition-colors"
                    >
                        <FaComments className="h-6 w-6 mx-auto mb-2" />
                        <div>Manage Reviews</div>
                    </Link>

                    <Link
                        to="/admin/analytics"
                        className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 text-center transition-colors"
                    >
                        <FaChartBar className="h-6 w-6 mx-auto mb-2" />
                        <div>View Analytics</div>
                    </Link>
                </div>
            </div>
        </AdminSidebar>
    );
};

export default AdminDashboard;
