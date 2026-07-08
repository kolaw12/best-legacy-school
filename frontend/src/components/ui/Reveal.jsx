import { motion, useReducedMotion } from 'framer-motion';

/**
 * Fade/slide-in wrapper. Animates on mount rather than on scroll-into-view:
 * this site uses Lenis smooth-scroll (see main.jsx), which can leave
 * whileInView-based reveals stuck at their hidden initial state — native
 * IntersectionObserver timing doesn't always line up with Lenis-driven
 * scroll updates. Mount-triggered animation is slightly less "reveals as
 * you scroll" but is guaranteed to actually show the content.
 *
 * Usage:
 *   <Reveal><h2>Hello</h2></Reveal>
 *   <Reveal delay={0.1}>...</Reveal>
 *   <Reveal stagger gap={0.08}> {items.map(...)} </Reveal>
 */
const Reveal = ({
    children,
    delay = 0,
    stagger = false,
    gap = 0.08,
    className,
    as: Tag = 'div',
}) => {
    const reduced = useReducedMotion();

    if (reduced) {
        return <Tag className={className}>{children}</Tag>;
    }

    if (stagger) {
        return (
            <motion.div
                className={className}
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: gap, delayChildren: delay } },
                }}
            >
                {Array.isArray(children)
                    ? children.map((child, i) => (
                        <motion.div
                            key={child?.key ?? i}
                            variants={{
                                hidden: { opacity: 0, y: 40, filter: 'blur(10px)', scale: 0.95 },
                                visible: { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
                            }}
                        >
                            {child}
                        </motion.div>
                    ))
                    : children}
            </motion.div>
        );
    }

    const MotionTag = motion[Tag] || motion.div;
    return (
        <MotionTag
            className={className}
            initial={{ opacity: 0, y: 40, filter: 'blur(10px)', scale: 0.95 }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
            transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
        >
            {children}
        </MotionTag>
    );
};

export default Reveal;
