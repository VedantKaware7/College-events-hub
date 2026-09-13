import axios from 'axios';

// In Docker/production the client is served by nginx, which proxies /api to the server.
// For `npm run dev`, vite.config.js proxies /api to localhost:5000.
// VITE_API_URL may be given with or without the trailing /api; normalise it.
const resolveBaseUrl = (value) => {
    if (!value) return '/api';
    const trimmed = value.replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const apiClient = axios.create({
    baseURL: resolveBaseUrl(import.meta.env.VITE_API_URL)
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('ceh_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const errorMessage = (error, fallback = 'Something went wrong') =>
    error?.response?.data?.message || error?.message || fallback;

export default apiClient;
