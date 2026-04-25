import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

/**
 * Soft periwinkle glow that follows the cursor inside its parent container.
 * - Desktop only (hidden on coarse pointers)
 * - Honours prefers-reduced-motion
 * - Uses a spring on x/y so it lags behind, like Linear's hero glow
 *
 * <div className="relative">
 *   <CursorSpotlight color="rgb(91 108 245 / 0.18)" size={420} />
 *   ...content...
 * </div>
 */
const CursorSpotlight = ({ color = 'rgba(91, 108, 245, 0.14)', size = 420, className = '' }) => {
    const reduced = useReducedMotion();
    const ref = useRef(null);
    const x = useMotionValue(-9999);
    const y = useMotionValue(-9999);
    const sx = useSpring(x, { stiffness: 150, damping: 25, mass: 0.6 });
    const sy = useSpring(y, { stiffness: 150, damping: 25, mass: 0.6 });

    useEffect(() => {
        if (reduced) return;
        const el = ref.current?.parentElement;
        if (!el) return;

        const onMove = (e) => {
            const r = el.getBoundingClientRect();
            x.set(e.clientX - r.left - size / 2);
            y.set(e.clientY - r.top - size / 2);
        };
        const onLeave = () => {
            x.set(-9999);
            y.set(-9999);
        };

        el.addEventListener('mousemove', onMove);
        el.addEventListener('mouseleave', onLeave);
        return () => {
            el.removeEventListener('mousemove', onMove);
            el.removeEventListener('mouseleave', onLeave);
        };
    }, [reduced, size, x, y]);

    if (reduced) return null;

    return (
        <motion.div
            ref={ref}
            aria-hidden="true"
            className={`absolute pointer-events-none rounded-full blur-3xl hidden md:block ${className}`}
            style={{
                width: size,
                height: size,
                x: sx,
                y: sy,
                background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            }}
        />
    );
};

export default CursorSpotlight;
