import axios from 'axios';
import API_URL from './api';

const client = axios.create({ baseURL: `${API_URL}/api` });

// `axios.create()` returns an isolated instance — it does NOT inherit the
// Authorization header AuthContext sets on the shared axios.defaults. Read
// the stored token directly so calls through this client (e.g. the admin
// dashboard summary, which requires staff auth) don't silently 401.
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('bls_auth_token');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

export const adminApi = {
    summary:   ()         => client.get('/academics/summary/'),
    classes:   (params)   => client.get('/academics/classes/', { params }),
    subjects:  (params)   => client.get('/academics/subjects/', { params }),
    teachers:  (params)   => client.get('/academics/teachers/', { params }),
    students:  (params)   => client.get('/academics/students/', { params }),
    guardians: (params)   => client.get('/academics/guardians/', { params }),
    sessions:  ()         => client.get('/academics/sessions/'),
    terms:     (params)   => client.get('/academics/terms/', { params }),
};

export default adminApi;
