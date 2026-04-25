import { motion, useReducedMotion } from 'framer-motion';

/**
 * A hand-drawn squiggly underline that draws itself on scroll-into-view.
 * Used as a delight accent under section headings.
 *
 * <h2>Title <SquiggleDivider /></h2>
 */
const SquiggleDivider = ({
    color = 'currentColor',
    width = 140,
    height = 14,
    className = '',
    delay = 0.15,
}) => {
    const reduced = useReducedMotion();

    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 140 14"
            fill="none"
            className={`inline-block ${className}`}
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            <motion.path
                d="M2 8 Q 18 0, 35 8 T 70 8 T 105 8 T 138 8"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                initial={reduced ? false : { pathLength: 0, opacity: 0 }}
                whileInView={reduced ? undefined : { pathLength: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 1.2, delay, ease: [0.65, 0, 0.35, 1] }}
            />
        </svg>
    );
};

export default SquiggleDivider;
