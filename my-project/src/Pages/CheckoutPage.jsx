import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useContentSettings } from '../context/ContentSettingsContext';
import { apiClient } from '../api/client';
import { FaArrowLeft } from 'react-icons/fa';
import { FiShoppingCart, FiUser, FiCheck, FiMapPin } from 'react-icons/fi';

const CheckoutPage = () => {
    const { items, fetchCart, clearCart } = useCart();
    const { user } = useAuth();
    const { settings } = useContentSettings();
    const location = useLocation();
    const navigate = useNavigate();

    const buyNowItems = useMemo(() => {
        try {
            const raw = sessionStorage.getItem('trozzy_buy_now');
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            const list = Array.isArray(parsed?.items) ? parsed.items : [];
            return list.filter((it) => {
                if (!it || typeof it !== 'object') return false;
                const pid = it?.product?._id || it?.product || it?._id || it?.productId;
                return Boolean(pid);
            });
        } catch (_e) {
            return [];
        }
    }, []);

    const isBuyNowMode = useMemo(() => {
        try {
            const sp = new URLSearchParams(location.search || '');
            return sp.get('mode') === 'buynow' && buyNowItems.length > 0;
        } catch (_e) {
            return buyNowItems.length > 0;
        }
    }, [location.search, buyNowItems.length]);

    const userKey = useMemo(() => {
        const uid = user?._id || user?.id || user?.userId;
        return uid ? String(uid) : 'guest';
    }, [user]);

    const storageKey = useMemo(() => `trozzy_addresses_${userKey}`, [userKey]);

    const normalizedCartItems = Array.isArray(items)
        ? items.filter((it) => {
            if (!it || typeof it !== 'object') return false;
            const pid = it?.product?._id || it?.product || it?._id || it?.productId;
            return Boolean(pid);
        })
        : [];

    const normalizedItems = isBuyNowMode ? buyNowItems : normalizedCartItems;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [isAddingNew, setIsAddingNew] = useState(false);

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
        paymentMethod: 'phonepe',
    });

    const isCodEligible = useMemo(() => {
        if (!Array.isArray(normalizedItems) || normalizedItems.length === 0) return false;
        const globalEnabled = settings?.enableCod !== false;
        if (!globalEnabled) return false;
        return normalizedItems.every((it) => {
            const p = it?.product || {};
            const codEnabled = typeof p?.codAvailable === 'boolean' ? p.codAvailable : Boolean(p?.management?.shipping?.codAvailable);
            return Boolean(codEnabled);
        });
    }, [normalizedItems, settings?.enableCod]);

    useEffect(() => {
        if (!isCodEligible && formData.paymentMethod === 'cod') {
            setFormData((prev) => ({ ...prev, paymentMethod: 'phonepe' }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCodEligible]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(storageKey);
            const list = raw ? JSON.parse(raw) : [];
            const safe = Array.isArray(list) ? list.filter((a) => a && typeof a === 'object' && a.id) : [];
            setSavedAddresses(safe);
            const def = safe.find((a) => a.isDefault);
            const initialId = def?.id || safe[0]?.id || '';
            setSelectedAddressId(initialId);
            setIsAddingNew(safe.length === 0);
        } catch (_e) {
            setSavedAddresses([]);
            setSelectedAddressId('');
            setIsAddingNew(true);
        }
    }, [storageKey]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (normalizedItems.length === 0) {
            navigate('/cart');
            return;
        }
    }, [user, normalizedItems.length, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const TAX_RATE = Number(process.env.REACT_APP_TAX_RATE ?? 0.18);
    const roundMoney = (v) => Math.round((Number(v ?? 0) || 0) * 100) / 100;
    const roundRupees = (v) => Math.round(Number(v ?? 0) || 0);

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

    const SHIPPING_AMOUNT = roundMoney(computeShipping(normalizedItems));
    const subtotalAmount = roundMoney(computeSubtotal(normalizedItems));
    const taxAmount = roundMoney(subtotalAmount * TAX_RATE);
    const codChargeTotal = Array.isArray(normalizedItems) ? roundMoney(normalizedItems.reduce((sum, item) => {
        const p = item?.product;
        const codEnabled = typeof p?.codAvailable === 'boolean' ? p.codAvailable : Boolean(p?.management?.shipping?.codAvailable);
        if (!codEnabled) return sum;
        const charge = Number(p?.codCharge ?? p?.management?.shipping?.codCharge ?? 0) || 0;
        const qty = Number(item?.quantity ?? 0) || 0;
        return sum + charge * qty;
    }, 0)) : 0;

    const rawPayableAmount = roundMoney(
        subtotalAmount + SHIPPING_AMOUNT + taxAmount + (formData.paymentMethod === 'cod' ? codChargeTotal : 0)
    );
    const payableAmount = roundRupees(rawPayableAmount);

    const customerName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();

    const saveAddress = () => {
        setError('');

        if (!formData.addressLine1 || !formData.city || !formData.state || !formData.postalCode) {
            setError('Please fill in all required address fields');
            return;
        }

        const newId = `addr_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const next = [
            {
                id: newId,
                isDefault: savedAddresses.length === 0,
                name: customerName,
                phone: formData.phone,
                line1: formData.addressLine1,
                line2: formData.addressLine2,
                city: formData.city,
                state: formData.state,
                postalCode: formData.postalCode,
                country: formData.country,
            },
            ...savedAddresses,
        ];
        setSavedAddresses(next);
        setSelectedAddressId(newId);
        setIsAddingNew(false);
        try {
            localStorage.setItem(storageKey, JSON.stringify(next));
        } catch (_e) {
            // ignore
        }
    };

    const goToPayment = async () => {
        setError('');
        const selected = savedAddresses.find((a) => a.id === selectedAddressId);
        if (!selected) {
            setError('Please select an address');
            return;
        }

        try {
            localStorage.setItem('trozzy_last_checkout_mode', isBuyNowMode ? 'buynow' : 'cart');
        } catch (_e) {
            // ignore
        }

        const orderItems = normalizedItems
            .map((it) => {
                const p = it?.product || {};
                const productId = p?._id || it?.productId || it?.product || it?._id;
                const name = p?.name || it?.name;
                const price = Number(it?.price ?? p?.price ?? 0) || 0;
                const quantity = Number(it?.quantity ?? 0) || 0;
                if (!productId || !name || !price || !quantity) return null;
                return {
                    productId: String(productId),
                    name: String(name),
                    price,
                    quantity,
                    selectedSize: it?.selectedSize || it?.size || '',
                    selectedColor: it?.selectedColor || it?.color || '',
                    selectedImage: it?.selectedImage || it?.image || p?.image || '',
                };
            })
            .filter(Boolean);

        if (!orderItems.length) {
            setError('Invalid order items. Please go back and try again.');
            return;
        }

        const customer = {
            name: selected?.name || customerName,
            email: formData.email,
            phone: selected?.phone || formData.phone,
        };

        const address = {
            line1: selected?.line1 || '',
            line2: selected?.line2 || '',
            city: selected?.city || '',
            state: selected?.state || '',
            postalCode: selected?.postalCode || '',
            country: selected?.country || 'India',
        };

        if (formData.paymentMethod === 'cod') {
            if (!isCodEligible) {
                setError('Cash on Delivery is not available for one or more items in your cart.');
                return;
            }

            setLoading(true);
            try {
                try { await fetchCart(); } catch (_e) {}

                if (isBuyNowMode) {
                    try { sessionStorage.removeItem('trozzy_buy_now'); } catch (_e2) {}
                }

                const resp = await apiClient.post('/orders/cod', {
                    currency: 'INR',
                    subtotal: subtotalAmount,
                    shipping: SHIPPING_AMOUNT,
                    tax: taxAmount,
                    codCharge: codChargeTotal,
                    total: payableAmount,
                    paymentMethod: 'cod',
                    items: orderItems,
                    customer,
                    address,
                });

                const data = resp?.data;
                if (!data?.success) {
                    throw new Error(data?.message || data?.error || 'Failed to place COD order');
                }

                if (!isBuyNowMode) {
                    try { await clearCart(); } catch (_e3) {}
                }

                navigate('/summary', {
                    replace: true,
                    state: {
                        orderId: String(data?.id || ''),
                        orderNumber: String(data?.orderNumber || ''),
                        items: normalizedItems,
                        subtotal: subtotalAmount,
                        shipping: SHIPPING_AMOUNT,
                        tax: taxAmount,
                        codCharge: codChargeTotal,
                        total: payableAmount,
                        paymentMethod: 'cod',
                        customer,
                        address,
                    },
                });
                return;
            } catch (e) {
                const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Failed to place COD order';
                setError(String(msg));
                return;
            } finally {
                setLoading(false);
            }
        }

        const orderData = {
            currency: 'INR',
            subtotal: subtotalAmount,
            shipping: SHIPPING_AMOUNT,
            tax: taxAmount,
            codCharge: 0,
            total: payableAmount,
            paymentMethod: 'phonepe',
            items: orderItems,
            customer,
            address,
        };

        const amountRupees = Math.round(Number(payableAmount ?? orderData.total ?? 0) || 0);
        if (!amountRupees || amountRupees <= 0) {
            setError('Invalid amount');
            return;
        }

        const returnUrl = `${window.location.origin}/summary`;

        setLoading(true);
        try {
            try { await fetchCart(); } catch (_e) {}

            if (isBuyNowMode) {
                try { sessionStorage.removeItem('trozzy_buy_now'); } catch (_e2) {}
            }

            const resp = await apiClient.post('/payments/create-order', {
                amount: amountRupees,
                currency: 'INR',
                provider: 'phonepe',
                orderData,
                returnUrl,
            });

            const data = resp?.data;
            const nextUrl = data?.nextAction?.url;
            if (!nextUrl) {
                throw new Error(data?.message || data?.error || 'PhonePe initiation failed');
            }

            try {
                localStorage.setItem('lastPaymentProviderOrderId', String(data?.providerOrderId || ''));
                localStorage.setItem('lastPaymentId', String(data?.paymentId || ''));
                localStorage.setItem('lastOrderId', String(data?.orderId || ''));
            } catch (_e) {
                // ignore
            }

            window.location.assign(String(nextUrl));
        } catch (e) {
            const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Failed to initiate PhonePe payment';
            setError(String(msg));
            navigate('/payment', {
                state: {
                    items: normalizedItems,
                    subtotal: subtotalAmount,
                    shipping: SHIPPING_AMOUNT,
                    tax: taxAmount,
                    total: payableAmount,
                    amount: payableAmount,
                    customer,
                    address,
                }
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-3 sm:px-6">
            <div className="max-w-4xl mx-auto">
                <div className="py-4 sm:py-8 px-3 sm:px-6 lg:px-8 overflow-x-hidden pb-24 sm:pb-0">
                    <div className="sm:hidden flex items-center justify-between mb-3">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200"
                        >
                            <FaArrowLeft className="text-gray-700" />
                        </button>
                        <div className="text-[18px] font-bold text-gray-900">Delivery Address</div>
                        <div className="flex items-center gap-2">
                            <Link to="/profile" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200">
                                <FiUser className="text-gray-700" />
                            </Link>
                            <Link to="/cart" className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200">
                                <FiShoppingCart className="text-gray-700" />
                                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#5A0B5A] text-white text-[11px] font-bold flex items-center justify-center">
                                    {normalizedItems.reduce((sum, item) => sum + (Number(item?.quantity ?? 0) || 0), 0)}
                                </span>
                            </Link>
                        </div>

                        <div className="mt-5">
                            <div className="text-sm font-extrabold text-gray-900">Payment Method</div>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: 'phonepe' }))}
                                    className={`w-full text-left rounded-xl border p-4 transition ${formData.paymentMethod === 'phonepe' ? 'border-[#5A0B5A] ring-1 ring-[#5A0B5A]/30 bg-[#F5EAF4]' : 'border-gray-200 bg-white'}`}
                                >
                                    <div className="text-[13px] font-extrabold text-gray-900">Pay Online (UPI)</div>
                                    <div className="text-[12px] text-gray-600 mt-1">PhonePe payment</div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isCodEligible) return;
                                        setFormData((prev) => ({ ...prev, paymentMethod: 'cod' }));
                                    }}
                                    disabled={!isCodEligible}
                                    className={`w-full text-left rounded-xl border p-4 transition ${formData.paymentMethod === 'cod' ? 'border-[#5A0B5A] ring-1 ring-[#5A0B5A]/30 bg-[#F5EAF4]' : 'border-gray-200 bg-white'} ${!isCodEligible ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="text-[13px] font-extrabold text-gray-900">Cash on Delivery</div>
                                    <div className="text-[12px] text-gray-600 mt-1">
                                        {isCodEligible
                                            ? `COD charge: ₹${Number(codChargeTotal || 0).toFixed(2)}`
                                            : (settings?.enableCod === false ? 'COD is disabled by admin' : 'Not available for one or more items')}
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="sm:hidden mb-3">
                        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2.5">
                            <div className="flex items-center justify-between text-[10px]">
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-600 text-white">
                                        <FiCheck className="w-4 h-4" />
                                    </div>
                                    <span className="font-semibold">Cart</span>
                                </div>
                                <div className="flex-1 h-[2px] mx-1.5 bg-emerald-200" />
                                <div className="flex items-center gap-1.5 text-[#5A0B5A]">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#5A0B5A] text-white">2</div>
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

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8 min-w-0">
                        <div className="lg:col-span-2 min-w-0">
                            {isAddingNew ? (
                                <div className="bg-white rounded-xl border border-gray-200 p-4">
                                    <div className="text-[15px] font-bold text-gray-900">Add Delivery Address</div>
                                    <div className="mt-4 space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[12px] font-semibold text-gray-700">Full Name</label>
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    value={formData.firstName}
                                                    onChange={handleChange}
                                                    placeholder="Full name"
                                                    className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#5A0B5A]/20 focus:border-[#5A0B5A]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[12px] font-semibold text-gray-700">Phone Number</label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    placeholder="10-digit mobile"
                                                    className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#5A0B5A]/20 focus:border-[#5A0B5A]"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[12px] font-semibold text-gray-700">Address</label>
                                            <input
                                                type="text"
                                                name="addressLine1"
                                                value={formData.addressLine1}
                                                onChange={handleChange}
                                                placeholder="House no., Street, Area"
                                                className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#5A0B5A]/20 focus:border-[#5A0B5A]"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[12px] font-semibold text-gray-700">City</label>
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleChange}
                                                    className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#5A0B5A]/20 focus:border-[#5A0B5A]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[12px] font-semibold text-gray-700">State</label>
                                                <input
                                                    type="text"
                                                    name="state"
                                                    value={formData.state}
                                                    onChange={handleChange}
                                                    className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#5A0B5A]/20 focus:border-[#5A0B5A]"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[12px] font-semibold text-gray-700">Pincode</label>
                                            <input
                                                type="text"
                                                name="postalCode"
                                                value={formData.postalCode}
                                                onChange={handleChange}
                                                placeholder="6-digit pincode"
                                                className="mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#5A0B5A]/20 focus:border-[#5A0B5A]"
                                            />
                                        </div>

                                        {error ? (
                                            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-[13px]">{error}</div>
                                        ) : null}

                                        <button
                                            type="button"
                                            onClick={saveAddress}
                                            className="w-full h-11 rounded-xl bg-[#5A0B5A] text-white text-sm font-extrabold"
                                        >
                                            Save Address
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsAddingNew(true);
                                            setError('');
                                        }}
                                        className="w-full h-12 rounded-xl bg-white border border-gray-200 text-[14px] font-semibold text-gray-900"
                                    >
                                        + Add New Address
                                    </button>

                                    {savedAddresses.map((addr) => {
                                        const active = addr.id === selectedAddressId;
                                        return (
                                            <button
                                                key={addr.id}
                                                type="button"
                                                onClick={() => setSelectedAddressId(addr.id)}
                                                className={`w-full text-left rounded-xl border p-4 transition ${active ? 'border-[#5A0B5A] ring-1 ring-[#5A0B5A]/30' : 'border-gray-200'}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ${active ? 'bg-[#5A0B5A] text-white' : 'bg-white border border-gray-300 text-transparent'}`}>
                                                        <FiCheck className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <FiMapPin className="text-gray-500" />
                                                            <div className="text-[14px] font-bold text-gray-900 truncate">{addr.name || customerName || 'Address'}</div>
                                                            {addr.isDefault ? (
                                                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700">Default</span>
                                                            ) : null}
                                                        </div>
                                                        {addr.phone ? (<div className="text-[13px] text-gray-600 mt-1">{addr.phone}</div>) : null}
                                                        <div className="text-[13px] text-gray-700 mt-1 leading-5">
                                                            <div>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</div>
                                                            <div>{addr.city}{addr.state ? `, ${addr.state}` : ''}, {addr.state || ''}{addr.postalCode ? ` - ${addr.postalCode}` : ''}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}

                                    {error ? (
                                        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-[13px]">{error}</div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                        <div className="hidden lg:block lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

                                <div className="mb-4">
                                    <div className="text-sm font-extrabold text-gray-900">Payment Method</div>
                                    <div className="mt-2 space-y-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: 'phonepe' }))}
                                            className={`w-full text-left rounded-xl border px-3 py-2.5 transition ${formData.paymentMethod === 'phonepe' ? 'border-[#5A0B5A] ring-1 ring-[#5A0B5A]/30 bg-[#F5EAF4]' : 'border-gray-200 bg-white'}`}
                                        >
                                            <div className="text-[13px] font-extrabold text-gray-900">Pay Online (UPI)</div>
                                            <div className="text-[12px] text-gray-600">PhonePe payment</div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!isCodEligible) return;
                                                setFormData((prev) => ({ ...prev, paymentMethod: 'cod' }));
                                            }}
                                            disabled={!isCodEligible}
                                            className={`w-full text-left rounded-xl border px-3 py-2.5 transition ${formData.paymentMethod === 'cod' ? 'border-[#5A0B5A] ring-1 ring-[#5A0B5A]/30 bg-[#F5EAF4]' : 'border-gray-200 bg-white'} ${!isCodEligible ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <div className="text-[13px] font-extrabold text-gray-900">Cash on Delivery</div>
                                            <div className="text-[12px] text-gray-600">
                                                {isCodEligible
                                                    ? `COD charge: ₹${Number(codChargeTotal || 0).toFixed(2)}`
                                                    : (settings?.enableCod === false ? 'COD is disabled by admin' : 'Not available for one or more items')}
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-semibold">₹{subtotalAmount.toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tax</span>
                                        <span className="font-semibold">₹{taxAmount.toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Shipping</span>
                                        <span className="font-semibold">{SHIPPING_AMOUNT === 0 ? 'FREE' : `₹${SHIPPING_AMOUNT.toFixed(0)}`}</span>
                                    </div>
                                    {formData.paymentMethod === 'cod' ? (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">COD Charge</span>
                                            <span className="font-semibold">₹{codChargeTotal.toFixed(0)}</span>
                                        </div>
                                    ) : null}
                                    <div className="border-t pt-2 flex justify-between">
                                        <span className="font-bold">Total</span>
                                        <span className="font-extrabold">₹{payableAmount.toFixed(0)}</span>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <Link
                                        to="/cart"
                                        className="flex-1 border-2 border-[#5A0B5A] text-[#5A0B5A] py-3 rounded-lg font-semibold text-center hover:bg-[#5A0B5A] hover:text-white transition-colors"
                                    >
                                        Back to Cart
                                    </Link>

                                    <button
                                        onClick={goToPayment}
                                        disabled={loading || !selectedAddressId || isAddingNew}
                                        className="flex-1 bg-[#5A0B5A] text-white py-3 rounded-lg font-semibold hover:bg-[#4A0A4A] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Processing...' : (formData.paymentMethod === 'cod' ? 'Place COD Order' : 'Continue to Payment')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-[16px] font-extrabold text-[#5A0B5A] truncate">₹{payableAmount.toFixed(0)}</div>
                                <div className="text-[12px] text-gray-500">Inclusive of all taxes</div>
                            </div>
                            <button
                                type="button"
                                onClick={goToPayment}
                                disabled={loading || !selectedAddressId || isAddingNew}
                                className="h-12 px-6 inline-flex items-center justify-center rounded-xl bg-[#C97BCB] disabled:bg-[#E7C6E7] text-white text-sm font-extrabold shadow-sm flex-1"
                            >
                                {loading ? 'Processing...' : (formData.paymentMethod === 'cod' ? 'Place COD Order' : 'Continue to Payment')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
