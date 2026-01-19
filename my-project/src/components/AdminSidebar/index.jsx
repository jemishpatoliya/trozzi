import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    FaHome,
    FaBox,
    FaShoppingCart,
    FaUsers,
    FaStar,
    FaChartBar,
    FaCog,
    FaSignOutAlt,
    FaBars,
    FaTachometerAlt,
    FaClipboardList,
    FaComments,
    FaQuestionCircle,
    FaChevronDown,
    FaChevronRight
} from 'react-icons/fa';
import { getReviewStats } from '../../api/adminReviews';

const AdminSidebar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [reviewStats, setReviewStats] = useState({
        totalReviews: 0,
        averageRating: 0,
        pendingReviews: 0,
        approvedReviews: 0,
        rejectedReviews: 0
    });
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        loadReviewStats();
    }, []);

    const loadReviewStats = async () => {
        try {
            setLoading(true);
            const stats = await getReviewStats();
            setReviewStats(stats);
        } catch (error) {
            console.error('Failed to load review stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const menuItems = [
        {
            title: 'Dashboard',
            path: '/admin',
            icon: <FaTachometerAlt />,
            description: 'Admin dashboard overview'
        },
        {
            title: 'Products',
            path: '/admin/products',
            icon: <FaBox />,
            description: 'Product management'
        },
        {
            title: 'Orders',
            path: '/admin/orders',
            icon: <FaShoppingCart />,
            description: 'Order management'
        },
        {
            title: 'Users',
            path: '/admin/users',
            icon: <FaUsers />,
            description: 'User management'
        },
        {
            title: 'Reviews',
            path: '/admin/reviews',
            icon: <FaStar />,
            description: 'Customer reviews management',
            count: reviewStats.totalReviews
        },
        {
            title: 'Analytics',
            path: '/admin/analytics',
            icon: <FaChartBar />,
            description: 'Sales and analytics'
        },
        {
            title: 'Settings',
            path: '/admin/settings',
            icon: <FaCog />,
            description: 'System settings'
        }
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">A</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">Admin</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    >
                        ×
                    </button>
                </div>

                <nav className="mt-6 px-4">
                    <ul className="space-y-2">
                        {menuItems.map((item, index) => (
                            <li key={index}>
                                <Link
                                    to={item.path}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.path)
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {item.icon}
                                        <span>{item.title}</span>
                                    </div>
                                    {!loading && item.count > 0 && (
                                        <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                                            {item.count}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Review Stats Summary */}
                <div className="mt-8 px-4 border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Review Summary</h3>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Total Reviews</span>
                            <span className="font-medium text-gray-900">{reviewStats.totalReviews}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Average Rating</span>
                            <div className="flex items-center gap-1">
                                <span className="font-medium text-gray-900">{reviewStats.averageRating.toFixed(1)}</span>
                                <FaStar className="w-3 h-3 text-yellow-400 fill-current" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Pending</span>
                            <span className="font-medium text-yellow-600">{reviewStats.pendingReviews}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Approved</span>
                            <span className="font-medium text-green-600">{reviewStats.approvedReviews}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Rejected</span>
                            <span className="font-medium text-red-600">{reviewStats.rejectedReviews}</span>
                        </div>
                    </div>
                </div>

                {/* User Section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-bold text-sm">A</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">Admin User</p>
                            <p className="text-xs text-gray-500">admin@example.com</p>
                        </div>
                    </div>
                    <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                        <FaSignOutAlt />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Mobile menu overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <div className="flex-1 lg:ml-0">
                {/* Header */}
                <header className="bg-white shadow-sm border-b border-gray-200">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            {/* Mobile menu button */}
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            >
                                <FaBars />
                            </button>

                            {/* Header content */}
                            <div className="flex-1 lg:flex lg:items-center lg:justify-between">
                                <h1 className="text-lg font-semibold text-gray-900">
                                    {menuItems.find(item => isActive(item.path))?.title || 'Dashboard'}
                                </h1>

                                {/* Desktop user menu */}
                                <div className="hidden lg:flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                            <span className="text-gray-600 font-bold text-sm">A</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">Admin</span>
                                    </div>
                                    <button className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                                        <FaSignOutAlt />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto">
                    <div className="p-4 sm:p-6 lg:p-8">
                        {/* Page Header */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {menuItems.find(item => isActive(item.path))?.title || 'Dashboard'}
                            </h2>
                            <p className="text-gray-600 mt-1">
                                {menuItems.find(item => isActive(item.path))?.description}
                            </p>
                        </div>

                        {/* Page Content */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            {/* Content will be rendered here based on the route */}
                            <div className="text-center py-12">
                                <div className="text-gray-500">
                                    {menuItems.find(item => isActive(item.path))?.icon}
                                </div>
                                <p className="text-gray-500 mt-2">
                                    Select a menu item from the sidebar to get started
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminSidebar;
