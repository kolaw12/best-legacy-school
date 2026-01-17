// API Base URL - uses environment variable in production, localhost in development
let API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Remove trailing slash if present to prevent double slashes in paths like //api/
if (API_URL.endsWith('/')) {
    API_URL = API_URL.slice(0, -1);
}

export default API_URL;
