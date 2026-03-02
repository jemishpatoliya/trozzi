import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import { FiShoppingBag } from 'react-icons/fi';

const UserMenu = ({ onNavigate }) => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsOpen(false);
        onNavigate?.();
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
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-white rounded-md shadow-lg py-2 z-[100]">
                    <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                            setIsOpen(false);
                            onNavigate?.();
                        }}
                    >
                        <FaUser className="mr-3 h-4 w-4" />
                        My Profile
                    </Link>
                    <Link
                        to="/orders"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                            setIsOpen(false);
                            onNavigate?.();
                        }}
                    >
                        <FiShoppingBag className="mr-3 h-4 w-4" />
                        My Orders
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                            <FaSignOutAlt className="mr-3 h-4 w-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
