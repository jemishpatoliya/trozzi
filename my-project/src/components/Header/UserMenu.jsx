import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useContentSettings } from '../../context/ContentSettingsContext';
import { FaUser, FaShoppingCart, FaHeart, FaSignOutAlt } from 'react-icons/fa';

const UserMenu = () => {
    const { user, logout } = useAuth();
    const { settings } = useContentSettings();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsOpen(false);
    };

    if (!user) {
        return (
            <div className="flex items-center space-x-4">
                <Link
                    to="/login"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                    Sign In
                </Link>
                <Link
                    to="/register"
                    className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                    Sign Up
                </Link>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
            >
                <FaUser className="h-4 w-4" />
                <span>{user.firstName}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsOpen(false)}
                    >
                        <FaUser className="mr-2 h-4 w-4" />
                        My Profile
                    </Link>
                    {settings?.showOrderHistory ? (
                        <Link
                            to="/orders"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsOpen(false)}
                        >
                            <FaShoppingCart className="mr-2 h-4 w-4" />
                            My Orders
                        </Link>
                    ) : null}
                    <Link
                        to="/wishlist"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsOpen(false)}
                    >
                        <FaHeart className="mr-2 h-4 w-4" />
                        Wishlist
                    </Link>
                    <hr className="my-1" />
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                        <FaSignOutAlt className="mr-2 h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
