import { api } from "./client";

// Admin Reviews API
export async function fetchAllReviews({ page = 1, limit = 10, search, rating, status } = {}) {
    const params = { page, limit };
    if (search) params.search = search;
    if (rating) params.rating = rating;
    if (status) params.status = status;

    const res = await api.get("/admin/reviews", { params });
    return res.data;
}

export async function deleteReview(reviewId) {
    const res = await api.delete(`/admin/reviews/${reviewId}`);
    return res.data;
}

export async function updateReviewStatus(reviewId, { status }) {
    const res = await api.put(`/admin/reviews/${reviewId}/status`, { status });
    return res.data;
}

export async function getReviewStats() {
    const res = await api.get("/admin/reviews/stats");
    return res.data;
}

export async function bulkUpdateReviewStatus(reviewIds, status) {
    const res = await api.put("/admin/reviews/bulk-status", { reviewIds, status });
    return res.data;
}

export async function exportReviews({ format = 'csv', filters = {} } = {}) {
    const params = { format, ...filters };
    const res = await api.get("/admin/reviews/export", {
        params,
        responseType: format === 'csv' ? 'blob' : 'json'
    });

    if (format === 'csv') {
        const blob = new Blob([res.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reviews_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    return res.data;
}
