import { motion, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

/**
 * Wrap a tree of routes so that children fade-up between navigations.
 * Skips animation for users with reduced-motion preferences.
 */
const PageTransition = ({ children }) => {
    const reduced = useReducedMotion();
    const location = useLocation();

    if (reduced) return children;

    return (
        <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
