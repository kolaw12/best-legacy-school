import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import API_URL from '../config/api';

const TOKEN_KEY = 'bls_auth_token';
const PROFILE_KEY = 'bls_auth_profile';

const AuthContext = createContext(null);

// Short timeout so cold backend doesn't block UI for 30+ seconds
const FAST_TIMEOUT = 8000;

const setAxiosAuth = (token) => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Token ${token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
};

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
    const [profile, setProfile] = useState(() => {
        try { return JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch { return null; }
    });
    // If we have a cached profile, don't block — show app immediately
    const [booting, setBooting] = useState(false);

    useEffect(() => {
        if (!token) return;
        setAxiosAuth(token);

        // Verify token in background — don't block UI
        const controller = new AbortController();
        axios.get(`${API_URL}/api/auth/me/`, {
            signal: controller.signal,
            timeout: FAST_TIMEOUT,
        })
            .then(r => {
                setProfile(r.data);
                localStorage.setItem(PROFILE_KEY, JSON.stringify(r.data));
            })
            .catch(() => {
                // Stale token — purge
                setToken(null);
                setProfile(null);
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(PROFILE_KEY);
                setAxiosAuth(null);
            });
        return () => controller.abort();
    }, []); // Only on mount, not on token change

    const login = useCallback(async (username, password) => {
        const { data } = await axios.post(`${API_URL}/api/auth/login/`, { username, password }, {
            timeout: FAST_TIMEOUT,
        });
        setToken(data.token);
        setProfile(data.profile);
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile));
        setAxiosAuth(data.token);
        return data.profile;
    }, []);

    const logout = useCallback(async () => {
        try { await axios.post(`${API_URL}/api/auth/logout/`, {}, { timeout: 5000 }); } catch { /* ignore */ }
        setToken(null);
        setProfile(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(PROFILE_KEY);
        setAxiosAuth(null);
    }, []);

    const updateProfile = useCallback(async (formData) => {
        const { data } = await axios.patch(`${API_URL}/api/auth/me/`, formData, {
            headers: formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
            timeout: FAST_TIMEOUT,
        });
        setProfile(data);
        localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
        return data;
    }, []);

    const value = useMemo(() => ({
        token, profile, booting,
        isAuthenticated: !!token,
        role: profile?.role,
        login, logout, updateProfile,
    }), [token, profile, booting, login, logout, updateProfile]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

export default AuthContext;
