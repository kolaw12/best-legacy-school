import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Wrap routes so children fade-in on navigation. Uses CSS transitions
 * instead of framer-motion to keep the main bundle small.
 */
const PageTransition = ({ children }) => {
    const location = useLocation();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Trigger fade-in on route change
        setVisible(false);
        const raf = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(raf);
    }, [location.pathname]);

    return (
        <div
            className="transition-opacity duration-300 ease-out"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)' }}
        >
            {children}
        </div>
    );
};

export default PageTransition;
