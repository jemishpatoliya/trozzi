import axios from "axios";

const inferLocalApiBaseUrl = () => {
    if (typeof window === "undefined") return "/api";
    return "/api";
};

const apiBaseUrl = process.env.REACT_APP_API_URL || inferLocalApiBaseUrl();

let hasLoggedNetworkError = false;

const inferAlternateBaseUrl = (current) => {
    if (typeof window === "undefined") return null;
    const s = String(current || "");
    if (!s.includes("localhost") && !s.includes("127.0.0.1")) return null;
    if (s.includes(":5051/")) return s.replace(":5051/", ":5050/");
    if (s.includes(":5050/")) return s.replace(":5050/", ":5051/");
    return null;
};

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
    async (error) => {
        const config = error?.config;
        const hasResponse = Boolean(error?.response);

        if (!hasResponse && !hasLoggedNetworkError) {
            hasLoggedNetworkError = true;
            // eslint-disable-next-line no-console
            console.error('[api] Network error: API server unreachable. Check backend is running and proxy/REACT_APP_API_URL config.', {
                baseURL: api.defaults.baseURL,
            });
        }

        // If backend port differs (5050 vs 5051), retry once on network failure
        if (!hasResponse && config && !config.__triedAlternateBaseUrl) {
            const alt = inferAlternateBaseUrl(api.defaults.baseURL);
            if (alt) {
                config.__triedAlternateBaseUrl = true;
                config.baseURL = alt;
                return api.request(config);
            }
        }

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
