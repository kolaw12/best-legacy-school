/**
 * Shimmer placeholder. Variants: text | line | kpi | card | avatar.
 *
 * <Skeleton variant="kpi" />
 * <Skeleton variant="text" lines={3} />
 * <Skeleton className="h-32 w-full rounded-2xl" />  // raw
 */
const VARIANTS = {
    text:   'h-4 w-full rounded',
    line:   'h-3 w-2/3 rounded',
    kpi:    'h-24 w-full rounded-2xl',
    card:   'h-48 w-full rounded-2xl',
    avatar: 'h-10 w-10 rounded-full',
    pill:   'h-6 w-24 rounded-full',
};

const Skeleton = ({ variant = 'text', lines = 1, className = '' }) => {
    const base = 'animate-shimmer';
    const cls  = `${base} ${VARIANTS[variant] || ''} ${className}`;

    if (variant === 'text' && lines > 1) {
        return (
            <div className="space-y-2">
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={`${base} h-4 rounded`}
                        style={{ width: `${100 - (i % 3) * 18}%` }}
                    />
                ))}
            </div>
        );
    }

    return <div className={cls} />;
};

export default Skeleton;
