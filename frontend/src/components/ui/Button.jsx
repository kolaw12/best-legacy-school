import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-full whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:opacity-60 disabled:cursor-not-allowed";

const sizes = {
    sm: "text-xs px-4 py-2",
    md: "text-sm px-5 py-2.5",
    lg: "text-base px-7 py-3.5",
};

const variants = {
    primary:   "bg-primary hover:bg-primary-dark text-white shadow-sm hover:shadow-md",
    // WCAG: white-on-purple (#9333EA) is ~4.5:1 (PASS AA).
    secondary: "bg-secondary hover:bg-secondary-dark text-white shadow-sm hover:shadow-md",
    outline:   "bg-white text-ink border border-gray-200 hover:border-primary hover:text-primary",
    ghost:     "bg-transparent text-ink hover:bg-primary-soft",
    dark:      "bg-ink text-white hover:bg-gray-800",
};

const Button = ({
    variant = 'primary',
    size = 'md',
    to,
    href,
    className = '',
    children,
    ...rest
}) => {
    const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;
    
    // Magnetic Effect Logic
    const ref = useRef(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    const handleMouseMove = (e) => {
        if (!ref.current) return;
        const { clientX, clientY } = e;
        const { height, width, left, top } = ref.current.getBoundingClientRect();
        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);
        x.set(middleX * 0.2); // 20% magnetic pull
        y.set(middleY * 0.2);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    // Determine the underlying component based on props
    const Component = to ? motion.create(Link) : href ? motion.a : motion.button;
    const additionalProps = to ? { to } : href ? { href } : {};

    return (
        <Component
            ref={ref}
            className={cls}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ x: springX, y: springY }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            {...additionalProps}
            {...rest}
        >
            {children}
        </Component>
    );
};

export default Button;
