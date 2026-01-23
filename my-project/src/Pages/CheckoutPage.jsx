import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { FaArrowLeft, FaLock, FaCreditCard } from 'react-icons/fa';

const CheckoutPage = () => {
    const { items, totalAmount, fetchCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Success

    const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
    const [createdOrderId, setCreatedOrderId] = useState('');

    const [formData, setFormData] = useState({
        // Customer info
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',

        // Address
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',

        // Payment
        paymentMethod: 'upi',
    });

    const [paymentInit, setPaymentInit] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (items.length === 0) {
            navigate('/cart');
            return;
        }
    }, [user, items, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const TAX_RATE = 0.18;
    const roundMoney = (v) => Math.round((Number(v ?? 0) || 0) * 100) / 100;

    const computeSubtotal = (cartItems) => {
        if (!Array.isArray(cartItems) || cartItems.length === 0) return 0;
        return cartItems.reduce((sum, item) => {
            const qty = Number(item?.quantity ?? 0) || 0;
            const price = Number(item?.price ?? item?.product?.price ?? 0) || 0;
            return sum + price * qty;
        }, 0);
    };

    const computeShipping = (cartItems) => {
        const minBase = 4.99;
        if (!Array.isArray(cartItems) || cartItems.length === 0) return 0;
        return cartItems.reduce((sum, item) => {
            const qty = Number(item?.quantity ?? 0) || 0;
            const p = item?.product || {};
            const free = typeof p?.freeShipping === 'boolean' ? p.freeShipping : Boolean(p?.management?.shipping?.freeShipping);
            if (free) return sum;

            const weightKg = Number(p?.weight ?? p?.management?.shipping?.weightKg ?? 0) || 0;
            const dims = p?.dimensions ?? p?.management?.shipping?.dimensionsCm ?? { length: 0, width: 0, height: 0 };
            const length = Number(dims?.length ?? 0) || 0;
            const width = Number(dims?.width ?? 0) || 0;
            const height = Number(dims?.height ?? 0) || 0;
            const volumetric = (length * width * height) / 5000;
            const chargeable = Math.max(weightKg, volumetric);
            const costPerItem = Math.max(minBase, chargeable * 1.2);
            return sum + costPerItem * qty;
        }, 0);
    };

    const SHIPPING_AMOUNT = roundMoney(computeShipping(items));
    const subtotalAmount = roundMoney(computeSubtotal(items));
    const taxAmount = roundMoney(subtotalAmount * TAX_RATE);
    const cartProducts = Array.isArray(items) ? items.map((i) => i?.product).filter(Boolean) : [];
    const isCodAllowedForAll = cartProducts.length > 0 && cartProducts.every((p) => {
        const direct = p?.codAvailable;
        const fromManagement = p?.management?.shipping?.codAvailable;
        return Boolean(direct ?? fromManagement);
    });
    const codChargeTotal = Array.isArray(items) ? roundMoney(items.reduce((sum, item) => {
        const p = item?.product;
        const codEnabled = typeof p?.codAvailable === 'boolean' ? p.codAvailable : Boolean(p?.management?.shipping?.codAvailable);
        if (!codEnabled) return sum;
        const charge = Number(p?.codCharge ?? p?.management?.shipping?.codCharge ?? 0) || 0;
        const qty = Number(item?.quantity ?? 0) || 0;
        return sum + charge * qty;
    }, 0)) : 0;

    const payableAmount = roundMoney(
        subtotalAmount + SHIPPING_AMOUNT + taxAmount + (formData.paymentMethod === 'cod' ? codChargeTotal : 0)
    );

    const formatCurrency = (value) => `₹${value.toFixed(2)}`;

    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate address
        if (!formData.addressLine1 || !formData.city || !formData.state || !formData.postalCode) {
            setError('Please fill in all required address fields');
            return;
        }

        setStep(2);
    };

    const handlePayment = async () => {
        try {
            setLoading(true);
            setError('');

            if (formData.paymentMethod === 'cod') {
                if (!isCodAllowedForAll) {
                    setError('Cash on Delivery is not available for one or more items in your cart.');
                    setLoading(false);
                    return;
                }
                // For COD: create order without online payment
                const orderData = {
                    currency: 'INR',
                    subtotal: subtotalAmount,
                    shipping: SHIPPING_AMOUNT,
                    tax: taxAmount,
                    codCharge: codChargeTotal,
                    total: payableAmount,
                    paymentMethod: 'cod',
                    items: items.map(item => ({
                        productId: item.product._id,
                        name: item.product.name,
                        price: item.price ?? item.product.price,
                        quantity: item.quantity,
                        selectedImage: item.image || '',
                        selectedColor: item.color || '',
                        selectedSize: item.size || '',
                    })),
                    customer: {
                        name: `${formData.firstName} ${formData.lastName}`,
                        email: formData.email,
                        phone: formData.phone,
                    },
                    address: {
                        line1: formData.addressLine1,
                        line2: formData.addressLine2,
                        city: formData.city,
                        state: formData.state,
                        postalCode: formData.postalCode,
                        country: formData.country,
                    },
                };

                const res = await apiClient.post('/orders/cod', orderData);
                const createdId = res?.data?.id || res?.data?.orderId || '';
                if (createdId) setCreatedOrderId(createdId);
                setShowPaymentSuccessModal(true);
                setStep(3);
                try { await fetchCart(); } catch (_e) {}
                setLoading(false);
                return;
            }

            const orderData = {
                currency: 'INR',
                subtotal: subtotalAmount,
                shipping: SHIPPING_AMOUNT,
                tax: taxAmount,
                total: payableAmount,
                items: items.map(item => ({
                    productId: item.product._id,
                    name: item.product.name,
                    price: item.price ?? item.product.price,
                    quantity: item.quantity,
                    selectedImage: item.image || '',
                    selectedColor: item.color || '',
                    selectedSize: item.size || '',
                })),
                customer: {
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    phone: formData.phone,
                },
                address: {
                    line1: formData.addressLine1,
                    line2: formData.addressLine2,
                    city: formData.city,
                    state: formData.state,
                    postalCode: formData.postalCode,
                    country: formData.country,
                },
            };

            const response = await apiClient.post('/payments/create-order', {
                amount: payableAmount,
                currency: 'INR',
                provider: formData.paymentMethod,
                orderData,
                returnUrl: `${window.location.origin}/orders`,
            });

            setPaymentInit(response.data);

            const createdFromInit = response?.data?.orderId || '';
            if (createdFromInit) setCreatedOrderId(createdFromInit);

            const paymentId = response?.data?.paymentId;
            if (!paymentId) {
                setError('Payment initiation succeeded but no payment id was returned. Please contact support.');
                setLoading(false);
                return;
            }

            const nextAction = response?.data?.nextAction;
            if (nextAction?.type === 'redirect_url' && nextAction?.url) {
                setLoading(false);
                window.location.href = String(nextAction.url);
                return;
            }

            const verifyRes = await apiClient.post('/payments/verify', {
                paymentId,
                status: 'completed',
                orderData,
            });

            const createdId = verifyRes?.data?.orderId || createdFromInit || '';
            if (createdId) setCreatedOrderId(createdId);
            setShowPaymentSuccessModal(true);
            setStep(3);

            try {
                await fetchCart();
            } catch (_e) {
                // ignore
            }

            setLoading(false);

        } catch (error) {
            const msg =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                'Failed to initiate payment. Please try again.';
            setError(msg);
            setLoading(false);
        }
    };

    const closeSuccessModal = () => {
        setShowPaymentSuccessModal(false);
    };

    const goToOrders = () => {
        setShowPaymentSuccessModal(false);
        navigate('/orders');
    };

    const goToHome = () => {
        setShowPaymentSuccessModal(false);
        navigate('/');
    };

    if (step === 3) {
        return (
            <>
                {showPaymentSuccessModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center relative">
                            <button
                                type="button"
                                onClick={closeSuccessModal}
                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                                aria-label="Close"
                            >
                                ×
                            </button>
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <FaLock className="h-6 w-6 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                            <p className="text-gray-600 mb-4">
                                Your order has been successfully placed and will be delivered soon.
                            </p>
                            {createdOrderId && (
                                <p className="text-sm text-gray-500 mb-6">
                                    Order ID: <span className="font-mono">{createdOrderId}</span>
                                </p>
                            )}
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={goToHome}
                                    className="block w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
                                >
                                    Continue Shopping
                                </button>
                                <button
                                    type="button"
                                    onClick={goToOrders}
                                    className="block w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
                                >
                                    View Orders
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <FaLock className="h-6 w-6 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
                        <p className="text-gray-600 mb-6">
                            Your order has been successfully placed and will be delivered soon.
                        </p>
                        <div className="space-y-3">
                            <Link
                                to="/"
                                className="block w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
                            >
                                Continue Shopping
                            </Link>
                            <Link
                                to="/orders"
                                className="block w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
                            >
                                View Orders
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 mb-5 sm:mb-8">
                    <Link
                        to="/cart"
                        className="inline-flex items-center text-[13px] sm:text-base text-gray-600 hover:text-gray-900"
                    >
                        <FaArrowLeft className="mr-2" />
                        Back to Cart
                    </Link>
                    <h1 className="ml-0 sm:ml-4 text-xl sm:text-3xl font-bold text-gray-900">Checkout</h1>
                </div>

                {/* Progress Steps */}
                <div className="mb-5 sm:mb-8">
                    <div className="flex items-center justify-between">
                        <div className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                                1
                            </div>
                            <span className="hidden sm:inline ml-2">Address</span>
                        </div>
                        <div className={`hidden sm:block flex-1 h-1 mx-4 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
                        <div className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                                2
                            </div>
                            <span className="hidden sm:inline ml-2">Payment</span>
                        </div>
                        <div className={`hidden sm:block flex-1 h-1 mx-4 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
                        <div className={`flex items-center ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                                3
                            </div>
                            <span className="hidden sm:inline ml-2">Success</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {step === 1 && (
                            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                                <h2 className="text-lg sm:text-xl font-semibold mb-4">Shipping Address</h2>
                                <form onSubmit={handleAddressSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
                                        <input
                                            type="text"
                                            name="addressLine1"
                                            value={formData.addressLine1}
                                            onChange={handleChange}
                                            required
                                            placeholder="Street address"
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
                                        <input
                                            type="text"
                                            name="addressLine2"
                                            value={formData.addressLine2}
                                            onChange={handleChange}
                                            placeholder="Apartment, suite, etc. (optional)"
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">City</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">State</label>
                                            <input
                                                type="text"
                                                name="state"
                                                value={formData.state}
                                                onChange={handleChange}
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                                            <input
                                                type="text"
                                                name="postalCode"
                                                value={formData.postalCode}
                                                onChange={handleChange}
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Country</label>
                                            <input
                                                type="text"
                                                name="country"
                                                value={formData.country}
                                                onChange={handleChange}
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700"
                                    >
                                        Continue to Payment
                                    </button>
                                </form>
                            </div>
                        )}

                        {step === 2 && (
                            <>
                            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
                                <div className="space-y-3">
                                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="phonepe"
                                            checked={formData.paymentMethod === 'phonepe'}
                                            onChange={handleChange}
                                            className="mr-3"
                                        />
                                        <div className="flex items-center">
                                            <FaCreditCard className="text-indigo-600 mr-2" />
                                            <span className="font-medium">PhonePe</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="upi"
                                            checked={formData.paymentMethod === 'upi'}
                                            onChange={handleChange}
                                            className="mr-3"
                                        />
                                        <div className="flex items-center">
                                            <FaCreditCard className="text-indigo-600 mr-2" />
                                            <span className="font-medium">UPI Payment</span>
                                        </div>
                                    </label>

                                    {isCodAllowedForAll ? (
                                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="cod"
                                                checked={formData.paymentMethod === 'cod'}
                                                onChange={handleChange}
                                                className="mr-3"
                                            />
                                            <div className="flex items-center">
                                                <FaCreditCard className="text-indigo-600 mr-2" />
                                                <span className="font-medium">Cash on Delivery</span>
                                            </div>
                                        </label>
                                    ) : null}
                                </div>
                            </div>

                            <div className="lg:hidden bg-white rounded-lg shadow-md p-4 sm:p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">{formatCurrency(subtotalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tax (18%)</span>
                                        <span className="font-medium">{formatCurrency(taxAmount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Shipping</span>
                                        <span className="font-medium">{SHIPPING_AMOUNT === 0 ? 'Free' : formatCurrency(SHIPPING_AMOUNT)}</span>
                                    </div>
                                    {formData.paymentMethod === 'cod' ? (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">COD charge</span>
                                            <span className="font-medium">{formatCurrency(codChargeTotal)}</span>
                                        </div>
                                    ) : null}
                                    <div className="border-t pt-2 flex justify-between">
                                        <span className="font-semibold">Total</span>
                                        <span className="font-semibold">{formatCurrency(payableAmount)}</span>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handlePayment}
                                disabled={loading}
                                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : `Pay ${formatCurrency(payableAmount)}`}
                            </button>

                            <button
                                onClick={() => setStep(1)}
                                className="w-full mt-3 border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50"
                            >
                                Back to Address
                            </button>
                            </>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="hidden lg:block lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div key={`${item.product._id}-${item.size || ''}-${item.color || ''}`} className="flex items-center space-x-4">
                                        <img
                                            src={item.image || item.product?.image || item.product?.galleryImages?.[0] || ''}
                                            alt={item.product.name}
                                            className="w-16 h-16 object-cover rounded-md"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-medium text-sm">{item.product.name}</h3>
                                            <p className="text-gray-500 text-sm">Qty: {item.quantity}</p>
                                            {(item?.size || item?.color) ? (
                                                <p className="text-gray-500 text-xs">
                                                    {item?.size ? `Size: ${item.size}` : ''}{item?.size && item?.color ? ' | ' : ''}{item?.color ? `Color: ${item.color}` : ''}
                                                </p>
                                            ) : null}
                                            <p className="font-semibold">₹{((item.price ?? item.product?.price ?? 0) * item.quantity).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}

                                <div className="border-t pt-4">
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(subtotalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Shipping</span>
                                        <span>{SHIPPING_AMOUNT === 0 ? 'Free' : formatCurrency(SHIPPING_AMOUNT)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Tax (18%)</span>
                                        <span>{formatCurrency(taxAmount)}</span>
                                    </div>
                                    {formData.paymentMethod === 'cod' ? (
                                        <div className="flex justify-between text-sm">
                                            <span>COD charge</span>
                                            <span>{formatCurrency(codChargeTotal)}</span>
                                        </div>
                                    ) : null}
                                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                                        <span>Total</span>
                                        <span>{formatCurrency(payableAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
