import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, Award, ShieldCheck, GraduationCap, Pencil, BookOpen, Ruler, Volleyball, Star, Backpack, Palette, Calculator, Puzzle, PaintBucket, Lightbulb } from 'lucide-react';
import CountUp from '../components/ui/CountUp';
import CursorSpotlight from '../components/ui/CursorSpotlight';
import TiltCard from '../components/ui/TiltCard';
import Magnetic from '../components/ui/Magnetic';
import MarqueeStrip from '../components/ui/MarqueeStrip';
import Seo from '../components/Seo';

const EASE = [0.22, 1, 0.36, 1];

/* ========================================================================
   Motion primitives — quiet-luxury choreography: fade/blur/slide/wipe,
   scroll-tied parallax and progress, ambient continuous loops. No spring
   bounce, no rotation, everything guarded by prefers-reduced-motion.
   ======================================================================== */

/** Fixed reading-progress bar, tied 1:1 to scroll (not decorative — left on
 *  even under reduced motion, since it's direct manipulation feedback). */
const ScrollProgress = () => {
    const { scrollYProgress } = useScroll();
    return (
        <motion.div
            aria-hidden="true"
            className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-gold origin-left z-[100]"
            style={{ scaleX: scrollYProgress }}
        />
    );
};

/** Fade/slide/blur-in wrapper. Animates on mount rather than on
 *  scroll-into-view: this site uses Lenis smooth-scroll (see main.jsx),
 *  which can leave whileInView-based reveals stuck at their hidden initial
 *  state (native IntersectionObserver timing doesn't always line up with
 *  Lenis-driven scroll updates). Mount-triggered animation is slightly less
 *  "reveals as you scroll" but is guaranteed to actually show the content. */
const Reveal = ({ children, delay = 0, x = 0, y = 24, className, as: Tag = 'div' }) => {
    const reduced = useReducedMotion();
    if (reduced) return <Tag className={className}>{children}</Tag>;
    const MotionTag = motion[Tag] || motion.div;
    return (
        <MotionTag
            className={className}
            initial={{ opacity: 0, x, y, filter: 'blur(6px)' }}
            animate={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay, ease: EASE }}
        >
            {children}
        </MotionTag>
    );
};

/** Mask-line headline reveal — the line slides up from behind an overflow
 *  clip, the classic premium hero-headline entrance. Animates on mount (not
 *  scroll-into-view) since this is only ever used for above-the-fold hero
 *  copy that's visible immediately — whileInView can get stuck at its
 *  hidden initial state for content that's already in the viewport at load. */
const LineReveal = ({ children, delay = 0, className = '' }) => {
    const reduced = useReducedMotion();
    if (reduced) return <span className={className}>{children}</span>;
    return (
        <span className={`block overflow-hidden ${className}`}>
            <motion.span
                className="block"
                initial={{ y: '100%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 0.9, delay, ease: EASE }}
            >
                {children}
            </motion.span>
        </span>
    );
};

/** Photo with a curtain-wipe reveal on scroll-in, optional parallax drift
 *  and optional ambient "breathing" zoom for continuous life. */
const RevealImage = ({ src, alt, aspect = 'aspect-[4/3]', parallax = false, breathe = false, delay = 0, className = '' }) => {
    const reduced = useReducedMotion();
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
    const y = useTransform(scrollYProgress, [0, 1], [-24, 24]);

    return (
        <div ref={ref} className={`relative overflow-hidden rounded-2xl shadow-card-lg ${aspect} ${className}`}>
            <motion.div style={{ y: parallax && !reduced ? y : 0 }} className="absolute inset-x-0 -top-[8%] h-[116%]">
                <img src={src} alt={alt} loading="lazy" className={`w-full h-full object-cover ${breathe && !reduced ? 'animate-breathe' : ''}`} />
            </motion.div>
            {!reduced && (
                <motion.div
                    aria-hidden="true"
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: 0.85, delay, ease: EASE }}
                    style={{ transformOrigin: 'right' }}
                    className="absolute inset-0 bg-ink z-10"
                />
            )}
        </div>
    );
};

const Eyebrow = ({ children, tone = 'light', className = '' }) => (
    <div className={`flex items-center gap-3 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-gold" />
        <span className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${tone === 'dark' ? 'text-white/70' : 'text-gray-500'}`}>
            {children}
        </span>
    </div>
);

const ArrowIcon = ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
);

const CheckIcon = ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

/** A single school-themed icon, gently bobbing/rotating in an otherwise
 *  empty patch of background — decorative, not interactive. Callers add
 *  `hidden sm:block` etc. via className where a section's padding band
 *  is too tight on mobile to hold it without crowding real content. */
