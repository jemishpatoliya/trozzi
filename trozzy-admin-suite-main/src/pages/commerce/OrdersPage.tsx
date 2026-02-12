import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Search, Eye, Package, Clock, Truck, CheckCircle, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ordersAPI } from '@/api/support';
import { io } from 'socket.io-client';

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  total: number;
  shipping?: number;
  codCharge?: number;
  items: number;
  date: string;
  paymentMethod: string;
  status: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

type OrderDetailItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  selectedSize?: string;
  selectedColor?: string;
  selectedImage?: string;
};

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: Order['status'];
  currency?: string;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  total: number;
  items: OrderDetailItem[];
  customer?: { name?: string; email?: string; phone?: string };
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  createdAtIso?: string;
  refundRequest?: {
    id: string;
    status: string;
    amount: number;
    currency?: string;
    refundDueAt?: string;
    approvedAt?: string;
    processedAt?: string;
  } | null;
};

type OrderStatusCounts = {
  all: number;
  new: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
};

const OrdersPage = () => {
  const { toast } = useToast();
  const [orders, setOrdersState] = useState<Order[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [counts, setCounts] = useState<OrderStatusCounts>({
    all: 0,
    new: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tabFilter, setTabFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    loadOrders();
    loadCounts();

    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    const socketUrl =
      (import.meta as any)?.env?.VITE_SOCKET_URL ||
      `${window.location.protocol}//${window.location.hostname}:5050`;

    const socket = io(socketUrl, {
      auth: token ? { token } : {},
      transports: ['websocket'],
    });

    socket.on('orders:counts', (payload: any) => {
      if (!payload || typeof payload !== 'object') return;
      setCounts({
        all: Number(payload.totalOrders ?? payload.all ?? 0) || 0,
        new: Number(payload.new ?? payload.newCount ?? 0) || 0,
        processing: Number(payload.processing ?? payload.processingCount ?? 0) || 0,
        shipped: Number(payload.shipped ?? payload.shippedCount ?? 0) || 0,
        delivered: Number(payload.delivered ?? payload.deliveredCount ?? 0) || 0,
        cancelled: Number(payload.cancelled ?? payload.cancelledCount ?? 0) || 0,
      });
    });

    const patchOrder = (id: string, updates: Partial<Order>) => {
      setOrdersState((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
      setSelectedOrder((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));
      setSelectedOrderDetails((prev) => {
        if (!prev || prev.id !== id) return prev;
        if (!updates.status) return prev;
        return { ...prev, status: updates.status };
      });
    };

    socket.on('order:status_changed', (evt: any) => {
      const id = String(evt?.id || '');
      const status = String(evt?.status || '').toLowerCase();
      if (!id || !status) return;
      patchOrder(id, { status: status as Order['status'] });
    });

    socket.on('order:tracking_updated', (evt: any) => {
      const id = String(evt?.id || '');
      if (!id) return;
      patchOrder(id, {});
    });

    socket.on('admin:notification', (n: any) => {
      const title = String(n?.title || 'Notification');
      const message = String(n?.message || '');
      toast({ title, description: message });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const loadOrders = async () => {
    try {
      const response = await ordersAPI.getAllOrders();
      if (response.success) {
        setOrdersState(response.data);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to load orders',
        variant: 'destructive'
      });
    }
  };

  const getStatusCountsFromOrders = (list: Order[]): OrderStatusCounts => ({
    all: list.length,
    new: list.filter((o) => o.status === 'new').length,
    processing: list.filter((o) => o.status === 'processing').length,
    shipped: list.filter((o) => o.status === 'shipped').length,
    delivered: list.filter((o) => o.status === 'delivered').length,
    cancelled: list.filter((o) => o.status === 'cancelled').length,
  });

  const loadCounts = async () => {
    try {
      const response = await ordersAPI.getOrderStats();
      if (response?.success && response?.data) {
        setCounts(response.data);
        return;
      }
      setCounts(getStatusCountsFromOrders(orders));
    } catch (error) {
      console.error('Error loading order stats:', error);
      setCounts(getStatusCountsFromOrders(orders));
    }
  };

  const getFilteredOrders = () => {
    return orders.filter((order) => {
      const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesTab = tabFilter === 'all' || order.status === tabFilter;
      return matchesSearch && matchesStatus && matchesTab;
    });
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      const response = await ordersAPI.updateOrderStatus(orderId, { status: newStatus });
      if (response.success) {
        const updated = orders.map((o) => o.id === orderId ? { ...o, status: newStatus } : o);
        setOrdersState(updated);
        setCounts(getStatusCountsFromOrders(updated));
        loadCounts();
        toast({ title: 'Success', description: `Order status updated to ${newStatus}` });
      } else {
        throw new Error(response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update order status',
        variant: 'destructive'
      });
    }
  };

  const columns = [
    { key: 'orderNumber', header: 'Order #' },
    { key: 'customer', header: 'Customer' },
    { key: 'email', header: 'Email' },
    {
      key: 'total',
      header: 'Total',
      render: (order: Order) => `$${order.total.toFixed(2)}`,
    },
    {
      key: 'shipping',
      header: 'Shipping',
      render: (order: Order) => `₹${Number(order.shipping ?? 0).toFixed(2)}`,
    },
    {
      key: 'codCharge',
      header: 'COD',
      render: (order: Order) => `₹${Number(order.codCharge ?? 0).toFixed(2)}`,
    },
    {
      key: 'items',
      header: 'Items',
      render: (order: Order) => order.items,
    },
    { key: 'date', header: 'Date' },
    { key: 'paymentMethod', header: 'Payment' },
    {
      key: 'status',
      header: 'Status',
      render: (order: Order) => <StatusBadge status={order.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (order: Order) => (
        <Button
          size="icon"
          variant="ghost"
          onClick={async () => {
            setSelectedOrder(order);
            setSelectedOrderDetails(null);
            setDetailsLoading(true);
            try {
              const response = await ordersAPI.getOrder(order.id);
              if (response?.success && response?.data) {
                setSelectedOrderDetails(response.data as OrderDetail);
              } else {
                throw new Error(response?.message || 'Failed to fetch order details');
              }
            } catch (error) {
              console.error('Error loading order details:', error);
              toast({
                title: 'Error',
                description: 'Failed to load order details',
                variant: 'destructive',
              });
            } finally {
              setDetailsLoading(false);
            }
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const filteredOrders = getFilteredOrders();

  const downloadOrderReceipt = async (orderId: string) => {
    const response = await ordersAPI.downloadOrderReceipt(orderId);
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-receipt-${orderId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const downloadCombinedReceipts = async (ids: string[]) => {
    const response = await ordersAPI.downloadOrdersReceipt({ ids });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-receipts.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const acceptSelectedOrders = async () => {
    const ids = selectedOrderIds;
    if (!ids.length) {
      toast({ title: 'No orders selected', description: 'Select orders to accept.', variant: 'destructive' });
      return;
    }

    try {
      setBulkLoading(true);
      const resp = await ordersAPI.bulkUpdateOrderStatus({
        ids,
        status: 'processing',
        currentStatus: 'new',
      });

      if (!resp?.success) {
        throw new Error(resp?.message || 'Failed to accept orders');
      }

      const updated = orders.map((o) => (ids.includes(o.id) ? { ...o, status: 'processing' as Order['status'] } : o));
      setOrdersState(updated);
      setCounts(getStatusCountsFromOrders(updated));
      loadCounts();

      toast({
        title: 'Accepted',
        description: `Accepted ${ids.length} order(s). Downloading receipts...`,
      });

      try {
        await downloadCombinedReceipts(ids);
      } catch (_e) {
        // ignore
      }
    } catch (error) {
      console.error('Bulk accept error:', error);
      const err: any = error;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to accept orders';
      toast({ title: 'Error', description: String(msg), variant: 'destructive' });
    } finally {
      setBulkLoading(false);
    }
  };

  const downloadSelectedReceipts = async () => {
    const ids = selectedOrderIds;
    if (!ids.length) {
      toast({ title: 'No orders selected', description: 'Select orders to download receipts.', variant: 'destructive' });
      return;
    }
    try {
      setBulkLoading(true);
      await downloadCombinedReceipts(ids);
    } catch (error) {
      const err: any = error;
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to download receipts';
      toast({ title: 'Error', description: String(msg), variant: 'destructive' });
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage and track your orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={acceptSelectedOrders}
            disabled={bulkLoading || selectedOrderIds.length === 0}
          >
            Accept Selected
          </Button>
          <Button
            variant="outline"
            onClick={downloadSelectedReceipts}
            disabled={bulkLoading || selectedOrderIds.length === 0}
          >
            Download Receipts
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New</p>
                <p className="text-2xl font-bold">{counts.new}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold">{counts.processing}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shipped</p>
                <p className="text-2xl font-bold">{counts.shipped}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold">{counts.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold">{counts.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tabFilter} onValueChange={setTabFilter}>
        <TabsList className="glass">
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="new">New ({counts.new})</TabsTrigger>
          <TabsTrigger value="processing">Processing ({counts.processing})</TabsTrigger>
          <TabsTrigger value="shipped">Shipped ({counts.shipped})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({counts.delivered})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({counts.cancelled})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={filteredOrders}
        columns={columns}
        selectable
        onSelectionChange={setSelectedOrderIds}
        emptyMessage="No orders found"
      />

      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(null);
            setSelectedOrderDetails(null);
            setDetailsLoading(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-end">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await downloadOrderReceipt(selectedOrder.id);
                    } catch (error) {
                      const err: any = error;
                      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to download receipt';
                      toast({ title: 'Error', description: String(msg), variant: 'destructive' });
                    }
                  }}
                >
                  Download Receipt
                </Button>
              </div>

              {selectedOrder.status === 'cancelled' && selectedOrderDetails?.refundRequest?.status === 'pending_admin_approval' && (
                <div className="flex items-center justify-end">
                  <Button
                    onClick={async () => {
                      const refundRequestId = String(selectedOrderDetails?.refundRequest?.id || '').trim();
                      if (!refundRequestId) return;
                      try {
                        setDetailsLoading(true);
                        const resp = await ordersAPI.approveRefundRequest(refundRequestId);
                        if (!resp?.success) {
                          throw new Error(resp?.message || 'Failed to approve refund');
                        }
                        const refreshed = await ordersAPI.getOrder(selectedOrder.id);
                        if (refreshed?.success && refreshed?.data) {
                          setSelectedOrderDetails(refreshed.data as OrderDetail);
                        }
                        toast({
                          title: 'Refund Approved',
                          description: 'Refund approved. It will be processed in 3 days.',
                        });
                      } catch (error) {
                        const err: any = error;
                        const msg = err?.response?.data?.message || err?.message || 'Failed to approve refund';
                        toast({ title: 'Error', description: String(msg), variant: 'destructive' });
                      } finally {
                        setDetailsLoading(false);
                      }
                    }}
                  >
                    Approve Refund (3 days)
                  </Button>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-medium">{selectedOrder.orderNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{selectedOrderDetails?.createdAtIso || selectedOrder.date}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedOrderDetails?.customer?.name || selectedOrder.customer}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedOrderDetails?.customer?.email || selectedOrder.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-medium">${(selectedOrderDetails?.total ?? selectedOrder.total).toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Shipping</p>
                  <p className="font-medium">₹{Number((selectedOrderDetails as any)?.shipping ?? (selectedOrder as any)?.shipping ?? 0).toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">COD Charge</p>
                  <p className="font-medium">₹{Number((selectedOrderDetails as any)?.codCharge ?? (selectedOrder as any)?.codCharge ?? 0).toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{selectedOrder.paymentMethod}</p>
                </div>
              </div>

              {selectedOrderDetails?.address && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Shipping Address</p>
                  <div className="text-sm">
                    <div>{selectedOrderDetails.address.line1}</div>
                    {selectedOrderDetails.address.line2 ? <div>{selectedOrderDetails.address.line2}</div> : null}
                    <div>
                      {selectedOrderDetails.address.city}
                      {selectedOrderDetails.address.state ? `, ${selectedOrderDetails.address.state}` : ''}{' '}
                      {selectedOrderDetails.address.postalCode}
                    </div>
                    <div>{selectedOrderDetails.address.country}</div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Ordered Items</p>
                {detailsLoading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : selectedOrderDetails?.items?.length ? (
                  <div className="space-y-2">
                    {selectedOrderDetails.items.map((it) => (
                      <div key={`${it.productId}-${it.name}`} className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded overflow-hidden bg-muted flex items-center justify-center">
                          {(it.selectedImage || it.image) ? (
                            <img src={(it.selectedImage || it.image) as string} alt={it.name} className="h-12 w-12 object-cover" />
                          ) : (
                            <div className="text-xs text-muted-foreground">No image</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{it.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Qty: {it.quantity} × ${Number(it.price ?? 0).toFixed(2)}
                          </div>
                          {(it.selectedSize || it.selectedColor) ? (
                            <div className="text-xs text-muted-foreground">
                              {it.selectedSize ? `Size: ${it.selectedSize}` : ''}
                              {it.selectedSize && it.selectedColor ? ' | ' : ''}
                              {it.selectedColor ? `Color: ${it.selectedColor}` : ''}
                            </div>
                          ) : null}
                        </div>
                        <div className="text-sm font-medium">
                          ${(Number(it.price ?? 0) * Number(it.quantity ?? 0)).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No items found</div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Update Status</p>
                <Select value={selectedOrder.status} onValueChange={(v: Order['status']) => {
                  handleStatusChange(selectedOrder.id, v);
                  setSelectedOrder({ ...selectedOrder, status: v });
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
