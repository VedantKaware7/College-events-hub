import axios from 'axios';

// In Docker/production the client is served by nginx, which proxies /api to the server.
// For `npm run dev`, vite.config.js proxies /api to localhost:5000.
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api'
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('ceh_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const errorMessage = (error, fallback = 'Something went wrong') =>
    error?.response?.data?.message || error?.message || fallback;

export default apiClient;
