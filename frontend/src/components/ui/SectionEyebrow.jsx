import Badge from './Badge';

const SectionEyebrow = ({ eyebrow, title, description, align = 'left', tone = 'mint', className = '' }) => (
    <div className={`${align === 'center' ? 'text-center' : ''} ${className}`}>
        {eyebrow && <Badge tone={tone}>{eyebrow}</Badge>}
        {title && <h2 className="mt-4 text-3xl md:text-4xl font-black text-ink leading-tight text-balance">{title}</h2>}
        {description && <p className={`mt-4 text-gray-600 ${align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-xl'}`}>{description}</p>}
    </div>
);

export default SectionEyebrow;
