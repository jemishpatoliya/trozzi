import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FaShoppingCart, FaTrash, FaPlus, FaMinus, FaArrowLeft } from 'react-icons/fa';

const FALLBACK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const CartPage = () => {
    const {
        items,
        totalAmount,
        loading,
        updateQuantity,
        removeFromCart,
        clearCart
    } = useCart();

    const roundMoney = (v) => Math.round((Number(v ?? 0) || 0) * 100) / 100;
    const subtotal = roundMoney(items.reduce((sum, item) => {
        const qty = Number(item?.quantity ?? 0) || 0;
        const price = Number(item?.price ?? item?.product?.price ?? 0) || 0;
        return sum + price * qty;
    }, 0));
    const shipping = 0;
    const total = roundMoney(subtotal + shipping);

    const handleQuantityChange = (productId, newQuantity, variant) => {
        if (newQuantity === 0) {
            removeFromCart(productId, variant);
        } else if (newQuantity > 0) {
            updateQuantity(productId, newQuantity, variant);
        }
    };

    const handleRemoveItem = (productId, variant) => {
        removeFromCart(productId, variant);
    };

    const handleClearCart = () => {
        if (window.confirm('Are you sure you want to clear your entire cart?')) {
            clearCart();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your cart...</p>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <FaShoppingCart className="mx-auto h-24 w-24 text-gray-400" />
                        <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Your cart is empty</h2>
                        <p className="mt-2 text-gray-600">
                            Looks like you haven't added any items to your cart yet.
                        </p>
                        <div className="mt-6">
                            <Link
                                to="/"
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                <FaArrowLeft className="mr-2" />
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
                    <button
                        onClick={handleClearCart}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                        Clear Cart
                    </button>
                </div>

                <div className="bg-white shadow rounded-lg">
                    {/* Cart Items */}
                    <div className="divide-y divide-gray-200">
                        {items.map((item) => (
                            <div key={`${item.product?._id || item.product}-${item.size || ''}-${item.color || ''}`} className="p-6">
                                <div className="flex items-center">
                                    {/* Product Image */}
                                    <div className="flex-shrink-0 w-24 h-24">
                                        <img
                                            src={item.image || item.product?.image || item.product?.galleryImages?.[0] || FALLBACK_IMAGE}
                                            alt={item.product?.name || item.name}
                                            className="w-full h-full object-cover rounded-md"
                                            onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                                        />
                                    </div>

                                    {/* Product Details */}
                                    <div className="ml-6 flex-1">
                                        <div className="flex justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {item.product?.name || item.name}
                                                </h3>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    {item.product?.category}
                                                </p>
                                                {(item?.size || item?.color) ? (
                                                    <p className="mt-1 text-sm text-gray-600">
                                                        {item?.size ? `Size: ${item.size}` : ''}{item?.size && item?.color ? ' | ' : ''}{item?.color ? `Color: ${item.color}` : ''}
                                                    </p>
                                                ) : null}
                                                <p className="mt-2 text-lg font-semibold text-gray-900">
                                                    ₹{(item.price ?? item.product?.price ?? 0).toFixed(2)}
                                                </p>
                                            </div>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center space-x-3">
                                                <div className="flex items-center border border-gray-300 rounded-md">
                                                    <button
                                                        onClick={() => handleQuantityChange(item.product?._id || item.product, item.quantity - 1, { size: item?.size || '', color: item?.color || '' })}
                                                        className="p-2 text-gray-600 hover:text-gray-900"
                                                    >
                                                        <FaMinus className="h-3 w-3" />
                                                    </button>
                                                    <span className="px-3 py-1 text-gray-900 font-medium">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => handleQuantityChange(item.product?._id || item.product, item.quantity + 1, { size: item?.size || '', color: item?.color || '' })}
                                                        className="p-2 text-gray-600 hover:text-gray-900"
                                                    >
                                                        <FaPlus className="h-3 w-3" />
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => handleRemoveItem(item.product?._id || item.product, { size: item?.size || '', color: item?.color || '' })}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <FaTrash className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Item Total */}
                                        <div className="mt-4 flex justify-between">
                                            <span className="text-sm text-gray-500">
                                                Subtotal ({item.quantity} items)
                                            </span>
                                            <span className="text-lg font-semibold text-gray-900">
                                                ₹{((item.price ?? item.product?.price ?? 0) * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Cart Summary */}
                    <div className="border-t border-gray-200 p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-600">Total ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</p>
                                <p className="text-3xl font-bold text-gray-900">₹{total.toFixed(2)}</p>
                                <div className="mt-2 space-y-1 text-sm text-gray-600">
                                    <div className="flex justify-between gap-6">
                                        <span>Subtotal</span>
                                        <span>₹{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between gap-6">
                                        <span>Shipping</span>
                                        <span>Free</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-x-4">
                                <Link
                                    to="/"
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <FaArrowLeft className="mr-2" />
                                    Continue Shopping
                                </Link>
                                <Link
                                    to="/checkout"
                                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    Proceed to Checkout
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
