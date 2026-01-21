import axios from "axios";

const inferredBaseUrl =
    typeof window !== "undefined" && String(window.location.port) === "3000"
        ? `${window.location.protocol}//${window.location.hostname}:5051/api`
        : "/api";

const apiBaseUrl = process.env.REACT_APP_API_URL || inferredBaseUrl;

export const api = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        const method = String(config.method || "get").toLowerCase();
        const url = String(config.url || "");
        if (method === "get" && (url.startsWith("/products") || url.startsWith("/product-details"))) {
            config.headers = {
                ...(config.headers || {}),
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                Pragma: "no-cache",
                Expires: "0",
            };
            config.params = { ...(config.params || {}), _ts: Date.now() };
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid, remove it and redirect to login
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Export as apiClient for compatibility
export const apiClient = api;
