import Badge from './ui/Badge';

const PageHero = ({ eyebrow, title, subtitle, bgImage, children }) => {
    return (
        <section className="relative overflow-hidden bg-mint pt-24 pb-14 md:pt-28 md:pb-20 -mt-16">
            <div className="absolute inset-0 grain-dot opacity-40 pointer-events-none"></div>
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/20 blur-3xl"></div>
            {bgImage && (
                <div
                    className="absolute right-0 top-0 bottom-0 w-1/2 opacity-30 md:opacity-60 bg-cover bg-center hidden md:block"
                    style={{
                        backgroundImage: `url('${bgImage}')`,
                        maskImage: 'linear-gradient(to left, rgba(0,0,0,1), rgba(0,0,0,0))',
                        WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1), rgba(0,0,0,0))',
                    }}
                ></div>
            )}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
                {eyebrow && <Badge tone="white" dot>{eyebrow}</Badge>}
                <h1 className="mt-4 text-4xl md:text-5xl font-black text-ink leading-tight text-balance max-w-3xl">
                    {title}
                </h1>
                {subtitle && <p className="mt-4 text-lg text-gray-600 max-w-2xl">{subtitle}</p>}
                {children && <div className="mt-6">{children}</div>}
            </div>
        </section>
    );
};

export default PageHero;
