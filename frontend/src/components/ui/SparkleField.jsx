import { useMemo } from 'react';

/**
 * Decorative sparkle layer for hero sections.
 * Emits N twinkling SVG sparkles at randomised positions / delays.
 * Pure CSS — uses the .animate-sparkle utility from index.css.
 */
const SparkleField = ({ count = 8, color = 'rgb(255 255 255 / 0.85)', className = '' }) => {
    const sparkles = useMemo(
        () => Array.from({ length: count }).map((_, i) => ({
            id: i,
            left: Math.round(Math.random() * 100),
            top: Math.round(Math.random() * 100),
            size: 6 + Math.round(Math.random() * 12),
            delay: (Math.random() * 3).toFixed(2),
            duration: (1.8 + Math.random() * 2.4).toFixed(2),
        })),
        [count],
    );

    return (
        <div className={`absolute inset-0 pointer-events-none ${className}`} aria-hidden="true">
            {sparkles.map(s => (
                <svg
                    key={s.id}
                    width={s.size}
                    height={s.size}
                    viewBox="0 0 24 24"
                    className="absolute animate-sparkle"
                    style={{
                        left: `${s.left}%`,
                        top: `${s.top}%`,
                        animationDelay: `${s.delay}s`,
                        animationDuration: `${s.duration}s`,
                        color,
                    }}
                >
                    <path
                        d="M12 0L13.5 9 22.5 10 13.5 12 12 21 10.5 12 1.5 10 10.5 9z"
                        fill="currentColor"
                    />
                </svg>
            ))}
        </div>
    );
};

export default SparkleField;
