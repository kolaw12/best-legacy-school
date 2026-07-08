/**
 * Continuously scrolling horizontal band — pure CSS marquee, pauses on hover.
 *
 * <MarqueeStrip
 *   items={['Nurturing minds since 2009', 'Nursery 1 → Basic 6', 'Mowe, Ogun State']}
 *   tone="primary"
 * />
 */
const TONES = {
    primary:   { bg: 'bg-primary',         text: 'text-white',          dot: 'bg-secondary' },
    secondary: { bg: 'bg-secondary',       text: 'text-ink',            dot: 'bg-ink' },
    mint:      { bg: 'bg-mint',            text: 'text-primary-dark',   dot: 'bg-secondary' },
    ink:       { bg: 'bg-ink',             text: 'text-white',          dot: 'bg-primary' },
};

const MarqueeStrip = ({ items = [], tone = 'primary', className = '' }) => {
    if (!items.length) return null;
    const t = TONES[tone] || TONES.primary;
    // Duplicate the list so the loop is seamless.
    const doubled = [...items, ...items];

    return (
        <div className={`overflow-hidden ${t.bg} ${t.text} py-3 md:py-4 ${className}`} aria-hidden="true">
            <div className="flex animate-marquee whitespace-nowrap" style={{ width: 'max-content' }}>
                {doubled.map((item, i) => (
                    <span key={i} className="flex items-center gap-4 px-6 text-sm md:text-base font-semibold tracking-wide">
                        {item}
                        <span className={`inline-block w-2 h-2 rounded-full ${t.dot} opacity-80`}></span>
                    </span>
                ))}
            </div>
        </div>
    );
};

export default MarqueeStrip;
