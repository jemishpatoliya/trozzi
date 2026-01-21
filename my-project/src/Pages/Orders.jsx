import React, { useEffect, useMemo, useState } from 'react';
import { useContentSettings } from '../context/ContentSettingsContext';
import { apiClient } from '../api/client';
import { useNotifications } from '../context/NotificationContext';

const FALLBACK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const Orders = () => {
  const { settings } = useContentSettings();
  const { socket } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [cancellingId, setCancellingId] = useState('');

  const showOrderHistory = Boolean(settings?.showOrderHistory);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!showOrderHistory) return;
      setLoading(true);
      setError('');

      try {
        const res = await apiClient.get('/orders/my');
        const data = Array.isArray(res?.data?.data) ? res.data.data : [];
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
    return (Array.isArray(orders) ? orders : []).map((o) => {
      const items = Array.isArray(o?.itemsDetail) ? o.itemsDetail : [];
      return {
        id: String(o?.id || ''),
        orderNumber: String(o?.orderNumber || ''),
        status: String(o?.orderStatus || o?.status || 'new'),
        createdAtIso: String(o?.createdAtIso || o?.date || ''),
        total: Number(o?.total ?? 0) || 0,
        items,
      };
    });
  }, [orders]);

  const formatCurrency = (value) => {
    const n = Number(value ?? 0) || 0;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  };

  if (!showOrderHistory) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Order history is currently disabled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">{error}</div>
      ) : null}

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-gray-600">Loading your orders...</div>
        </div>
      ) : normalizedOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {normalizedOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
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
                  <div className="font-medium text-gray-900 capitalize">{order.status}</div>
                  <div className="text-sm text-gray-500">Total: <span className="font-semibold text-gray-900">{formatCurrency(order.total)}</span></div>
                  {canCancel(order.status) ? (
                    <div className="mt-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-60"
                        disabled={cancellingId === order.id}
                        onClick={() => handleCancelOrder(order)}
                      >
                        {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    </div>
                  ) : null}
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
