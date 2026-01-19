import React, { useState } from 'react';
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
    FaQuestionCircle
} from 'react-icons/fa';

const AdminNavigation = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

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
            description: 'Customer reviews management'
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
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Link to="/admin" className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">A</span>
                                </div>
                                <span className="text-xl font-bold text-gray-900">Admin Panel</span>
                            </Link>
                        </div>

                        {/* Navigation */}
                        <nav className="hidden md:flex space-x-8">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.path)
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    {item.icon}
                                    <span>{item.title}</span>
                                </Link>
                            ))}
                        </nav>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            >
                                <FaBars />
                            </button>
                        </div>

                        {/* User menu */}
                        <div className="flex items-center gap-4">
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
            </header>

            {/* Mobile sidebar */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsSidebarOpen(false)} />
                    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                >
                                    ×
                                </button>
                            </div>
                            <nav className="space-y-2">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.path)
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        {item.icon}
                                        <span>{item.title}</span>
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* Main content */}
            <main className="flex-1 overflow-auto">
                <div className="p-4 sm:p-6 lg:p-8">
                    {/* Page Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {menuItems.find(item => isActive(item.path))?.title || 'Dashboard'}
                        </h1>
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
    );
};

export default AdminNavigation;
