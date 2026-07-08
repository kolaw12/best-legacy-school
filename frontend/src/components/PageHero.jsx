import { motion, useReducedMotion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1];

const Fade = ({ children, delay = 0, className }) => {
    const reduced = useReducedMotion();
    if (reduced) return <div className={className}>{children}</div>;
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay, ease: EASE }}
        >
            {children}
        </motion.div>
    );
};

/**
 * Shared secondary-page hero — used by FAQ, Tour Booking, and Application
 * Status. Its own distinct shape in the site's hero lineup: a masked photo
 * fading in from the right edge, rather than Home/About's split column,
 * Admissions' full-bleed dark photo, Contact's photo-free type, or
 * Gallery's scattered collage.
 */
const PageHero = ({ eyebrow, title, subtitle, bgImage, children }) => {
    return (
        <section className="relative overflow-hidden bg-paper pt-28 pb-14 md:pt-32 md:pb-20 -mt-16 md:-mt-[4.5rem]">
            <div className="absolute inset-0 mesh-gradient-premium opacity-70 pointer-events-none" />
            {bgImage && (
                <div
                    className="absolute right-0 top-0 bottom-0 w-1/2 bg-cover bg-center hidden md:block"
                    style={{
                        backgroundImage: `url('${bgImage}')`,
                        maskImage: 'linear-gradient(to left, rgba(0,0,0,0.9), rgba(0,0,0,0))',
                        WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.9), rgba(0,0,0,0))',
                    }}
                />
            )}
            <div className="relative max-w-6xl mx-auto px-6 sm:px-8">
                <Fade>
                    {eyebrow && (
                        <div className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">{eyebrow}</span>
                        </div>
                    )}
                    <h1 className="mt-5 font-serif text-4xl sm:text-5xl md:text-6xl font-medium text-ink leading-[1.1] text-balance max-w-2xl">
                        {title}
                    </h1>
                    {subtitle && <p className="mt-5 text-lg text-gray-600 max-w-xl leading-relaxed">{subtitle}</p>}
                    {children && <div className="mt-8">{children}</div>}
                </Fade>
            </div>
        </section>
    );
};

export default PageHero;