const FloatingIcon = ({ icon: Icon, className = '', size = 'w-10 h-10', color = 'text-primary/40', rotate = 0, delay = 0, duration = 7 }) => {
    const reduced = useReducedMotion();
    if (reduced) {
        // Still show the icon under reduced-motion — just skip the loop.
        return (
            <div aria-hidden="true" className={`absolute pointer-events-none ${className}`} style={{ transform: `rotate(${rotate}deg)` }}>
                <Icon className={`${size} ${color}`} strokeWidth={1.5} />
            </div>
        );
    }
    return (
        <motion.div
            aria-hidden="true"
            className={`absolute pointer-events-none ${className}`}
            initial={{ opacity: 0, y: 12, rotate }}
            animate={{ opacity: 1, y: [0, -14, 0], rotate: [rotate, rotate + 10, rotate] }}
            transition={{
                opacity: { duration: 0.8, delay },
                y: { duration, repeat: Infinity, ease: 'easeInOut', delay },
                rotate: { duration: duration * 1.2, repeat: Infinity, ease: 'easeInOut', delay },
            }}
        >
            <Icon className={`${size} ${color}`} strokeWidth={1.5} />
        </motion.div>
    );
};

/* ========================================================================
   Content
   ======================================================================== */
const TICKER_ITEMS = [
    'Nursery 1 → Basic 6',
    'Sixteen years in Mowe',
    'Class teachers who know every child by name',
    'Apply for the 2026 / 2027 session',
    '8, Kolawole Street, Ogun State',
];

const TRUST_ITEMS = [
    { line1: 'Registered with',    line2: 'Ogun State Ministry of Education' },
    { line1: 'Member',              line2: 'Association of Private Schools' },
    { line1: 'Christian-led, but', line2: 'open to children of all faiths' },
    { line1: 'Established',         line2: '2009 · 16+ years serving Mowe' },
];

const DAY_STOPS = [
    { time: '7:30am',  title: 'Warm welcome',       body: 'Pupils arrive to a calm song, a hello from their class teacher and a quiet morning activity.' },
    { time: '8:00am',  title: 'Morning assembly',   body: 'A short assembly: hymn, a thought for the day, and a shout-out for one pupil who showed kindness yesterday.' },
    { time: '9:00am',  title: 'Core lessons',       body: 'Phonics, numeracy and reading happen when little minds are freshest. Lessons run 30 minutes max for nursery, 45 for basic.' },
    { time: '10:30am', title: 'Snack & free play',  body: 'A healthy snack provided by the school, then 30 minutes of unstructured outdoor play. No screens. Lots of running.' },
    { time: '11:30am', title: 'Creative block',     body: 'Art, music, drama, or science exploration depending on the day. Children rotate so every week covers all four.' },
    { time: '1:00pm',  title: 'Lunch together',     body: 'Hot meal in the dining hall. Older basic pupils help nursery friends with their plates, a small thing that teaches a lot.' },
    { time: '2:30pm',  title: 'Quiet close & home', body: 'Reading time, gentle reflection, then a tidy classroom and a smile at the gate. Parents collect by 3:00pm.' },
];

const FEATURES = [
    { n: '01', t: 'Creative learning', d: 'Hands-on activities for every subject. Even mathematics becomes a game when you teach it well.', img: '/cultural_day.jpg' },
    { n: '02', t: 'Trained teachers',  d: 'Every class teacher holds a B.Ed or NCE. We don’t hire shortcuts.', img: '/staff_members.jpg' },
    { n: '03', t: 'Whole-child care',  d: 'Academic, social, emotional, spiritual. We track all four because parents do too.', img: '/school_hero_Section.jpg' },
    { n: '04', t: 'Safe & familiar',   d: 'Locked-gate campus, named visitor logbook, and a school nurse on duty.', img: '/fun_in_the_pool.jpg' },
];

const TIERS = [
    { name: 'Nursery (1 & 2)', age: '3–5 years',  price: '₦75,000',  featured: false },
    { name: 'Basic 1 – 3', age: '6–8 years',  price: '₦95,000',  featured: true },
    { name: 'Basic 4 – 6', age: '9–11 years', price: '₦115,000', featured: false },
];

const INCLUDED = [
    'Tuition & class materials',
    'Textbooks & exercise books',
    'Daily hot lunch & snack',
    'Termly reports & PTA meetings',
    'School nurse on call',
];

