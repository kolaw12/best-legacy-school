import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';

/**
 * Pointer-position 3D tilt + cursor-following highlight.
 * Stolen-from-Linear pattern, downscaled for warmth (max ±6°, soft mint highlight).
 *
 * <TiltCard className="...">
 *   ...content...
 * </TiltCard>
 */
const TiltCard = ({ children, max = 6, highlight = true, className = '', ...rest }) => {
    const reduced = useReducedMotion();
    const ref = useRef(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth springs for the tilt
    const sx = useSpring(x, { stiffness: 220, damping: 20 });
    const sy = useSpring(y, { stiffness: 220, damping: 20 });

    const rotateX = useTransform(sy, [-0.5, 0.5], [max, -max]);
    const rotateY = useTransform(sx, [-0.5, 0.5], [-max, max]);

    // Highlight gradient that follows the pointer
    const hlX = useTransform(sx, v => `${(v + 0.5) * 100}%`);
    const hlY = useTransform(sy, v => `${(v + 0.5) * 100}%`);
    // Hoisted above the `reduced` early return and out of the `highlight &&`
    // JSX branch below — calling useTransform conditionally would violate the
    // Rules of Hooks the moment `highlight` isn't constant across renders.
    const highlightBg = useTransform([hlX, hlY], ([hx, hy]) =>
        `radial-gradient(220px circle at ${hx} ${hy}, rgba(91,108,245,0.28), transparent 60%)`
    );

    if (reduced) {
        return <div className={className} {...rest}>{children}</div>;
    }

    const onMove = (e) => {
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width - 0.5);
        y.set((e.clientY - r.top) / r.height - 0.5);
    };
    const onLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className={`relative ${className}`}
            {...rest}
        >
            <div style={{ transform: 'translateZ(0)' }}>{children}</div>
            {highlight && (
                <motion.div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-[inherit] pointer-events-none mix-blend-overlay opacity-60"
                    style={{ background: highlightBg }}
                />
            )}
        </motion.div>
    );
};

export default TiltCard;
