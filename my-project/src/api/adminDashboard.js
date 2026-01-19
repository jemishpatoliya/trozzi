import { api } from "./client";

// Comprehensive Admin Dashboard API
export async function fetchDashboardStats() {
    const res = await api.get("/admin/dashboard/stats");
    return res.data;
}

export async function fetchDashboardAnalytics() {
    const res = await api.get("/admin/dashboard/analytics");
    return res.data;
}

export async function fetchDashboardCharts({ period = '30d' } = {}) {
    const params = { period };
    const res = await api.get("/admin/dashboard/charts", { params });
    return res.data;
}

export async function fetchTopProducts({ limit = 10 } = {}) {
    const params = { limit };
    const res = await api.get("/admin/dashboard/top-products", { params });
    return res.data;
}

export async function fetchDashboardAlerts() {
    const res = await api.get("/admin/dashboard/alerts");
    return res.data;
}

// Combined dashboard data endpoint for optimal performance
export async function fetchCompleteDashboard({ period = 'today' } = {}) {
    const params = { period };
    const res = await api.get("/admin/dashboard", { params });
    return res.data;
}
