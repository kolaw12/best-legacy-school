import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileEnquireBar from './MobileEnquireBar';
import ScrollToTop from './ui/ScrollToTop';
import API_URL from '../config/api';

const Layout = ({ children }) => {
    // Keep-alive ping: hit the backend every 10 min to prevent Render cold starts
    useEffect(() => {
        const ping = () => fetch(`${API_URL}/api/auth/me/`, { method: 'GET', mode: 'no-cors' }).catch(() => {});
        ping();
        const id = setInterval(ping, 10 * 60 * 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="flex flex-col min-h-screen">
            <div className="noise-overlay" aria-hidden="true"></div>
            {/* Skip-to-content for screen reader + keyboard users.
                Hidden until focused — then springs in at top-left in primary green. */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-full focus:shadow-card-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary text-sm font-semibold"
            >
                Skip to main content
            </a>
            <Navbar />
            <main id="main-content" className="flex-grow pt-16 md:pt-[4.5rem]" tabIndex={-1}>
                {children}
            </main>
            <Footer />
            <MobileEnquireBar />
            <ScrollToTop />
        </div>
    );
};

export default Layout;
