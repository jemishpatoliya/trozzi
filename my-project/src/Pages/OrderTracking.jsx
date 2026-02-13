import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiPackage, FiTruck, FiCheck, FiClock, FiMapPin, FiCreditCard, FiCalendar, FiUser, FiArrowRight, FiStar, FiX } from 'react-icons/fi';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { useLocation } from 'react-router-dom';

const FALLBACK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const OrderTracking = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [orders, setOrders] = useState([]);
    const ordersRef = useRef([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [shipmentTimeline, setShipmentTimeline] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [error, setError] = useState('');

    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewItem, setReviewItem] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewTitle, setReviewTitle] = useState('');
    const [reviewComment, setReviewComment] = useState('');
    const [reviewImages, setReviewImages] = useState([]);
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState('');
    const [counts, setCounts] = useState({
        totalOrders: 0,
        newCount: 0,
        processingCount: 0,
        shippedCount: 0,
        deliveredCount: 0,
        cancelledCount: 0,
    });

    const orderStatuses = {
        new: { label: 'Order Placed', icon: <FiPackage />, color: 'text-info-600 bg-info-50' },
        processing: { label: 'Processing', icon: <FiClock />, color: 'text-warning-600 bg-warning-50' },
        paid: { label: 'Paid', icon: <FiCreditCard />, color: 'text-info-600 bg-info-50' },
        shipped: { label: 'Shipped', icon: <FiTruck />, color: 'text-warning-600 bg-warning-50' },
        delivered: { label: 'Delivered', icon: <FiCheck />, color: 'text-success-600 bg-success-50' },
        cancelled: { label: 'Cancelled', icon: <FiClock />, color: 'text-danger-600 bg-danger-50' }
    };

    const baseStatusFlow = ['new', 'processing', 'shipped', 'delivered'];

    const computeCountsFromOrders = (list) => {
        const rows = Array.isArray(list) ? list : [];
        const next = {
            totalOrders: rows.length,
            newCount: rows.filter((o) => (o?.status || 'new') === 'new').length,
            processingCount: rows.filter((o) => (o?.status || '') === 'processing').length,
            shippedCount: rows.filter((o) => (o?.status || '') === 'shipped').length,
            deliveredCount: rows.filter((o) => (o?.status || '') === 'delivered').length,
            cancelledCount: rows.filter((o) => (o?.status || '') === 'cancelled').length,
        };
        return next;
    };

    const getStatusFlow = (currentStatus) => {
        if (currentStatus === 'cancelled') return [...baseStatusFlow.slice(0, 1), 'cancelled'];
        return baseStatusFlow;
    };

    useEffect(() => {
        let cancelled = false;

        const loadOrders = async () => {
            setLoading(true);
            setError('');

            try {
                if (!user) {
                    if (!cancelled) setOrders([]);
                    return;
                }

                const response = await apiClient.get('/orders/my');
                const payload = response?.data;
                const dataRaw = Array.isArray(payload?.data) ? payload.data : [];
                const data = dataRaw.map((o) => {
                    const rawStatus = String(o?.status || 'new').toLowerCase();
                    const status = rawStatus === 'returned' ? 'cancelled' : rawStatus;
                    return { ...o, status };
                });

                if (!cancelled) {
                    setOrders(data);
                    ordersRef.current = data;
                    setCounts((prev) => ({ ...prev, ...computeCountsFromOrders(data) }));
                }
            } catch (e) {
                const message = e?.response?.data?.message || e?.message || 'Failed to load orders';
                if (!cancelled) {
                    setError(message);
                    setOrders([]);
                    ordersRef.current = [];
                    setCounts((prev) => ({ ...prev, ...computeCountsFromOrders([]) }));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        const loadCounts = async () => {
            try {
                if (!user) {
                    if (!cancelled) {
                        setCounts({ totalOrders: 0, newCount: 0, processingCount: 0, shippedCount: 0, deliveredCount: 0, cancelledCount: 0 });
                    }
                    return;
                }
                const response = await apiClient.get('/orders/stats');
                const payload = response?.data;
                const next = payload?.data;
                if (!cancelled && next) {
                    const safeNext = {
                        totalOrders: Number(next?.totalOrders ?? 0) || 0,
                        newCount: Number(next?.newCount ?? 0) || 0,
                        processingCount: Number(next?.processingCount ?? 0) || 0,
                        shippedCount: Number(next?.shippedCount ?? 0) || 0,
                        deliveredCount: Number(next?.deliveredCount ?? 0) || 0,
                        cancelledCount: Number(next?.cancelledCount ?? 0) || 0,
                    };
                    setCounts((prev) => ({ ...prev, ...safeNext }));
                }
            } catch (_e) {
                if (!cancelled) {
                    setCounts((prev) => ({ ...prev, ...computeCountsFromOrders(ordersRef.current) }));
                }
            }
        };

        const token = localStorage.getItem('token');
        const socketUrl = process.env.REACT_APP_SOCKET_URL || window.location.origin;

        const socket = io(socketUrl, {
            auth: token ? { token } : {},
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 800,
            timeout: 8000,
        });

        socket.on('order:status_changed', (evt) => {
            const id = String(evt?.id || '');
            const status = String(evt?.status || '').toLowerCase();
            if (!id || !status) return;

            setOrders((prev) => {
                const next = prev.map((o) => (String(o?.id) === id ? { ...o, status } : o));
                ordersRef.current = next;
                setCounts((c) => ({ ...c, ...computeCountsFromOrders(next) }));
                return next;
            });
        });

        socket.on('payment:status_changed', (evt) => {
            // Reflect payment status in orders if needed
            setOrders(prev => prev.map(o => {
                if (o.id === evt.orderId || o.orderNumber === evt.orderId) {
                    return { ...o, lastPaymentStatus: evt.status };
                }
                return o;
            }));
        });

        socket.on('shipment:status_changed', (evt) => {
            setOrders(prev => {
                const idx = prev.findIndex(o => o.id === evt.orderId);
                if (idx !== -1) {
                    const updated = [...prev];
                    updated[idx] = { ...updated[idx], shipment: evt };
                    return updated;
                }
                return prev;
            });
        });

        socket.on('connect', () => {
            // connected
        });

        socket.on('connect_error', (_err) => {
            // ignore noisy connection errors in UI
        });

        loadOrders();
        loadCounts();

        return () => {
            cancelled = true;
            socket.off('connect_error');
            socket.disconnect();
        };
    }, [user]);

    useEffect(() => {
        const params = new URLSearchParams(location.search || '');
        const id = String(params.get('id') || '').trim();
        if (!id) return;
        if (loading) return;

        const found = (Array.isArray(orders) ? orders : []).find((o) => String(o?.id || '') === id);
        if (found) {
            openOrder(found);
        }
    }, [location.search, loading, orders, openOrder]);

    const getStatusIndex = (flow, status) => {
        return flow.indexOf(status);
    };

    const isStatusCompleted = (flow, currentStatus, checkStatus) => {
        const current = getStatusIndex(flow, currentStatus);
        const check = getStatusIndex(flow, checkStatus);
        if (check === -1 || current === -1) return false;
        return current >= check;
    };

    const isStatusActive = (flow, currentStatus, checkStatus) => {
        const current = getStatusIndex(flow, currentStatus);
        const check = getStatusIndex(flow, checkStatus);
        if (check === -1 || current === -1) return false;
        return current === check;
    };

    const buildStatusHistory = (createdAtIso, currentStatus) => {
        const flow = getStatusFlow(currentStatus);
        const currentIndex = flow.indexOf(currentStatus);
        const cappedIndex = currentIndex === -1 ? 0 : currentIndex;

        return flow.slice(0, cappedIndex + 1).map((s) => ({
            status: s,
            timestamp: createdAtIso,
            note: orderStatuses[s]?.label || s,
        }));
    };

    const normalizeOrderDetail = (raw) => {
        const createdAtIso = raw?.createdAtIso || raw?.date || new Date().toISOString();
        const rawStatus = String(raw?.status || 'new').toLowerCase();
        const status = rawStatus === 'returned' ? 'cancelled' : rawStatus;

        const payment = raw?.payment && typeof raw.payment === 'object' ? raw.payment : null;

        return {
            id: raw?.id,
            orderNumber: raw?.orderNumber || raw?.id,
            createdAt: createdAtIso,
            status,
            items: Array.isArray(raw?.items) ? raw.items : [],
            totalAmount: Number(raw?.total ?? 0),
            paymentMethod: raw?.paymentMethod || payment?.paymentMethod || payment?.provider || 'Online',
            paymentMode: payment?.paymentMode || '',
            payerVpa: payment?.payerVpa || '',
            transactionId: payment?.transactionId || '',
            shippingAddress: {
                name: raw?.customer?.name || '',
                street: raw?.address?.line1 || '',
                city: raw?.address?.city || '',
                state: raw?.address?.state || '',
                zipCode: raw?.address?.postalCode || '',
                country: raw?.address?.country || '',
            },
            trackingNumber: raw?.trackingNumber || null,
            courierName: raw?.courierName || null,
            statusHistory: buildStatusHistory(createdAtIso, status),
        };
    };

    const normalizeShipmentTimeline = (raw) => {
        const data = raw?.data || raw;
        const shipment = data?.shipment || null;
        const timeline = Array.isArray(data?.timeline) ? data.timeline : [];

        const normalizedTimeline = timeline
            .map((t, idx) => ({
                key: `${idx}_${String(t?.at || '')}_${String(t?.source || '')}`,
                at: t?.at || '',
                status: String(t?.status || ''),
                location: String(t?.location || ''),
                activity: String(t?.activity || ''),
                source: String(t?.source || ''),
            }))
            .filter((t) => t.at || t.status || t.activity || t.location);

        return {
            shipment: shipment ? {
                awbNumber: String(shipment?.awbNumber || ''),
                courierName: String(shipment?.courierName || ''),
                trackingUrl: String(shipment?.trackingUrl || ''),
                status: String(shipment?.status || ''),
                estimatedDelivery: shipment?.estimatedDelivery || null,
                updatedAt: shipment?.updatedAt || null,
            } : null,
            timeline: normalizedTimeline,
        };
    };

    const formatCurrency = (value) => {
        const n = Number(value ?? 0) || 0;
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
    };

    const openOrder = useCallback(async (orderSummary) => {
        setDetailsLoading(true);
        setError('');
        setShipmentTimeline(null);

        try {
            const response = await apiClient.get(`/orders/${orderSummary.id}`);
            const raw = response?.data?.data ?? response?.data;
            const normalized = normalizeOrderDetail(raw);
            setSelectedOrder(normalized);

            try {
                const trackingRes = await apiClient.get(`/orders/${orderSummary.id}/shipment-timeline`);
                const trackingRaw = trackingRes?.data;
                setShipmentTimeline(normalizeShipmentTimeline(trackingRaw));
            } catch (_e) {
                setShipmentTimeline(null);
            }
        } catch (e) {
            const message = e?.response?.data?.message || e?.message || 'Failed to load order details';
            setError(message);
        } finally {
            setDetailsLoading(false);
        }
    }, []);

    const openReviewModal = (item) => {
        setReviewItem(item);
        setReviewRating(5);
        setReviewTitle('');
        setReviewComment('');
        setReviewImages([]);
        setReviewError('');
        setReviewModalOpen(true);
    };

    const closeReviewModal = () => {
        setReviewModalOpen(false);
        setReviewItem(null);
        setReviewError('');
    };

    const uploadReviewImage = async (file) => {
        const fd = new FormData();
        fd.append('image', file);
        const res = await apiClient.post('/upload/image?folder=reviews', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        const url = res?.data?.url;
        if (!url) throw new Error('Upload failed');
        return String(url);
    };

    const handleReviewImageChange = async (e) => {
        const files = Array.from(e?.target?.files || []).slice(0, 5);
        if (files.length === 0) return;

        try {
            setReviewError('');
            const urls = [];
            for (const f of files) {
                // eslint-disable-next-line no-await-in-loop
                const url = await uploadReviewImage(f);
                urls.push(url);
            }
            setReviewImages((prev) => [...prev, ...urls].slice(0, 5));
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to upload image';
            setReviewError(String(msg));
        } finally {
            try {
                if (e?.target) e.target.value = '';
            } catch (_e2) {
                // ignore
            }
        }
    };

    const submitReview = async () => {
        if (!reviewItem?.productId) {
            setReviewError('Missing product');
            return;
        }
        if (!reviewTitle.trim()) {
            setReviewError('Title is required');
            return;
        }
        if (!reviewComment.trim()) {
            setReviewError('Comment is required');
            return;
        }

        setReviewSubmitting(true);
        setReviewError('');
        try {
            await apiClient.post(`/products/${reviewItem.productId}/reviews`, {
                rating: Number(reviewRating) || 5,
                title: reviewTitle.trim(),
                comment: reviewComment.trim(),
                images: reviewImages,
            });
            closeReviewModal();
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to submit review';
            setReviewError(String(msg));
        } finally {
            setReviewSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-text-600 dark:text-text-400">Loading your orders...</p>
                </div>
            </div>   
        );
    }

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-900 py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
                        <FiTruck className="text-3xl text-primary-600 dark:text-primary-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-text-900 dark:text-text-100 mb-3">
                        Order Tracking
                    </h1>
                    <p className="text-lg text-text-600 dark:text-text-400 max-w-2xl mx-auto">
                        Track your orders and view delivery status in real-time
                    </p>
                </div>

                {!selectedOrder ? (
                    /* Orders List */
                    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-border-200 dark:border-border-700">
                        <div className="p-6 border-b border-border-200 dark:border-border-700">
                            <h2 className="text-xl font-semibold text-text-900 dark:text-text-100">
                                Your Orders
                            </h2>
                            <p className="text-text-600 dark:text-text-400 mt-1">
                                {orders.length} order{orders.length !== 1 ? 's' : ''} found
                            </p>
                        </div>

                        <div className="p-6 border-b border-border-200 dark:border-border-700">
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                <div className="rounded-lg border border-border-200 dark:border-border-700 p-4 bg-surface-50 dark:bg-surface-900">
                                    <p className="text-sm text-text-600 dark:text-text-400">New</p>
                                    <p className="text-2xl font-bold text-text-900 dark:text-text-100">{counts.newCount}</p>
                                </div>
                                <div className="rounded-lg border border-border-200 dark:border-border-700 p-4 bg-surface-50 dark:bg-surface-900">
                                    <p className="text-sm text-text-600 dark:text-text-400">Processing</p>
                                    <p className="text-2xl font-bold text-text-900 dark:text-text-100">{counts.processingCount}</p>
                                </div>
                                <div className="rounded-lg border border-border-200 dark:border-border-700 p-4 bg-surface-50 dark:bg-surface-900">
                                    <p className="text-sm text-text-600 dark:text-text-400">Shipped</p>
                                    <p className="text-2xl font-bold text-text-900 dark:text-text-100">{counts.shippedCount}</p>
                                </div>
                                <div className="rounded-lg border border-border-200 dark:border-border-700 p-4 bg-surface-50 dark:bg-surface-900">
                                    <p className="text-sm text-text-600 dark:text-text-400">Delivered</p>
                                    <p className="text-2xl font-bold text-text-900 dark:text-text-100">{counts.deliveredCount}</p>
                                </div>
                                <div className="rounded-lg border border-border-200 dark:border-border-700 p-4 bg-surface-50 dark:bg-surface-900">
                                    <p className="text-sm text-text-600 dark:text-text-400">Cancelled</p>
                                    <p className="text-2xl font-bold text-text-900 dark:text-text-100">{counts.cancelledCount}</p>
                                </div>
                            </div>
                        </div>

                        {error ? (
                            <div className="p-12 text-center">
                                <FiClock className="text-4xl text-text-300 dark:text-text-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-text-900 dark:text-text-100 mb-2">
                                    Failed to load orders
                                </h3>
                                <p className="text-text-600 dark:text-text-400">{error}</p>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="p-12 text-center">
                                <FiPackage className="text-4xl text-text-300 dark:text-text-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-text-900 dark:text-text-100 mb-2">
                                    No orders found
                                </h3>
                                <p className="text-text-600 dark:text-text-400">
                                    You haven't placed any orders yet. Start shopping to see your orders here.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border-200 dark:divide-border-700">
                                {orders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="p-6 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors cursor-pointer"
                                        onClick={() => openOrder(order)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <h3 className="text-lg font-semibold text-text-900 dark:text-text-100">
                                                        {order.orderNumber || order.id}
                                                    </h3>
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${(orderStatuses[order.status] || orderStatuses.new).color}`}>
                                                        {(orderStatuses[order.status] || orderStatuses.new).icon}
                                                        {(orderStatuses[order.status] || orderStatuses.new).label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-6 text-sm text-text-600 dark:text-text-400">
                                                    <span className="flex items-center gap-1">
                                                        <FiCalendar />
                                                        {new Date(order.date || order.createdAtIso || order.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <FiPackage />
                                                        {Number(order.items || 0)} item{Number(order.items || 0) !== 1 ? 's' : ''}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <FiCreditCard />
                                                        {order.paymentMethod || 'Online'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-semibold text-text-900 dark:text-text-100">
                                                    ₹{Number(order.total || 0).toFixed(2)}
                                                </p>
                                                <p className="text-sm text-text-600 dark:text-text-400">
                                                    {Number(order.items || 0)} items
                                                </p>
                                            </div>
                                            <FiArrowRight className="ml-4 text-text-400" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Order Details */
                    <div className="space-y-6">
                        <button
                            onClick={() => setSelectedOrder(null)}
                            className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                        >
                            ← Back to all orders
                        </button>

                        {detailsLoading && (
                            <div className="p-6 rounded-xl bg-white dark:bg-surface-800 shadow-sm border border-border-200 dark:border-border-700">
                                <p className="text-sm text-text-600 dark:text-text-400">Loading order details...</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Order Info */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Order Header */}
                                <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-border-200 dark:border-border-700 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h2 className="text-xl font-semibold text-text-900 dark:text-text-100">
                                                Order {selectedOrder.orderNumber}
                                            </h2>
                                            <p className="text-text-600 dark:text-text-400">
                                                Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()} at {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${(orderStatuses[selectedOrder.status] || orderStatuses.new).color}`}>
                                            {(orderStatuses[selectedOrder.status] || orderStatuses.new).icon}
                                            {(orderStatuses[selectedOrder.status] || orderStatuses.new).label}
                                        </span>
                                    </div>

                                    {/* Status Timeline */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-text-900 dark:text-text-100">Order Status</h3>
                                        <div className="relative">
                                            <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border-300 dark:bg-border-600"></div>
                                            {getStatusFlow(selectedOrder.status).map((status) => {
                                                const flow = getStatusFlow(selectedOrder.status);
                                                const isCompleted = isStatusCompleted(flow, selectedOrder.status, status);
                                                const isActive = isStatusActive(flow, selectedOrder.status, status);
                                                const statusData = selectedOrder.statusHistory.find(h => h.status === status);

                                                return (
                                                    <div key={status} className="relative flex items-start mb-6 last:mb-0">
                                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 z-10 ${isCompleted
                                                            ? 'bg-success-100 border-success-600 text-success-600'
                                                            : isActive
                                                                ? 'bg-primary-100 border-primary-600 text-primary-600'
                                                                : 'bg-surface-100 dark:bg-surface-700 border-border-300 dark:border-border-600 text-text-400'
                                                            }`}>
                                                            {orderStatuses[status].icon}
                                                        </div>
                                                        <div className="ml-4 flex-1">
                                                            <h4 className={`font-medium ${isCompleted || isActive
                                                                ? 'text-text-900 dark:text-text-100'
                                                                : 'text-text-500 dark:text-text-400'
                                                                }`}>
                                                                {orderStatuses[status].label}
                                                            </h4>
                                                            {statusData && (
                                                                <p className="text-sm text-text-600 dark:text-text-400">
                                                                    {new Date(statusData.timestamp).toLocaleDateString()} - {statusData.note}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Products */}
                                <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-border-200 dark:border-border-700 p-6">
                                    <h3 className="text-lg font-semibold text-text-900 dark:text-text-100 mb-4">
                                        Order Items
                                    </h3>
                                    <div className="space-y-4">
                                        {selectedOrder.items.map((product) => (
                                            <div key={product.productId || product.id} className="flex items-center gap-4">
                                                <img
                                                    src={product.image || FALLBACK_IMAGE}
                                                    alt={product.name}
                                                    className="w-16 h-16 object-cover rounded-lg border border-border-200 dark:border-border-700"
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null;
                                                        e.currentTarget.src = FALLBACK_IMAGE;
                                                    }}
                                                />
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-text-900 dark:text-text-100">
                                                        {product.name}
                                                    </h4>
                                                    <p className="text-sm text-text-600 dark:text-text-400">
                                                        Quantity: {product.quantity}
                                                    </p>
                                                    {selectedOrder.status === 'delivered' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => openReviewModal(product)}
                                                            className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-primary-700 dark:text-primary-300 hover:underline"
                                                        >
                                                            <FiStar />
                                                            Write a Review
                                                        </button>
                                                    ) : null}
                                                </div>
                                                <p className="font-semibold text-text-900 dark:text-text-100">
                                                    {formatCurrency(product.price * product.quantity)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-border-200 dark:border-border-700">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-semibold text-text-900 dark:text-text-100">
                                                Total Amount
                                            </span>
                                            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                                ₹{Number(selectedOrder.totalAmount || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Shipping Address */}
                                <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-border-200 dark:border-border-700 p-6">
                                    <h3 className="text-lg font-semibold text-text-900 dark:text-text-100 mb-4">
                                        Shipping Address
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-start gap-2">
                                            <FiUser className="text-text-400 mt-0.5" />
                                            <span className="text-text-700 dark:text-text-300">
                                                {selectedOrder.shippingAddress.name}
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <FiMapPin className="text-text-400 mt-0.5" />
                                            <span className="text-text-700 dark:text-text-300">
                                                {selectedOrder.shippingAddress.street}<br />
                                                {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}<br />
                                                {selectedOrder.shippingAddress.country}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Info */}
                                <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-border-200 dark:border-border-700 p-6">
                                    <h3 className="text-lg font-semibold text-text-900 dark:text-text-100 mb-4">
                                        Payment Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <FiCreditCard className="text-text-400" />
                                            <span className="text-text-700 dark:text-text-300">
                                                {selectedOrder.paymentMethod}
                                            </span>
                                        </div>
                                        {selectedOrder.paymentMode ? (
                                            <div className="text-sm text-text-600 dark:text-text-400">Mode: {selectedOrder.paymentMode}</div>
                                        ) : null}
                                        {selectedOrder.payerVpa ? (
                                            <div className="text-sm text-text-600 dark:text-text-400">UPI ID: {selectedOrder.payerVpa}</div>
                                        ) : null}
                                        {selectedOrder.transactionId ? (
                                            <div className="text-xs text-text-600 dark:text-text-400 break-all">Txn: {selectedOrder.transactionId}</div>
                                        ) : null}
                                        <div className="text-sm text-text-600 dark:text-text-400">
                                            Payment processed successfully
                                        </div>
                                    </div>
                                </div>

                                {/* Tracking Info */}
                                {(selectedOrder.trackingNumber || shipmentTimeline?.shipment?.awbNumber) && (
                                    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-border-200 dark:border-border-700 p-6">
                                        <h3 className="text-lg font-semibold text-text-900 dark:text-text-100 mb-4">
                                            Tracking Information
                                        </h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-text-600 dark:text-text-400">Tracking Number</p>
                                                <p className="font-mono text-text-900 dark:text-text-100">
                                                    {shipmentTimeline?.shipment?.awbNumber || selectedOrder.trackingNumber}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-text-600 dark:text-text-400">Courier</p>
                                                <p className="text-text-900 dark:text-text-100">
                                                    {shipmentTimeline?.shipment?.courierName || selectedOrder.courierName}
                                                </p>
                                            </div>
                                            {(shipmentTimeline?.shipment?.trackingUrl) && (
                                                <a
                                                    href={shipmentTimeline.shipment.trackingUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
                                                >
                                                    Track Package
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {shipmentTimeline?.timeline?.length > 0 && (
                                    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-border-200 dark:border-border-700 p-6">
                                        <h3 className="text-lg font-semibold text-text-900 dark:text-text-100 mb-4">
                                            Tracking Timeline
                                        </h3>

                                        <div className="space-y-4">
                                            {shipmentTimeline.timeline.map((t) => (
                                                <div key={t.key} className="rounded-lg border border-border-200 dark:border-border-700 p-4 bg-surface-50 dark:bg-surface-900">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-text-900 dark:text-text-100 break-words">
                                                                {t.activity || t.status || 'Update'}
                                                            </p>
                                                            {(t.location || t.source) && (
                                                                <p className="text-xs text-text-600 dark:text-text-400 mt-1 break-words">
                                                                    {[t.location, t.source].filter(Boolean).join(' • ')}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {t.at && (
                                                            <p className="text-xs text-text-600 dark:text-text-400 whitespace-nowrap">
                                                                {new Date(t.at).toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {reviewModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-lg rounded-xl bg-white dark:bg-surface-800 border border-border-200 dark:border-border-700 shadow-lg">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-border-200 dark:border-border-700">
                                <div>
                                    <div className="text-sm font-semibold text-text-900 dark:text-text-100">Write a Review</div>
                                    <div className="text-xs text-text-600 dark:text-text-400">{reviewItem?.name || ''}</div>
                                </div>
                                <button type="button" onClick={closeReviewModal} className="p-2 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700">
                                    <FiX />
                                </button>
                            </div>

                            <div className="p-5 space-y-4">
                                {reviewError ? (
                                    <div className="text-sm text-red-600">{reviewError}</div>
                                ) : null}

                                <div>
                                    <div className="text-sm font-medium text-text-800 dark:text-text-200 mb-1">Rating</div>
                                    <select
                                        value={reviewRating}
                                        onChange={(e) => setReviewRating(Number(e.target.value) || 5)}
                                        className="w-full h-10 rounded-md border border-border-200 dark:border-border-700 bg-white dark:bg-surface-900 px-3 text-sm"
                                    >
                                        {[5, 4, 3, 2, 1].map((r) => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <div className="text-sm font-medium text-text-800 dark:text-text-200 mb-1">Title</div>
                                    <input
                                        value={reviewTitle}
                                        onChange={(e) => setReviewTitle(e.target.value)}
                                        className="w-full h-10 rounded-md border border-border-200 dark:border-border-700 bg-white dark:bg-surface-900 px-3 text-sm"
                                        placeholder="e.g. Great quality"
                                    />
                                </div>

                                <div>
                                    <div className="text-sm font-medium text-text-800 dark:text-text-200 mb-1">Comment</div>
                                    <textarea
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        className="w-full min-h-[110px] rounded-md border border-border-200 dark:border-border-700 bg-white dark:bg-surface-900 px-3 py-2 text-sm"
                                        placeholder="Write your experience..."
                                    />
                                </div>

                                <div>
                                    <div className="text-sm font-medium text-text-800 dark:text-text-200 mb-2">Photos (optional)</div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleReviewImageChange}
                                        className="block w-full text-sm"
                                    />
                                    {reviewImages.length ? (
                                        <div className="mt-3 grid grid-cols-5 gap-2">
                                            {reviewImages.map((u, idx) => (
                                                <div key={`${u}_${idx}`} className="relative">
                                                    <img src={u} alt="review" className="w-full h-14 object-cover rounded-md border border-border-200 dark:border-border-700" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setReviewImages((prev) => prev.filter((_, i) => i !== idx))}
                                                        className="absolute -top-2 -right-2 bg-white dark:bg-surface-900 border border-border-200 dark:border-border-700 rounded-full p-1"
                                                    >
                                                        <FiX size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <div className="px-5 py-4 border-t border-border-200 dark:border-border-700 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeReviewModal}
                                    className="h-10 px-4 rounded-md border border-border-200 dark:border-border-700 text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={submitReview}
                                    disabled={reviewSubmitting}
                                    className="h-10 px-4 rounded-md bg-primary-600 text-white text-sm font-semibold disabled:opacity-60"
                                >
                                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderTracking;
