import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Horizontal scroll-snap carousel with mint progress dots.
 *
 * <SnapCarousel slides={[
 *   { src: '/cultural_day.jpg', alt: 'Cultural Day', tag: 'Cultural Day 2026' },
 *   ...
 * ]} />
 */
const SnapCarousel = ({ slides = [], className = '' }) => {
    const trackRef = useRef(null);
    const [active, setActive] = useState(0);

    // Track which slide is centred most-of-the-way through scroll.
    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        const onScroll = () => {
            const slideWidth = el.scrollWidth / Math.max(slides.length, 1);
            const idx = Math.round(el.scrollLeft / slideWidth);
            setActive(Math.min(slides.length - 1, Math.max(0, idx)));
        };
        el.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => el.removeEventListener('scroll', onScroll);
    }, [slides.length]);

    const goTo = (i) => {
        const el = trackRef.current;
        if (!el) return;
        const slideWidth = el.scrollWidth / Math.max(slides.length, 1);
        el.scrollTo({ left: slideWidth * i, behavior: 'smooth' });
    };

    if (!slides.length) return null;

    return (
        <div className={className}>
            <div
                ref={trackRef}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth"
                style={{ scrollbarWidth: 'none' }}
            >
                <style>{`.snap-track::-webkit-scrollbar { display: none; }`}</style>
                {slides.map((s, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -4 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                        className="snap-center shrink-0 w-[78%] sm:w-[58%] md:w-[42%] lg:w-[34%] rounded-3xl overflow-hidden shadow-card hover:shadow-card-lg bg-white"
                    >
                        <div className="relative aspect-[4/5] overflow-hidden">
                            <img
                                src={s.src}
                                alt={s.alt || s.tag || ''}
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-[1.04]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent"></div>
                            {s.tag && (
                                <span className="absolute bottom-4 left-4 bg-white/95 text-[11px] uppercase tracking-widest font-bold text-primary px-3 py-1.5 rounded-full">
                                    {s.tag}
                                </span>
                            )}
                        </div>
                        {s.caption && (
                            <div className="p-5">
                                <p className="text-sm text-gray-700 leading-relaxed">{s.caption}</p>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mt-3" role="tablist">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => goTo(i)}
                        role="tab"
                        aria-selected={i === active}
                        aria-label={`Go to slide ${i + 1}`}
                        className="group p-2"
                    >
                        <span
                            className={`block h-1.5 rounded-full transition-all duration-300 ${
                                i === active
                                    ? 'w-8 bg-primary'
                                    : 'w-1.5 bg-gray-300 group-hover:bg-primary/60'
                            }`}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SnapCarousel;
