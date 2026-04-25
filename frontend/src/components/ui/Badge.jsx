const tones = {
    mint: "bg-primary-soft text-primary-dark",
    warm: "bg-secondary-soft text-secondary-dark",
    neutral: "bg-gray-100 text-gray-700",
    white: "bg-white text-ink shadow-sm",
    ink: "bg-ink text-white",
};

const Badge = ({ tone = 'mint', children, dot = false, className = '' }) => (
    <span className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${tones[tone]} ${className}`}>
        {dot && <span className={`w-1.5 h-1.5 rounded-full ${tone === 'warm' ? 'bg-secondary' : 'bg-primary'}`}></span>}
        {children}
    </span>
);

export default Badge;
