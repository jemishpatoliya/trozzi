import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FaShoppingCart, FaTrash, FaPlus, FaMinus, FaArrowLeft } from 'react-icons/fa';
import { FiShoppingCart as LineCart, FiUser } from 'react-icons/fi';

const FALLBACK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const CartPage = () => {
    const {
        items,
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
        <div className="min-h-screen bg-gray-50 mt-40 pb-24 sm:pb-0">
            <div className="container mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
                <div className="sm:hidden flex items-center justify-between mb-3">
                    <Link to="/" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200">
                        <FaArrowLeft className="text-gray-700" />
                    </Link>
                    <div className="text-[18px] font-bold text-gray-900">Cart</div>
                    <div className="flex items-center gap-2">
                        <Link to="/profile" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200">
                            <FiUser className="text-gray-700" />
                        </Link>
                        <Link to="/cart" className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200">
                            <LineCart className="text-gray-700" />
                            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#5A0B5A] text-white text-[11px] font-bold flex items-center justify-center">
                                {items.reduce((sum, item) => sum + (Number(item?.quantity ?? 0) || 0), 0)}
                            </span>
                        </Link>
                    </div>
                </div>

                <div className="sm:hidden mb-3">
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2.5">
                        <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-2 text-[#5A0B5A]">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#5A0B5A] text-white">1</div>
                                <span className="font-semibold">Cart</span>
                            </div>
                            <div className="flex-1 h-[2px] mx-1.5 bg-gray-200" />
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-gray-200">2</div>
                                <span className="font-semibold">Address</span>
                            </div>
                            <div className="flex-1 h-[2px] mx-1.5 bg-gray-200" />
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-gray-200">3</div>
                                <span className="font-semibold">Payment</span>
                            </div>
                            <div className="flex-1 h-[2px] mx-1.5 bg-gray-200" />
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-gray-200">4</div>
                                <span className="font-semibold">Summary</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden sm:flex items-center justify-between mb-5 sm:mb-8">
                    <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Shopping Cart</h1>
                    <button
                        onClick={handleClearCart}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                        Clear Cart
                    </button>
                </div>

                <div className="sm:hidden space-y-3">
                    {items.map((item) => (
                        <div key={`${item.product?._id || item.product}-${item.size || ''}-${item.color || ''}`} className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
                            <div className="flex gap-3">
                                <div className="w-20 h-20 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
                                    <img
                                        src={item.image || item.product?.image || item.product?.galleryImages?.[0] || FALLBACK_IMAGE}
                                        alt={item.product?.name || item.name}
                                        className="w-full h-full object-contain"
                                        onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                                    />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="text-[13px] font-semibold text-gray-900 line-clamp-2">
                                        {item.product?.name || item.name}
                                    </div>
                                    <div className="mt-1 text-[15px] font-bold text-[#5A0B5A]">₹{(Number(item.price ?? item.product?.price ?? 0) || 0).toFixed(0)}</div>
                                </div>

                                <button
                                    onClick={() => handleRemoveItem(item.product?._id || item.product, { size: item?.size || '', color: item?.color || '' })}
                                    className="w-10 h-10 inline-flex items-center justify-center text-red-500"
                                >
                                    <FaTrash className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="mt-3 flex items-center justify-center">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleQuantityChange(item.product?._id || item.product, item.quantity - 1, { size: item?.size || '', color: item?.color || '' })}
                                        className="w-9 h-9 rounded-full border border-gray-200 bg-white text-[#5A0B5A] font-bold"
                                    >
                                        −
                                    </button>
                                    <div className="w-10 text-center text-[14px] font-bold text-gray-900">{item.quantity}</div>
                                    <button
                                        onClick={() => handleQuantityChange(item.product?._id || item.product, item.quantity + 1, { size: item?.size || '', color: item?.color || '' })}
                                        className="w-9 h-9 rounded-full border border-gray-200 bg-white text-[#5A0B5A] font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="bg-[#F5EAF4] border border-[#E7CFE6] rounded-xl p-3 flex gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/60 border border-white/50 flex items-center justify-center">
                            <span className="text-[#5A0B5A] text-[12px] font-bold">i</span>
                        </div>
                        <div className="min-w-0">
                            <div className="text-[13px] font-bold text-gray-900">Your Safety, Our Priority</div>
                            <div className="text-[12px] text-gray-600 mt-0.5">We make sure that your package is safe at every point of contact</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex justify-between text-[13px] text-gray-700">
                            <span>Shipping:</span>
                            <span className="font-bold text-emerald-600">FREE</span>
                        </div>
                        <div className="flex justify-between text-[13px] text-gray-700 mt-2">
                            <span>Total Product Price:</span>
                            <span className="font-bold">₹{subtotal.toFixed(0)}</span>
                        </div>
                        <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                            <span className="text-[14px] font-extrabold text-gray-900">Order Total:</span>
                            <span className="text-[14px] font-extrabold text-[#5A0B5A]">₹{total.toFixed(0)}</span>
                        </div>
                    </div>
                </div>

                <div className="hidden sm:block bg-white shadow rounded-lg">
                    {/* Cart Items */}
                    <div className="divide-y divide-gray-200">
                        {items.map((item) => (
                            <div key={`${item.product?._id || item.product}-${item.size || ''}-${item.color || ''}`} className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    {/* Product Image */}
                                    <div className="flex-shrink-0 w-full sm:w-24 h-40 sm:h-24 bg-gray-50 rounded-md overflow-hidden">
                                        <img
                                            src={item.image || item.product?.image || item.product?.galleryImages?.[0] || FALLBACK_IMAGE}
                                            alt={item.product?.name || item.name}
                                            className="w-full h-full object-contain"
                                            onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                                        />
                                    </div>

                                    {/* Product Details */}
                                    <div className="sm:ml-2 flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
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
                                                <p className="mt-2 text-base sm:text-lg font-semibold text-gray-900">
                                                    ₹{(item.price ?? item.product?.price ?? 0).toFixed(2)}
                                                </p>
                                            </div>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center justify-between sm:justify-end gap-3">
                                                <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                                                    <button
                                                        onClick={() => handleQuantityChange(item.product?._id || item.product, item.quantity - 1, { size: item?.size || '', color: item?.color || '' })}
                                                        className="w-10 h-10 flex items-center justify-center text-gray-700 hover:text-gray-900"
                                                    >
                                                        <FaMinus className="h-3 w-3" />
                                                    </button>
                                                    <span className="min-w-[44px] text-center px-3 py-1 text-gray-900 font-semibold">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => handleQuantityChange(item.product?._id || item.product, item.quantity + 1, { size: item?.size || '', color: item?.color || '' })}
                                                        className="w-10 h-10 flex items-center justify-center text-gray-700 hover:text-gray-900"
                                                    >
                                                        <FaPlus className="h-3 w-3" />
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => handleRemoveItem(item.product?._id || item.product, { size: item?.size || '', color: item?.color || '' })}
                                                    className="w-10 h-10 inline-flex items-center justify-center text-red-600 hover:text-red-800"
                                                >
                                                    <FaTrash className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Item Total */}
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-sm text-gray-500">
                                                Subtotal ({item.quantity} items)
                                            </span>
                                            <span className="text-base sm:text-lg font-semibold text-gray-900">
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
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Total ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</p>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900">₹{total.toFixed(2)}</p>
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

                            <div className="hidden sm:flex items-center gap-4">
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

                <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-[16px] font-extrabold text-[#5A0B5A] truncate">₹{total.toFixed(0)}</div>
                            <div className="text-[12px] text-gray-500">Inclusive of all taxes</div>
                        </div>
                        <Link
                            to="/checkout"
                            className="h-12 px-6 inline-flex items-center justify-center rounded-xl bg-[#5A0B5A] text-white text-sm font-extrabold shadow-sm flex-1"
                        >
                            Continue to Address
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
