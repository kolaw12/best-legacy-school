import axios from 'axios';

// API Base URL - uses environment variable in production, localhost in development
let API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Remove trailing slash if present
if (API_URL && API_URL.endsWith('/')) {
    API_URL = API_URL.slice(0, -1);
}

// Global timeout: 60s — Render free tier cold starts take 30-60s
axios.defaults.timeout = 60000;

// Show a helpful toast if a request is taking long (cold start indicator)
let _toastFn = null;
let _pendingTimers = new Map();

export const setGlobalToast = (fn) => { _toastFn = fn; };

axios.interceptors.request.use((config) => {
    const id = config.url || 'req';
    // After 3 seconds, show a "waking up" hint
    const timer = setTimeout(() => {
        if (_toastFn) {
            _toastFn.info('Server is waking up — this takes 30-60s on first load. Please wait...', { duration: 55000 });
        }
    }, 3000);
    _pendingTimers.set(id, timer);
    return config;
});

axios.interceptors.response.use(
    (response) => {
        const timer = _pendingTimers.get(response.config.url);
        if (timer) { clearTimeout(timer); _pendingTimers.delete(response.config.url); }
        return response;
    },
    (error) => {
        const timer = _pendingTimers.get(error.config?.url);
        if (timer) { clearTimeout(timer); _pendingTimers.delete(error.config?.url); }
        return Promise.reject(error);
    }
);

// In development, log the API URL
if (import.meta.env.DEV) {
    console.log('Using API URL:', API_URL);
}

export default API_URL;
