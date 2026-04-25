import { useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../config/api';

/** Resolves the current parent's children via /api/auth/me/children/. */
export default function useMyChildren() {
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        axios.get(`${API_URL}/api/auth/me/children/`)
            .then(r => { if (!cancelled) setChildren(r.data || []); })
            .catch(e => { if (!cancelled) setError(e.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    return { children, loading, error };
}
