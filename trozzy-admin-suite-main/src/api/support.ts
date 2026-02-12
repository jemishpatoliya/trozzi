import axios from 'axios';

const resolveApiOrigin = () => {
  const envAny = (import.meta as any)?.env || {};
  const raw = String(envAny.VITE_API_URL || envAny.VITE_API_BASE_URL || '').trim();
  const fallback = 'http://localhost:5050';
  const base = raw || fallback;
  return base.replace(/\/$/, '').replace(/\/api$/, '');
};

axios.defaults.baseURL = resolveApiOrigin();

// Support Tickets API
export const supportAPI = {
  // Create a new support ticket
  createTicket: async (ticketData: any) => {
    try {
      const response = await axios.post('/api/support/ticket', ticketData);
      return response.data;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw error;
    }
  },

  // Get all tickets for a user
  getUserTickets: async (userId: string) => {
    try {
      const response = await axios.get(`/api/support/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      throw error;
    }
  },

  // Get all tickets (admin only)
  getAllTickets: async (filters: any = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await axios.get(`/api/support/all?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all tickets:', error);
      throw error;
    }
  },

  // Get single ticket details
  getTicket: async (ticketId: string) => {
    try {
      const response = await axios.get(`/api/support/ticket/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      throw error;
    }
  },

  // Reply to a ticket (admin only)
  replyToTicket: async (ticketId: string, replyData: any) => {
    try {
      const response = await axios.put(`/api/support/${ticketId}/reply`, replyData);
      return response.data;
    } catch (error) {
      console.error('Error replying to ticket:', error);
      throw error;
    }
  },

  // Update ticket status (admin only)
  updateTicketStatus: async (ticketId: string, status: string) => {
    try {
      const response = await axios.put(`/api/support/${ticketId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw error;
    }
  },

  // Close ticket (admin only)
  closeTicket: async (ticketId: string) => {
    try {
      const response = await axios.put(`/api/support/${ticketId}/close`);
      return response.data;
    } catch (error) {
      console.error('Error closing ticket:', error);
      throw error;
    }
  },

  // Delete ticket (admin only)
  deleteTicket: async (ticketId: string) => {
    try {
      const response = await axios.delete(`/api/support/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting ticket:', error);
      throw error;
    }
  }
};

export const adminNotificationsAPI = {
  getAuthHeaders: () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },
  list: async ({ limit = 50, unreadOnly = false }: { limit?: number; unreadOnly?: boolean } = {}) => {
    const response = await axios.get('/api/admin/notifications', {
      headers: adminNotificationsAPI.getAuthHeaders(),
      params: { limit, unreadOnly },
    });
    return response.data;
  },
  markRead: async (id: string) => {
    const response = await axios.put(`/api/admin/notifications/${id}/read`, null, {
      headers: adminNotificationsAPI.getAuthHeaders(),
    });
    return response.data;
  },
  markAllRead: async () => {
    const response = await axios.put('/api/admin/notifications/read-all', null, {
      headers: adminNotificationsAPI.getAuthHeaders(),
    });
    return response.data;
  },
};

// Orders API
type OrderStatsApiData = {
  totalOrders: number;
  newCount: number;
  processingCount: number;
  shippedCount: number;
  deliveredCount: number;
  returnedCount: number;
  cancelledCount: number;
};

type OrderStatsUiData = {
  all: number;
  new: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
};

type OrderStatsUiResponse = {
  success: boolean;
  data: OrderStatsUiData;
  message?: string;
};

type OrdersAPI = {
  getAuthHeaders: () => { Authorization?: string };
  getOrderStats: () => Promise<OrderStatsUiResponse>;
  createOrder: (orderData: any) => Promise<any>;
  getUserOrders: (userId: string) => Promise<any>;
  getOrder: (orderId: string) => Promise<any>;
  getAllOrders: (filters?: any) => Promise<any>;
  updateOrderStatus: (orderId: string, statusData: any) => Promise<any>;
  bulkUpdateOrderStatus: (payload: { ids?: string[]; status: string; currentStatus?: string; dateFrom?: string; dateTo?: string }) => Promise<any>;
  downloadOrderReceipt: (orderId: string) => Promise<any>;
  downloadOrdersReceipt: (payload: { ids: string[] }) => Promise<any>;
  cancelOrder: (orderId: string, reason: string) => Promise<any>;
  addTracking: (orderId: string, trackingData: any) => Promise<any>;
  getOrderTracking: (orderId: string) => Promise<any>;
  approveRefundRequest: (refundRequestId: string) => Promise<any>;
};

export const ordersAPI: OrdersAPI = {
  getAuthHeaders: () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    return {
      Authorization: token ? `Bearer ${token}` : undefined,
    };
  },

  getOrderStats: async () => {
    try {
      const response = await axios.get('/api/orders/stats', {
        headers: ordersAPI.getAuthHeaders(),
      });

      const payload = response.data;
      const stats = payload?.data as Partial<OrderStatsApiData> | undefined;

      // Backward-compatible adapter: OrdersPage expects { all,new,processing,shipped,delivered,returned }
      if (stats && typeof stats === 'object' && 'totalOrders' in stats) {
        return {
          ...payload,
          data: {
            all: Number(stats.totalOrders ?? 0) || 0,
            new: Number(stats.newCount ?? 0) || 0,
            processing: Number(stats.processingCount ?? 0) || 0,
            shipped: Number(stats.shippedCount ?? 0) || 0,
            delivered: Number(stats.deliveredCount ?? 0) || 0,
            cancelled: Number(stats.cancelledCount ?? 0) || 0,
          },
        } as OrderStatsUiResponse;
      }

      return payload as OrderStatsUiResponse;
    } catch (error) {
      console.error('Error fetching order stats:', error);
      throw error;
    }
  },

  // Create a new order
  createOrder: async (orderData: any) => {
    try {
      const response = await axios.post('/api/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Get all orders for a user
  getUserOrders: async (userId: string) => {
    try {
      const response = await axios.get(`/api/orders/user/${userId}`, {
        headers: ordersAPI.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  },

  // Get single order details
  getOrder: async (orderId: string) => {
    try {
      const response = await axios.get(`/api/orders/${orderId}`, {
        headers: ordersAPI.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  approveRefundRequest: async (refundRequestId: string) => {
    try {
      const response = await axios.post(`/api/admin/refund-requests/${refundRequestId}/approve`, null, {
        headers: ordersAPI.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error approving refund request:', error);
      throw error;
    }
  },

  // Get all orders (admin only)
  getAllOrders: async (filters: any = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await axios.get(`/api/orders?${params.toString()}`, {
        headers: ordersAPI.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all orders:', error);
      throw error;
    }
  },

  // Update order status (admin only)
  updateOrderStatus: async (orderId: string, statusData: any) => {
    try {
      const response = await axios.put(`/api/orders/${orderId}/status`, statusData, {
        headers: ordersAPI.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  bulkUpdateOrderStatus: async (payload: { ids?: string[]; status: string; currentStatus?: string; dateFrom?: string; dateTo?: string }) => {
    try {
      const response = await axios.post('/api/orders/bulk/status', payload, {
        headers: ordersAPI.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk updating order status:', error);
      throw error;
    }
  },

  downloadOrderReceipt: async (orderId: string) => {
    const response = await axios.get(`/api/orders/${orderId}/receipt`, {
      headers: ordersAPI.getAuthHeaders(),
      responseType: 'blob',
    });
    return response;
  },

  downloadOrdersReceipt: async (payload: { ids: string[] }) => {
    const response = await axios.post('/api/orders/receipt', payload, {
      headers: ordersAPI.getAuthHeaders(),
      responseType: 'blob',
    });
    return response;
  },

  // Cancel order
  cancelOrder: async (orderId: string, reason: string) => {
    try {
      const response = await axios.put(`/api/orders/${orderId}/cancel`, { reason }, {
        headers: ordersAPI.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  },

  // Add tracking information (admin only)
  addTracking: async (orderId: string, trackingData: any) => {
    try {
      const response = await axios.put(`/api/orders/${orderId}/tracking`, trackingData, {
        headers: ordersAPI.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error adding tracking:', error);
      throw error;
    }
  },

  // Get order tracking information
  getOrderTracking: async (orderId: string) => {
    try {
      const response = await axios.get(`/api/orders/${orderId}/tracking`, {
        headers: ordersAPI.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching order tracking:', error);
      throw error;
    }
  }
};
