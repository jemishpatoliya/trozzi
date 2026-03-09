import React, { useEffect, useMemo, useState } from 'react';
import { useContentSettings } from '../context/ContentSettingsContext';
import { apiClient } from '../api/client';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const FALLBACK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const Orders = () => {
  const { settings } = useContentSettings();
  const { socket } = useNotifications();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [cancellingId, setCancellingId] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month

  const showOrderHistory = Boolean(settings?.showOrderHistory);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!showOrderHistory) return;
      setLoading(true);
      setError('');

      try {
        const res = await apiClient.get('/orders/my');
        console.log('Orders API response:', res.data);
        const data = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
        console.log('Orders extracted:', data);
        if (!cancelled) setOrders(data);
      } catch (e) {
        const message = e?.response?.data?.message || e?.message || 'Failed to load orders';
        if (!cancelled) {
          setError(message);
          setOrders([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [showOrderHistory]);

  useEffect(() => {
    if (!showOrderHistory) return;
    if (!socket) return;

    const onStatusChanged = (evt) => {
      const id = String(evt?.id || '');
      const status = String(evt?.status || '').toLowerCase();
      if (!id || !status) return;

      setOrders((prev) => prev.map((o) => (String(o?.id) === id ? { ...o, status } : o)));
    };

    socket.on('order:status_changed', onStatusChanged);
    return () => {
      socket.off('order:status_changed', onStatusChanged);
    };
  }, [socket, showOrderHistory]);

  const canCancel = (status) => {
    const s = String(status || '').toLowerCase();
    return ['new', 'processing', 'paid'].includes(s);
  };

  const formatStatusLabel = (status, adminStatus) => {
    const s = String(adminStatus || status || '').trim();
    if (!s) return 'New';
    return s
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleCancelOrder = async (order) => {
    const id = String(order?.id || '');
    if (!id) return;
    if (!canCancel(order?.status)) return;

    const ok = window.confirm('Are you sure you want to cancel this order?');
    if (!ok) return;

    setCancellingId(id);
    setError('');
    try {
      await apiClient.post(`/orders/${id}/cancel`);

      const res = await apiClient.get('/orders/my');
      const data = Array.isArray(res?.data?.data) ? res.data.data : [];
      setOrders(data);
    } catch (e) {
      const message = e?.response?.data?.message || e?.message || 'Failed to cancel order';
      setError(message);
    } finally {
      setCancellingId('');
    }
  };

  const normalizedOrders = useMemo(() => {
    const allOrders = (Array.isArray(orders) ? orders : []).map((o) => {
      const items = Array.isArray(o?.itemsDetail) ? o.itemsDetail : [];
      const rawStatus = String(o?.orderStatus || o?.status || 'new').toLowerCase();
      // Hide paid_but_shipment_failed from users - show as processing
      let status = rawStatus === 'returned' ? 'cancelled' : rawStatus;
      if (status === 'paid_but_shipment_failed') {
        status = 'processing'; // Show user-friendly status
      }
      return {
        id: String(o?.id || ''),
        orderNumber: String(o?.orderNumber || ''),
        status,
        createdAtIso: String(o?.createdAtIso || o?.date || ''),
        total: Number(o?.total ?? 0) || 0,
        items,
      };
    });

    // Apply date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return allOrders.filter((order) => {
      if (!order.createdAtIso) return true; // Show orders without date
      
      const orderDate = new Date(order.createdAtIso);
      
      switch (dateFilter) {
        case 'today':
          return orderDate >= today;
        case 'week':
          return orderDate >= weekStart;
        case 'month':
          return orderDate >= monthStart;
        default:
          return true; // 'all'
      }
    }).sort((a, b) => {
      // Sort by date descending (newest first)
      const dateA = a.createdAtIso ? new Date(a.createdAtIso) : new Date(0);
      const dateB = b.createdAtIso ? new Date(b.createdAtIso) : new Date(0);
      return dateB - dateA;
    });
  }, [orders, dateFilter]);

  const formatCurrency = (value) => {
    const n = Number(value ?? 0) || 0;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  };

  if (!showOrderHistory) {
    return (
      <div className="container mx-auto px-4 mt-72 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Order history is currently disabled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 mt-52 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        
        {/* Date Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setDateFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              dateFilter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setDateFilter('today')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              dateFilter === 'today' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateFilter('week')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              dateFilter === 'week' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setDateFilter('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              dateFilter === 'month' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">{error}</div>
      ) : null}

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-gray-600">Loading your orders...</div>
        </div>
      ) : normalizedOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 mt-40">
          <p className="text-gray-600">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {normalizedOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/order-tracking?id=${encodeURIComponent(order.id)}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/order-tracking?id=${encodeURIComponent(order.id)}`);
                }
              }}
            >
              <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="text-sm text-gray-500">Order</div>
                  <div className="font-semibold text-gray-900">{order.orderNumber || order.id}</div>
                  {order.createdAtIso ? (
                    <div className="text-xs text-gray-500">{new Date(order.createdAtIso).toLocaleString()}</div>
                  ) : null}
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="font-medium text-gray-900">{formatStatusLabel(order.status, order.adminStatus)}</div>
                  <div className="text-sm text-gray-500">Total: <span className="font-semibold text-gray-900">{formatCurrency(order.total)}</span></div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 justify-start sm:justify-end">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/order-tracking?id=${encodeURIComponent(order.id)}`);
                      }}
                    >
                      Track
                    </button>
                  {canCancel(order.status) ? (
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-60"
                      disabled={cancellingId === order.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelOrder(order);
                      }}
                    >
                      {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  ) : null}
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-3">
                  {order.items.map((it, idx) => {
                    const img = String(it?.selectedImage || '').trim() || FALLBACK_IMAGE;
                    const name = String(it?.name || 'Product');
                    const size = String(it?.selectedSize || '').trim();
                    const color = String(it?.selectedColor || '').trim();
                    const qty = Number(it?.quantity ?? 0) || 0;
                    const price = Number(it?.price ?? 0) || 0;

                    return (
                      <div key={`${order.id}-${idx}`} className="flex gap-4 items-start">
                        <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={img}
                            alt={name}
                            className="h-16 w-16 object-cover"
                            onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{name}</div>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                            {size ? <div>Size: <span className="font-medium text-gray-900">{size}</span></div> : null}
                            {color ? (
                              <div className="flex items-center gap-2">
                                <span>Color:</span>
                                <span className="font-medium text-gray-900">{color}</span>
                                <span className="h-3 w-3 rounded-full border border-gray-300" title={color} />
                              </div>
                            ) : null}
                            <div>Qty: <span className="font-medium text-gray-900">{qty}</span></div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-gray-500">Price</div>
                          <div className="font-semibold text-gray-900">{formatCurrency(price)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