const PARENT_STORIES = [
    {
        name: 'Mrs Funke Adeleke',
        child: 'Mother of Ayomide, Basic 3',
        photo: '/staff_members.jpg',
        quote: 'In her first term I watched her go from shy at the gate to running ahead of me.',
        body: 'We moved to Mowe in 2024 and visited four schools before we landed here. What sold us was that Mrs Bello, her would-be class teacher, sat on the floor with her at the assessment. Two years on, Ayomide reads above her level and writes little stories in her journal at home.',
    },
    {
        name: 'Mr Musa Bello',
        child: 'Father of Zainab, Basic 4',
        photo: '/fun_in_the_pool.jpg',
        quote: 'Her teachers email us before there’s ever a problem. That alone is rare.',
        body: 'I work shifts and don’t always make it for pickup. Best Legacy never makes me feel like the absent parent. They send Friday updates, share photos from cultural day on time, and the head teacher actually answers her phone.',
    },
    {
        name: 'Mrs Ngozi Eze',
        child: 'Mother of Samuel, Basic 2',
        photo: '/cultural_day.jpg',
        quote: 'We chose them for the values, we stayed for the discipline.',
        body: 'Samuel had been at a much bigger school where he was just a number. Here he has 18 classmates, a class teacher who knows his strengths, and a school that genuinely teaches respect.',
    },
];

const STATS = [
    { num: 18,  suffix: '',  label: 'Maximum class size', desc: 'Small enough that every child is known by name.', icon: Users },
    { num: 16,  suffix: '+', label: 'Years of excellence', desc: 'Serving families in Mowe since 2009.', icon: Award },
    { num: 100, suffix: '%', label: 'Certified teachers', desc: 'Every class led by a qualified B.Ed or NCE holder.', icon: ShieldCheck },
    { num: 560, suffix: '+', label: 'Pupils enrolled', desc: 'A growing community of confident learners.', icon: GraduationCap },
];

/* ========================================================================
   Page
   ======================================================================== */
const Home = () => (
    <div className="-mt-16 md:-mt-[4.5rem] bg-white overflow-x-hidden w-full max-w-[100vw]">
        <Seo
            title="Nursery & Primary School in Mowe, Ogun State"
            description="A warm, high-standards Nigerian school in Mowe where small classes and dedicated teachers build the foundation your child deserves. Nursery 1 through Basic 6."
            path="/"
        />
        <ScrollProgress />
        <Hero />
        <MarqueeStrip tone="ink" items={TICKER_ITEMS} />
        <IntroSpread />
        <TrustLine />
        <DayAtSchool />
        <Features />
        <Programmes />
        <PullQuote />
        <ParentStories />
        <ImpactBand />
        <FinalCTA />
    </div>
);

/* ----------------------------------------------------------------- Hero */
const HERO_STATS = [
    { num: 16,  suffix: '+', label: 'Years in Mowe' },
    { num: 560, suffix: '+', label: 'Pupils enrolled' },
    { num: 18,  suffix: '',  label: 'Avg. class size' },
];

