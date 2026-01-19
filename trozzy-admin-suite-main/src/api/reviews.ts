import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

// Type definitions
export interface ReviewQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  rating?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface ExportParams {
  format?: string;
  status?: string;
  rating?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface ProductReviewParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface ReviewData {
  rating: number;
  title: string;
  comment: string;
  customerName: string;
  customerEmail: string;
}

export interface StatusData {
  status: string;
  reason?: string;
}

// Reviews API functions
export const fetchAllReviews = async (params: ReviewQueryParams = {}) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/admin/reviews`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        search: params.search,
        rating: params.rating,
        status: params.status,
        sortBy: params.sortBy || 'date',
        sortOrder: params.sortOrder || 'desc'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
};

export const getReviewStats = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/admin/reviews/stats`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching review stats:', error);
    throw error;
  }
};

export const updateReviewStatus = async (reviewId: string, statusData: StatusData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_BASE_URL}/admin/reviews/${reviewId}/status`, statusData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating review status:', error);
    throw error;
  }
};

export const deleteReview = async (reviewId: string) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_BASE_URL}/admin/reviews/${reviewId}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

export const bulkUpdateReviews = async (reviewIds: string[], statusData: StatusData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_BASE_URL}/admin/reviews/bulk-status`, {
      reviewIds,
      status: statusData.status
    }, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error bulk updating reviews:', error);
    throw error;
  }
};

export const exportReviews = async (params: ExportParams = {}) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/admin/reviews/export`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      params: {
        format: params.format || 'csv',
        status: params.status,
        rating: params.rating,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo
      },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting reviews:', error);
    throw error;
  }
};

export const getReviewById = async (reviewId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/reviews/${reviewId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching review by ID:', error);
    throw error;
  }
};

// Product Reviews API (for customer-facing)
export const fetchProductReviews = async (productId: string, params: ProductReviewParams = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/products/${productId}/reviews`, {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        status: 'approved', // Only show approved reviews to customers
        sortBy: params.sortBy || 'date',
        sortOrder: params.sortOrder || 'desc'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    throw error;
  }
};

export const submitProductReview = async (productId: string, reviewData: ReviewData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/products/${productId}/reviews`, reviewData);
    return response.data;
  } catch (error) {
    console.error('Error submitting product review:', error);
    throw error;
  }
};

export const upvoteReview = async (reviewId: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/reviews/${reviewId}/upvote`);
    return response.data;
  } catch (error) {
    console.error('Error upvoting review:', error);
    throw error;
  }
};

export const reportReview = async (reviewId: string, reason: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/reviews/${reviewId}/report`, { reason });
    return response.data;
  } catch (error) {
    console.error('Error reporting review:', error);
    throw error;
  }
};
