// API Base URL - uses environment variable in production, localhost in development
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default API_URL;
