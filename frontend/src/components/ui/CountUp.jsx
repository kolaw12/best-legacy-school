import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

/**
 * Animated number that counts up to `to` when scrolled into view.
 * Honours prefers-reduced-motion (renders the final number immediately).
 *
 * <CountUp to={560} suffix="+" /> -> 0 → 560+
 */
const CountUp = ({ to = 0, duration = 1.4, suffix = '', prefix = '', className }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: 0.5 });
    const reduced = useReducedMotion();
    const [n, setN] = useState(reduced ? to : 0);

    useEffect(() => {
        if (!inView || reduced) return;
        let raf;
        const start = performance.now();
        const step = (now) => {
            const t = Math.min(1, (now - start) / (duration * 1000));
            const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
            setN(Math.round(to * eased));
            if (t < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [inView, to, duration, reduced]);

    return (
        <span ref={ref} className={className}>
            {prefix}{n.toLocaleString('en-NG')}{suffix}
        </span>
    );
};

export default CountUp;
