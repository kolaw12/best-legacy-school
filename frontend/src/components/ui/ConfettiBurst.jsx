import { useEffect, useState, useId } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

/**
 * One-shot 24-particle burst. Library-free.
 * Trigger by toggling the `fire` prop true once; the component auto-resets
 * after the animation completes.
 *
 * <ConfettiBurst fire={success} />
 */
// On-palette confetti: periwinkle + indigo + marigold + lavender-sage + dusty-rose.
// First two read from tokens so they stay in sync if the palette shifts again.
const COLORS = [
    'var(--color-primary)',     // periwinkle
    'var(--color-secondary)',   // marigold
    '#3D3B8E',                  // indigo (depth)
    '#A8B4FF',                  // periwinkle-sage
    '#E07A9B',                  // dusty rose
];

const ConfettiBurst = ({ fire, count = 24, duration = 0.9, originY = '50%' }) => {
    const reduced = useReducedMotion();
    const [show, setShow] = useState(false);
    const id = useId();

    useEffect(() => {
        if (!fire) return;
        if (reduced) return;
        setShow(true);
        const t = setTimeout(() => setShow(false), duration * 1000);
        return () => clearTimeout(t);
    }, [fire, reduced, duration]);

    if (reduced) return null;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    key={id}
                    aria-hidden="true"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 pointer-events-none overflow-visible"
                >
                    {Array.from({ length: count }).map((_, i) => {
                        const angle = (i / count) * Math.PI * 2;
                        const distance = 90 + Math.random() * 70;
                        const x = Math.cos(angle) * distance;
                        const y = Math.sin(angle) * distance;
                        const color = COLORS[i % COLORS.length];
                        const size = 8 + Math.random() * 6;
                        const isCircle = i % 3 === 0;
                        return (
                            <motion.span
                                key={i}
                                className={`absolute left-1/2 ${isCircle ? 'rounded-full' : 'rounded-sm'}`}
                                style={{
                                    top: originY,
                                    width: size,
                                    height: size,
                                    backgroundColor: color,
                                }}
                                initial={{ x: 0, y: 0, opacity: 1, scale: 0.6, rotate: 0 }}
                                animate={{
                                    x,
                                    y: y - 30, // arc upward a bit
                                    opacity: [1, 1, 0],
                                    scale: [0.6, 1, 0.4],
                                    rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                                }}
                                transition={{
                                    duration,
                                    ease: [0.22, 1, 0.36, 1],
                                    times: [0, 0.6, 1],
                                }}
                            />
                        );
                    })}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConfettiBurst;