const Hero = () => {
    const reduced = useReducedMotion();

    return (
        <section className="relative bg-paper overflow-hidden pt-28 pb-12 md:pt-32 md:pb-16">
            <div className="absolute inset-0 mesh-gradient-premium opacity-70 pointer-events-none" />
            <CursorSpotlight color="rgba(14,134,212,0.12)" size={560} />

            {/* School-themed decoration in the section's empty top/bottom
                padding bands — safe from the two-column content at every
                breakpoint since nothing else occupies that vertical strip. */}
            <FloatingIcon icon={Pencil}     className="top-24 left-[6%]"      size="w-10 h-10" color="text-primary/70" rotate={-20} delay={0.6}  duration={7} />
            <FloatingIcon icon={BookOpen}   className="top-24 right-[7%]"     size="w-12 h-12" color="text-gold/80"    rotate={12}  delay={0.9}  duration={8} />
            <FloatingIcon icon={Ruler}      className="hidden sm:block top-20 left-[40%]" size="w-9 h-9" color="text-gold/70" rotate={30}  delay={1.2}  duration={6.5} />
            <FloatingIcon icon={Volleyball} className="bottom-3 left-[9%]"    size="w-10 h-10" color="text-primary/70" rotate={0}   delay={0.75} duration={6} />
            <FloatingIcon icon={Star}       className="bottom-4 right-[10%]"  size="w-8 h-8"  color="text-primary/70" rotate={-10} delay={1.4}  duration={5.5} />

            <div className="relative max-w-6xl mx-auto px-6 sm:px-8 grid md:grid-cols-12 gap-y-10 gap-x-10 items-center">
                {/* Text column */}
                <div className="md:col-span-7">
                    <Reveal>
                        <Eyebrow>Best Legacy Divine School &middot; Mowe, Ogun State</Eyebrow>
                    </Reveal>
                    <h1 className="mt-5 font-serif text-4xl sm:text-5xl md:text-6xl font-medium text-ink leading-[1.05] tracking-tight text-balance">
                        <LineReveal delay={0.05}>Nurturing minds.</LineReveal>
                        <LineReveal delay={0.2}>Building <span className="italic text-primary">legacies</span>.</LineReveal>
                    </h1>
                    <Reveal delay={0.4}>
                        <p className="mt-5 max-w-lg text-gray-600 text-lg leading-relaxed">
                            A warm, high-standards Nigerian school in Mowe where small classes and dedicated teachers build the foundation your child deserves.
                        </p>
                    </Reveal>
                    <Reveal delay={0.5}>
                        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                            <Magnetic strength={0.25}>
                                <Link
                                    to="/admissions"
                                    className="inline-flex items-center gap-2 bg-ink text-white font-semibold px-7 py-3.5 rounded-full shadow-[0_12px_32px_-8px_rgba(27,31,59,0.35)] hover:bg-gray-800 transition-colors"
                                >
                                    Apply for 2026/27
                                    <ArrowIcon />
                                </Link>
                            </Magnetic>
                            <Link
                                to="/about"
                                className="inline-flex items-center gap-2 text-ink font-semibold border-b border-ink/20 pb-0.5 hover:border-gold hover:text-primary transition-colors"
                            >
                                Visit the school
                            </Link>
                        </div>
                    </Reveal>

                    <Reveal delay={0.6}>
                        <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-4 pt-6 border-t border-gray-200/70">
                            {HERO_STATS.map((s) => (
                                <div key={s.label}>
                                    <div className="font-serif text-2xl md:text-3xl text-ink">
                                        <CountUp to={s.num} suffix={s.suffix} />
                                    </div>
                                    <div className="mt-1 text-[11px] uppercase tracking-[0.15em] text-gray-500">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </Reveal>
                </div>

                {/* Image column — a small real-life collage, not one generic stock shot */}
                <div className="md:col-span-5 relative">
                    <Reveal x={24} y={0} delay={0.15}>
                        <div className="relative">
                            <motion.div
                                initial={{ opacity: 0, x: -16, y: -16 }}
                                animate={{ opacity: 1, x: 0, y: 0 }}
                                transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute -inset-4 border border-gold/40 rounded-2xl -z-0 hidden md:block"
                            />
                            <RevealImage
                                src="/school_hero_Section.jpg"
                                alt="Pupil at Best Legacy Divine School"
                                aspect=""
                                className="w-full h-[280px] md:h-[420px]"
                                breathe
                                delay={0.2}
                            />

                            {/* Est. badge — top-left, out of the way of the photo overlap */}
                            <motion.div
                                initial={{ opacity: 0, y: -12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute -top-4 -left-4 bg-white text-ink rounded-2xl px-4 py-2.5 shadow-[0_16px_32px_-10px_rgba(27,31,59,0.3)] hidden sm:block"
                            >
                                <div className="text-[9px] uppercase tracking-[0.15em] text-gray-400">Est.</div>
                                <div className="font-serif text-lg leading-none text-primary">2009</div>
                            </motion.div>

                            {/* Second photo — a candid moment overlapping the main shot, mosaic-style */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 16 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute -bottom-6 -right-4 sm:-right-6 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-[0_20px_45px_-12px_rgba(27,31,59,0.45)] overflow-hidden"
                            >
                                <img src="/cultural_day.jpg" alt="Pupils at Best Legacy's cultural day" loading="lazy" className="w-full h-full object-cover" />
                            </motion.div>
                        </div>
                    </Reveal>
                </div>
            </div>

            {!reduced && (
                <motion.div
                    aria-hidden="true"
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1.5 text-gray-400 text-[10px] uppercase tracking-[0.2em]"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                    Scroll
                    <span className="w-px h-5 bg-gray-300" />
                </motion.div>
            )}
        </section>
    );
};

/* ----------------------------------------------------------------- Intro spread (about + layered image) */
const IntroSpread = () => (
    <section className="relative bg-white pt-28 pb-24 md:pt-32 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 mesh-gradient-premium opacity-60 pointer-events-none" />

        <FloatingIcon icon={Backpack} className="hidden sm:block top-10 right-[8%]" size="w-16 h-16" color="text-primary/60" rotate={-12} delay={0.3} duration={7.5} />
        <FloatingIcon icon={Palette}  className="hidden sm:block bottom-10 left-[4%]" size="w-14 h-14" color="text-gold/70" rotate={15}  delay={0.6} duration={6.5} />

        <div className="relative max-w-6xl mx-auto px-6 sm:px-8 grid md:grid-cols-12 gap-y-16 gap-x-12 items-center">
            <div className="md:col-span-5 relative">
                <Reveal x={-24} y={0}>
                    <div className="relative">
                        <motion.div
                            initial={{ opacity: 0, x: 16, y: 16 }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
                            className="absolute -inset-4 border border-gold/40 rounded-2xl -z-0 hidden md:block"
                        />
                        <RevealImage src="/school_library.jpg" alt="Best Legacy library corner" aspect="aspect-[4/5]" parallax delay={0.1} />
                    </div>
                </Reveal>
            </div>

            <div className="md:col-span-7">
                <Reveal delay={0.1} x={24} y={0}>
                    <Eyebrow>About us</Eyebrow>
                    <h2 className="mt-6 font-serif text-3xl md:text-5xl text-ink leading-tight text-balance">
                        Play, structure and faith combine into a foundation that follows your child <span className="italic text-primary">for life</span>.
                    </h2>
                    <p className="mt-6 text-gray-600 leading-relaxed max-w-xl">
                        Our nursery section runs on observation and play. From Basic 1 the days get more structured, but the values don&rsquo;t change: every child is known, every parent is heard, every teacher is qualified.
                    </p>

                    <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-6">
                        <Reveal delay={0.2}>
                            <div>
                                <div className="font-serif text-4xl text-ink">
                                    <CountUp to={16} /><span className="text-primary">+</span>
                                </div>
                                <div className="mt-1 text-xs uppercase tracking-[0.15em] text-gray-500">Years in Mowe</div>
                            </div>
                        </Reveal>
                        <div className="w-px h-10 bg-gray-200 hidden sm:block" />
                        <Reveal delay={0.28}>
                            <div>
                                <div className="font-serif text-4xl text-ink"><CountUp to={100} suffix="%" /></div>
                                <div className="mt-1 text-xs uppercase tracking-[0.15em] text-gray-500">Certified teachers</div>
                            </div>
                        </Reveal>
                        <div className="w-px h-10 bg-gray-200 hidden sm:block" />
                        <Link to="/about" className="inline-flex items-center gap-2 text-ink font-semibold border-b border-ink/20 pb-0.5 hover:border-gold hover:text-gold transition-colors">
                            More about us
                            <ArrowIcon />
                        </Link>
                    </div>
                </Reveal>
            </div>
        </div>
    </section>
);

/* ----------------------------------------------------------------- Trust line */
const TrustLine = () => (
    <section className="bg-paper py-10 border-y border-gray-200/70">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
            <div className="flex flex-wrap items-center justify-center gap-3">
                {TRUST_ITEMS.map((t, i) => (
                    <Reveal key={t.line2} delay={i * 0.06} y={12} className="text-xs bg-white/70 border border-gray-200 rounded-full px-4 py-2">
                        <span className="uppercase tracking-[0.1em] text-gray-400">{t.line1}</span>{' '}
                        <span className="font-semibold text-ink">{t.line2}</span>
                    </Reveal>
                ))}
            </div>
        </div>
    </section>
);

/* ----------------------------------------------------------------- A day at school — sticky cinematic image + schedule */
const DayAtSchool = () => {
    const reduced = useReducedMotion();
    const listRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 0.75', 'end 0.6'] });

    return (
        <section className="bg-white py-16 md:py-20">
            <div className="max-w-6xl mx-auto px-6 sm:px-8">
                <Reveal>
                    <Eyebrow>A day at Best Legacy</Eyebrow>
                    <h2 className="mt-6 font-serif text-3xl md:text-5xl text-ink leading-[1.1] max-w-2xl text-balance">
                        What does a regular Wednesday actually look like?
                    </h2>
                </Reveal>

                <div className="mt-10 grid md:grid-cols-12 gap-10 md:gap-16 md:items-start">
                    <div className="md:col-span-5">
                        <RevealImage src="/school_library.jpg" alt="A morning at Best Legacy" aspect="aspect-[4/5] md:aspect-[3/4]" className="max-h-[420px]" breathe />
                    </div>

                    <div className="md:col-span-7 relative" ref={listRef}>
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200" />
                        {!reduced && (
                            <motion.div
                                aria-hidden="true"
                                className="absolute left-0 top-0 w-px bg-gradient-to-b from-primary to-gold origin-top"
                                style={{ scaleY: scrollYProgress, height: '100%' }}
                            />
                        )}
                        <div className="divide-y divide-gray-200 border-t border-b border-gray-200 pl-6">
                            {DAY_STOPS.map((stop, i) => (
                                <Reveal key={stop.title} x={-16} y={0} delay={i * 0.04}>
                                    <div className="py-3.5 transition-colors duration-300 hover:bg-paper/60 -mx-6 px-6">
                                        <div className="flex items-baseline gap-3">
                                            <span className="shrink-0 w-16 text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400 whitespace-nowrap">{stop.time}</span>
                                            <h3 className="font-serif text-lg text-ink">{stop.title}</h3>
                                        </div>
                                        <p className="mt-1 pl-[4.75rem] text-sm text-gray-600 leading-relaxed max-w-md">{stop.body}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </div>

                <Reveal delay={0.1}>
                    <div className="mt-10">
                        <Magnetic strength={0.2}>
                            <Link to="/admissions" className="inline-flex items-center gap-2 bg-ink text-white font-semibold px-7 py-3.5 rounded-full hover:bg-gray-800 transition-colors">
                                Book a school visit
                                <ArrowIcon />
                            </Link>
                        </Magnetic>
                    </div>
                </Reveal>
            </div>
        </section>
    );
};

/* ----------------------------------------------------------------- Features */
const Features = () => (
    <section className="relative bg-paper py-24 md:py-32 overflow-hidden">
        <FloatingIcon icon={Calculator} className="hidden sm:block top-14 left-[5%]" size="w-14 h-14" color="text-primary/60" rotate={-15} delay={0.3} duration={7} />
        <FloatingIcon icon={Puzzle}     className="hidden sm:block bottom-14 right-[6%]" size="w-16 h-16" color="text-gold/70" rotate={18}  delay={0.6} duration={8} />

        <div className="relative max-w-6xl mx-auto px-6 sm:px-8">
            <Reveal>
                <Eyebrow>What to expect</Eyebrow>
                <h2 className="mt-6 font-serif text-3xl md:text-5xl text-ink leading-[1.1] max-w-2xl text-balance">
                    Built around small, safe, attentive classrooms.
                </h2>
            </Reveal>

            <div className="mt-20 space-y-20 md:space-y-28">
                {FEATURES.map((f, i) => {
                    const reverse = i % 2 === 1;
                    return (
                        <div key={f.n} className={`grid md:grid-cols-2 gap-8 md:gap-16 items-center ${reverse ? 'md:[direction:rtl]' : ''}`}>
                            <Reveal x={reverse ? 24 : -24} y={0} className="relative md:[direction:ltr]">
                                <div
                                    className="absolute -inset-6 rounded-3xl opacity-70 blur-2xl pointer-events-none"
                                    style={{ background: 'radial-gradient(circle, rgba(14,134,212,0.14) 0%, rgba(212,175,55,0.08) 60%, transparent 80%)' }}
                                />
                                <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.4, ease: EASE }} className="relative">
                                    <RevealImage src={f.img} alt={f.t} aspect="aspect-[4/3]" parallax />
                                </motion.div>
                            </Reveal>
                            <Reveal delay={0.1} x={reverse ? -24 : 24} y={0} className="md:[direction:ltr]">
                                <div className="text-xs font-semibold text-gold tracking-[0.15em]">{f.n}</div>
                                <h3 className="mt-3 font-serif text-2xl md:text-3xl text-ink">{f.t}</h3>
                                <p className="mt-4 text-gray-600 leading-relaxed max-w-md">{f.d}</p>
                            </Reveal>
                        </div>
                    );
                })}
            </div>
        </div>
    </section>
);

/* ----------------------------------------------------------------- Programmes / fees */
const Programmes = () => {
    const reduced = useReducedMotion();
    return (
        <section className="bg-white py-24 md:py-32">
            <div className="max-w-6xl mx-auto px-6 sm:px-8">
                <Reveal>
                    <Eyebrow>Fees</Eyebrow>
                    <h2 className="mt-6 font-serif text-3xl md:text-5xl text-ink leading-[1.1] max-w-2xl text-balance">
                        Termly fees, kept simple.
                    </h2>
                    <p className="mt-4 text-gray-600 max-w-xl">
                        All amounts in naira, per term. Books and feeding included. Sibling discount on the second child.
                    </p>
                </Reveal>

                <div className="mt-16 flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-6 px-6 pb-2 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:items-center">
                    {TIERS.map((p, i) => (
                        <Reveal key={p.name} delay={i * 0.08} className="h-full shrink-0 w-[82%] snap-center md:w-auto md:shrink">
                            <TiltCard
                                max={p.featured ? 0 : 4}
                                highlight={!p.featured}
                                className={`relative rounded-2xl p-8 md:p-10 flex flex-col h-full overflow-hidden ${
                                    p.featured
                                        ? 'bg-ink text-white shadow-[0_30px_60px_-15px_rgba(27,31,59,0.5)] md:-my-6 md:py-14'
                                        : 'bg-white text-ink border border-gray-200 shadow-card'
                                }`}
                            >
                                {p.featured && (
                                    <motion.div
                                        aria-hidden="true"
                                        className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
                                        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.35) 0%, transparent 70%)' }}
                                        animate={reduced ? undefined : { opacity: [0.4, 0.75, 0.4] }}
                                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                                    />
                                )}
                                <div className="relative">
                                    {p.featured && (
                                        <div className="mb-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                                            Most popular
                                        </div>
                                    )}
                                    <div className={`text-xs font-semibold uppercase tracking-[0.15em] ${p.featured ? 'text-white/50' : 'text-gray-400'}`}>{p.age}</div>
                                    <h3 className="mt-2 font-serif text-2xl">{p.name}</h3>
                                    <div className="mt-8">
                                        <span className="font-serif text-4xl">{p.price}</span>
                                        <span className={`text-sm ${p.featured ? 'text-white/50' : 'text-gray-400'}`}> /term</span>
                                    </div>
                                    <ul className="mt-8 space-y-3">
                                        {INCLUDED.map((item) => (
                                            <li key={item} className={`flex items-start gap-2.5 text-sm ${p.featured ? 'text-white/75' : 'text-gray-600'}`}>
                                                <CheckIcon className={`w-4 h-4 mt-0.5 shrink-0 ${p.featured ? 'text-gold' : 'text-primary'}`} />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-10 space-y-3">
                                        <Link
                                            to="/admissions"
                                            className={`block text-center rounded-full font-semibold px-6 py-3.5 transition-colors ${
                                                p.featured ? 'bg-white text-ink hover:bg-white/90' : 'bg-ink text-white hover:bg-gray-800'
                                            }`}
                                        >
                                            Apply now
                                        </Link>
                                        <a
                                            href="tel:+2348067663966"
                                            className={`block text-center text-sm font-semibold transition-colors ${
                                                p.featured ? 'text-white/60 hover:text-gold' : 'text-gray-500 hover:text-ink'
                                            }`}
                                        >
                                            Call the school &rarr;
                                        </a>
                                    </div>
                                </div>
                            </TiltCard>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ----------------------------------------------------------------- Pull quote */
const PullQuote = () => (
    <section className="relative bg-paper py-14 md:py-20 overflow-hidden">
        <div className="absolute inset-0 mesh-gradient-premium opacity-70 pointer-events-none" />
        <div
            aria-hidden="true"
            className="absolute top-2 left-1/2 -translate-x-1/2 text-[90px] md:text-[140px] font-serif leading-none text-gold/25 select-none animate-breathe"
        >
            &ldquo;
        </div>
        <div className="relative max-w-3xl mx-auto px-6 sm:px-8 text-center">
            <Reveal>
                <p className="font-serif text-3xl md:text-5xl text-ink leading-[1.25] text-balance">
                    We chose them for the values, we stayed for the discipline. <span className="italic text-primary">Best Legacy is teaching our son who he is.</span>
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                    <img src="/cultural_day.jpg" alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-gold/40" loading="lazy" width={40} height={40} />
                    <div className="text-left">
                        <div className="font-semibold text-ink text-sm">Mrs Ngozi Eze</div>
                        <div className="text-xs text-gray-500">Mother of Samuel, Basic 2</div>
                    </div>
                </div>
            </Reveal>
        </div>
    </section>
);

/* ----------------------------------------------------------------- Parent stories */
const ParentStories = () => (
    <section className="bg-white py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
            <Reveal>
                <Eyebrow>Parent stories</Eyebrow>
                <h2 className="mt-6 font-serif text-3xl md:text-5xl text-ink leading-[1.1] max-w-2xl text-balance">
                    Three parents, three reasons to stay.
                </h2>
            </Reveal>

            <div className="mt-16 flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-6 px-6 pb-2 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible">
                {PARENT_STORIES.map((s, i) => (
                    <Reveal key={s.name} delay={i * 0.08} className="h-full shrink-0 w-[82%] snap-center md:w-auto md:shrink">
                        <TiltCard max={4} className="bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-lg transition-shadow duration-300 p-7 h-full flex flex-col">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-gold/30">
                                    <motion.img
                                        src={s.photo}
                                        alt=""
                                        loading="lazy"
                                        width={44}
                                        height={44}
                                        whileHover={{ scale: 1.12 }}
                                        transition={{ duration: 0.4, ease: EASE }}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <div className="font-semibold text-ink text-sm">{s.name}</div>
                                    <div className="text-xs text-gray-500">{s.child}</div>
                                </div>
                            </div>
                            <p className="mt-6 font-serif italic text-ink text-lg leading-snug">&ldquo;{s.quote}&rdquo;</p>
                            <p className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500 leading-relaxed flex-grow">{s.body}</p>
                        </TiltCard>
                    </Reveal>
                ))}
            </div>
        </div>
    </section>
);

/* ----------------------------------------------------------------- Impact band */
const ImpactBand = () => (
    <section className="relative bg-ink text-white py-20 md:py-28 overflow-hidden">
        <div className="absolute top-0 right-0 w-[70%] h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none rounded-l-full blur-3xl" />
        <div className="absolute inset-0 grain-dot opacity-20 mix-blend-overlay pointer-events-none" />
        <div
            aria-hidden="true"
            className="absolute -bottom-10 -left-6 font-serif italic text-[10rem] md:text-[14rem] leading-none text-white/[0.03] select-none pointer-events-none"
        >
            legacy
        </div>

        <div className="relative max-w-6xl mx-auto px-6 sm:px-8">
            <Reveal>
                <Eyebrow tone="dark">The legacy in numbers</Eyebrow>
                <h2 className="mt-6 font-serif text-3xl md:text-4xl leading-tight max-w-lg text-balance">
                    Small details, <span className="italic text-gold">massive impact</span>.
                </h2>
            </Reveal>

            <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                {STATS.map((s, i) => (
                    <Reveal key={s.label} delay={i * 0.08} className="h-full">
                        <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 transition-colors duration-300 hover:border-gold/30 hover:bg-white/[0.05]">
                            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gold transition-transform duration-300 group-hover:scale-110">
                                <s.icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.75} />
                            </div>
                            <div className="mt-4 sm:mt-6 font-serif text-2xl sm:text-4xl md:text-[2.75rem] leading-none">
                                <CountUp to={s.num} />{s.suffix && <span className="text-gold">{s.suffix}</span>}
                            </div>
                            <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.1em] sm:tracking-[0.15em] text-white/70">{s.label}</div>
                            <div className="mt-2 h-px w-8 bg-gold/40 hidden sm:block" />
                            <p className="mt-3 text-sm text-white/50 leading-relaxed hidden sm:block">{s.desc}</p>
                        </div>
                    </Reveal>
                ))}
            </div>
        </div>
    </section>
);

/* ----------------------------------------------------------------- Final CTA */
const FinalCTA = () => (
    <section className="relative bg-gradient-to-br from-primary via-primary-dark to-ink text-white py-20 md:py-28 overflow-hidden animate-grad-drift">
        <div className="absolute inset-0 grain-dot opacity-20 mix-blend-overlay pointer-events-none" />

        <FloatingIcon icon={Lightbulb}   className="hidden sm:block top-10 left-[7%]" size="w-14 h-14" color="text-white/50" rotate={-10} delay={0.3} duration={7} />
        <FloatingIcon icon={PaintBucket} className="hidden sm:block bottom-10 right-[8%]" size="w-16 h-16" color="text-gold/70" rotate={14}  delay={0.6} duration={8} />
        <div className="relative max-w-3xl mx-auto px-6 sm:px-8 text-center">
            <Reveal>
                <h2 className="font-serif text-3xl md:text-5xl leading-tight text-balance">
                    Ready to see it for yourself?
                </h2>
                <p className="mt-4 text-white/80 max-w-lg mx-auto">
                    Book a visit, meet the class teachers, and see why families stay in Mowe for sixteen years and counting.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
                    <Magnetic strength={0.25}>
                        <Link to="/admissions" className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-7 py-3.5 rounded-full shadow-[0_12px_32px_-8px_rgba(0,0,0,0.35)] hover:bg-white/90 transition-colors">
                            Apply for 2026/27
                            <ArrowIcon />
                        </Link>
                    </Magnetic>
                    <a href="tel:+2348067663966" className="inline-flex items-center gap-2 text-white font-semibold border-b border-white/40 pb-0.5 hover:border-gold hover:text-gold transition-colors">
                        Call the school
                    </a>
                </div>
            </Reveal>
        </div>
    </section>
);

export default Home;
