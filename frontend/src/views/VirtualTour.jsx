import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { motion, useReducedMotion } from 'framer-motion';
import { Play } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);
import Button from '../components/ui/Button';
import Seo from '../components/Seo';

const EASE = [0.22, 1, 0.36, 1];

const Fade = ({ children, delay = 0, className }) => {
    const reduced = useReducedMotion();
    if (reduced) return <div className={className}>{children}</div>;
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay, ease: EASE }}
        >
            {children}
        </motion.div>
    );
};

const Eyebrow = ({ children, center = false }) => (
    <div className={`flex items-center gap-3 ${center ? 'justify-center' : ''}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-gold" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">{children}</span>
    </div>
);

const TOUR_STOPS = [
    {
        id: 'gates',
        title: 'The Legacy Gates',
        description: 'Where every child is welcomed by name every single morning. Security is our top priority, with 24/7 monitoring.',
        image: '/cultural_day.jpg' // using existing assets
    },
    {
        id: 'library',
        title: 'The Discovery Library',
        description: 'Stocked with over 5,000 titles, from classic literature to modern encyclopedias, fostering a deep love for reading.',
        image: '/school_library.jpg'
    },
    {
        id: 'tech',
        title: 'Tech & Science Hub',
        description: 'Our modern computer and science labs prepare pupils for the digital age and hands-on discovery.',
        image: '/school_hero_Section.jpg'
    },
    {
        id: 'playground',
        title: 'The Green Playground',
        description: 'A spacious, safe environment for physical education, team sports, and unwinding during break time.',
        image: '/staff_members.jpg'
    }
];

const VirtualTour = () => {
    const container = useRef(null);

    useGSAP(() => {
        // Staggered reveal for the header
        gsap.from('.tour-header > *', {
            y: 50,
            opacity: 0,
            duration: 1,
            stagger: 0.2,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.tour-header',
                start: 'top 80%',
            }
        });

        // Parallax and reveal for each tour stop
        const stops = gsap.utils.toArray('.tour-stop');
        stops.forEach((stop) => {
            const img = stop.querySelector('.tour-img-container');
            const content = stop.querySelector('.tour-content');
            
            // Image parallax
            gsap.fromTo(img, 
                { y: 50, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1.2,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: stop,
                        start: 'top 85%',
                    }
                }
            );

            // Content slide-in
            gsap.fromTo(content,
                { x: stop.classList.contains('reverse') ? -50 : 50, opacity: 0 },
                {
                    x: 0,
                    opacity: 1,
                    duration: 1,
                    delay: 0.2,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: stop,
                        start: 'top 85%',
                    }
                }
            );
        });

        // Final CTA pop
        gsap.from('.tour-cta', {
            scale: 0.9,
            opacity: 0,
            duration: 1,
            ease: 'elastic.out(1, 0.5)',
            scrollTrigger: {
                trigger: '.tour-cta',
                start: 'top 90%',
            }
        });
    }, { scope: container });

    return (
        <div className="bg-bg min-h-screen -mt-16 md:-mt-[4.5rem]" ref={container}>
            <Seo
                title="Virtual Tour"
                description="Take a digital stroll through the Best Legacy Divine School campus in Mowe: four stops, real photos, no visit required."
                path="/virtual-tour"
            />
            {/* Video-preview-card hero — deliberately different from the
                other pages: a dark "player" card instead of a full-bleed
                photo or split text/image layout. */}
            <section className="relative bg-ink overflow-hidden pt-24 md:pt-28 pb-16 md:pb-20">
                <div className="absolute inset-0 grain-dot opacity-20 mix-blend-overlay pointer-events-none" />
                <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-primary/20 to-transparent blur-3xl pointer-events-none" />

                <div className="relative max-w-3xl mx-auto px-6 sm:px-8 text-center">
                    <Fade>
                        <Eyebrow center>Immersive experience</Eyebrow>
                        <h1 className="mt-6 font-serif text-4xl sm:text-5xl md:text-6xl font-medium text-white leading-[1.1] text-balance">
                            Walk our halls from <span className="italic text-gold">anywhere</span> in the world.
                        </h1>
                        <p className="mt-6 max-w-xl mx-auto text-white/70 text-lg leading-relaxed">
                            Take a digital stroll through the Best Legacy campus in Mowe: four stops, real photos, no visit required.
                        </p>
                    </Fade>
                </div>

                <Fade delay={0.15} className="relative max-w-4xl mx-auto px-6 sm:px-8 mt-10">
                    <a
                        href="#stops"
                        aria-label="Jump to the campus tour stops"
                        className="group relative block rounded-2xl overflow-hidden aspect-video border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]"
                    >
                        <img src="/school_hero_Section.jpg" alt="Preview of the Best Legacy campus tour" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-ink/35 group-hover:bg-ink/25 transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/95 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
                                <Play className="w-6 h-6 md:w-7 md:h-7 text-ink translate-x-0.5" fill="currentColor" strokeWidth={0} />
                            </span>
                        </div>
                        <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                            4 stops &middot; ~3 min
                        </div>
                    </a>
                </Fade>
            </section>

            <section id="stops" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
                <div className="text-center mb-16 tour-header overflow-hidden">
                    <h2 className="text-3xl md:text-4xl font-black text-ink">Discover Our Campus</h2>
                    <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Explore our purpose-built facilities designed to nurture excellence and creativity.</p>
                </div>

                <div className="space-y-24">
                    {TOUR_STOPS.map((stop, index) => (
                        <div 
                            key={stop.id}
                            className={`tour-stop flex flex-col md:flex-row gap-10 items-center ${index % 2 !== 0 ? 'md:flex-row-reverse reverse' : ''}`}
                        >
                            <div className="tour-img-container w-full md:w-1/2 relative group">
                                <div className="absolute inset-0 bg-primary/20 transform rotate-3 rounded-3xl transition-transform group-hover:rotate-6"></div>
                                <div className="overflow-hidden rounded-3xl shadow-card">
                                    <img 
                                        src={stop.image} 
                                        alt={stop.title} 
                                        className="relative z-10 w-full h-[400px] object-cover transition-transform duration-1000 group-hover:scale-105"
                                    />
                                </div>
                            </div>
                            <div className="tour-content w-full md:w-1/2 md:px-10">
                                <div className="text-primary font-black text-xl mb-2">0{index + 1}</div>
                                <h3 className="text-3xl font-black text-ink leading-tight mb-4">{stop.title}</h3>
                                <p className="text-gray-600 text-lg leading-relaxed">{stop.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="tour-cta mt-32 bg-primary text-white rounded-[2.5rem] p-8 md:p-16 text-center shadow-2xl">
                    <h2 className="text-3xl md:text-4xl font-black mb-6">Ready to see it in person?</h2>
                    <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                        While our digital tour gives you a glimpse, nothing beats experiencing the Best Legacy warmth firsthand.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
                        <Button href="/admissions" variant="solid" className="bg-white text-primary hover:bg-gray-100 w-full sm:w-auto shadow-xl">Apply Now</Button>
                        <Button href="/contact" className="bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white/20 w-full sm:w-auto shadow-lg">Book a Physical Tour</Button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default VirtualTour;
