import axios from 'axios';
import API_URL from './api';

const client = axios.create({ baseURL: `${API_URL}/api` });

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
