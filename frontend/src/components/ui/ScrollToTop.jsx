import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useLenis } from 'lenis/react';

/**
 * Floating "back to top" button — fades in once the user has scrolled past
 * one screen height, scrolls smoothly back up via the site's Lenis instance
 * (falls back to native smooth-scroll if Lenis isn't mounted).
 */
const ScrollToTop = () => {
    const [visible, setVisible] = useState(false);
    const lenis = useLenis();

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 480);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollToTop = () => {
        if (lenis) {
            lenis.scrollTo(0, { duration: 1.2 });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    onClick={scrollToTop}
                    initial={{ opacity: 0, y: 16, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.85 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    aria-label="Scroll to top"
                    className="no-print fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 w-11 h-11 rounded-full bg-ink text-white flex items-center justify-center shadow-card-lg hover:bg-gray-800 transition-colors"
                >
                    <ArrowUp className="w-5 h-5" strokeWidth={2.25} />
                </motion.button>
            )}
        </AnimatePresence>
    );
};

export default ScrollToTop;
