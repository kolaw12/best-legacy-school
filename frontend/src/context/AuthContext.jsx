import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import API_URL from '../config/api';

const TOKEN_KEY = 'bls_auth_token';
const PROFILE_KEY = 'bls_auth_profile';

const AuthContext = createContext(null);

// Set/clear Authorization header globally so every axios request carries the token.
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
    const [booting, setBooting] = useState(!!token);

    // On mount, if we have a stored token, verify it against /auth/me/
    // (also catches a stale demo-token-* left over from before the client-side
    // demo shortcut was removed — it'll fail verification and get purged below).
    useEffect(() => {
        if (!token) { setBooting(false); return; }
        setAxiosAuth(token);
        axios.get(`${API_URL}/api/auth/me/`)
            .then(r => {
                setProfile(r.data);
                localStorage.setItem(PROFILE_KEY, JSON.stringify(r.data));
            })
            .catch(() => {
                // Stale token — purge.
                setToken(null);
                setProfile(null);
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(PROFILE_KEY);
                setAxiosAuth(null);
            })
            .finally(() => setBooting(false));
    }, [token]);

    const login = async (username, password) => {
        const { data } = await axios.post(`${API_URL}/api/auth/login/`, { username, password });
        setToken(data.token);
        setProfile(data.profile);
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile));
        setAxiosAuth(data.token);
        return data.profile;
    };

    const logout = async () => {
        try { await axios.post(`${API_URL}/api/auth/logout/`); } catch { /* ignore */ }
        setToken(null);
        setProfile(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(PROFILE_KEY);
        setAxiosAuth(null);
    };

    const value = useMemo(() => ({
        token, profile, booting,
        isAuthenticated: !!token,
        role: profile?.role,
        login, logout,
    }), [token, profile, booting]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

export default AuthContext;
