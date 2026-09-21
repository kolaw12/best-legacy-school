import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [dark, setDark] = useState(() => {
        try {
            const stored = localStorage.getItem('bls.darkMode');
            if (stored !== null) return stored === 'true';
        } catch {
            // ignore
        }
        return false; // default to light mode
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', dark);
        try { localStorage.setItem('bls.darkMode', String(dark)); } catch { /* ignore */ }
    }, [dark]);

    const toggle = () => setDark(d => !d);

    return (
        <ThemeContext.Provider value={{ dark, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
