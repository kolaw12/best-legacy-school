import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLenis } from 'lenis/react';

/**
 * Floating "back to top" button — fades in once the user has scrolled past
 * one screen height, scrolls smoothly back up.
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
        <button
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className={`no-print fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 w-11 h-11 rounded-full bg-ink text-white flex items-center justify-center shadow-card-lg hover:bg-gray-800 transition-all duration-300 hover:scale-105 active:scale-95 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
            <ArrowUp className="w-5 h-5" strokeWidth={2.25} />
        </button>
    );
};

export default ScrollToTop;
