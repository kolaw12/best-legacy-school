import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, ArrowRight } from 'lucide-react';

/**
 * Sticky bottom-of-viewport bar for mobile only.
 * - Hidden above md breakpoint (desktop already has CTAs)
 * - Hidden inside admin / teacher / parent portals
 * - Slides in once the user has scrolled ~one screen
 */
const MobileEnquireBar = () => {
    const [show, setShow] = useState(false);
    const { pathname } = useLocation();

    const inPortal = pathname.startsWith('/admin') || pathname.startsWith('/teacher') || pathname.startsWith('/portal');

    useEffect(() => {
        if (inPortal) return;
        const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.6);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, [inPortal]);

    if (inPortal) return null;

    return (
        <div
            className={`fixed bottom-0 inset-x-0 z-40 md:hidden p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-all duration-300 ease-out ${show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}
            role="region"
            aria-label="Quick contact bar"
        >
            <div className="no-print bg-white shadow-card-lg rounded-2xl border border-gray-100 flex items-center gap-2 p-2">
                <a
                    href="tel:+2348067663966"
                    className="pulse-ring flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary text-ink font-semibold text-sm shadow-sm"
                >
                    <Phone className="w-4 h-4" strokeWidth={2} />
                    Call Us
                </a>
                <Link
                    to="/admissions"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-mint text-primary-dark font-semibold text-sm"
                >
                    Apply
                    <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </Link>
            </div>
        </div>
    );
};

export default MobileEnquireBar;
