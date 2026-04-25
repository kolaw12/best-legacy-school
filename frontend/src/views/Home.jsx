import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Reveal from '../components/ui/Reveal';
import CountUp from '../components/ui/CountUp';
import MarqueeStrip from '../components/ui/MarqueeStrip';
import SparkleField from '../components/ui/SparkleField';
import CursorSpotlight from '../components/ui/CursorSpotlight';
import SquiggleDivider from '../components/ui/SquiggleDivider';
import SnapCarousel from '../components/ui/SnapCarousel';
import TiltCard from '../components/ui/TiltCard';
import Magnetic from '../components/ui/Magnetic';

/* ========================================================================
   Day at Best Legacy timeline data
   ======================================================================== */
const DAY_STOPS = [
    { time: '7:30am',  title: 'Warm Welcome',         body: 'Pupils arrive to a calm song, a hello from their class teacher and a quiet morning activity.', emoji: '☀️', tone: 'mint' },
    { time: '8:00am',  title: 'Morning Assembly',     body: 'A short assembly: hymn, a thought for the day, and a shout-out for one pupil who showed kindness yesterday.', emoji: '🎶', tone: 'warm' },
    { time: '9:00am',  title: 'Core Lessons',         body: 'Phonics, numeracy and reading happen when little minds are freshest. Lessons run 30 minutes max for nursery, 45 for basic.', emoji: '📘', tone: 'mint' },
    { time: '10:30am', title: 'Snack & Free Play',    body: 'A healthy snack provided by the school, then 30 minutes of unstructured outdoor play. No screens. Lots of running.', emoji: '🍎', tone: 'warm' },
    { time: '11:30am', title: 'Creative Block',       body: 'Art, music, drama, or science exploration depending on the day. Children rotate so every week covers all four.', emoji: '🎨', tone: 'mint' },
    { time: '1:00pm',  title: 'Lunch Together',       body: 'Hot meal in the dining hall. Older basic pupils help nursery friends with their plates — a small thing that teaches a lot.', emoji: '🍲', tone: 'warm' },
    { time: '2:30pm',  title: 'Quiet Close & Home',   body: 'Reading time, gentle reflection, then a tidy classroom and a smile at the gate. Parents collect by 3:00pm.', emoji: '📚', tone: 'mint' },
];

/* ========================================================================
   Real parent stories (replaces template testimonials)
   ======================================================================== */
const PARENT_STORIES = [
    {
        name: 'Mrs Funke Adeleke',
        child: 'Mother of Ayomide, Basic 3',
        photo: '/staff_members.jpg',
        quote: '"In her first term I watched her go from shy at the gate to running ahead of me. They notice the small things at Best Legacy."',
        body: 'We moved to Mowe in 2024 and visited four schools before we landed here. What sold us was that Mrs Bello, her would-be class teacher, sat on the floor with her at the assessment. Two years on, Ayomide reads above her level and is writing little stories in her journal at home.',
    },
    {
        name: 'Mr Musa Bello',
        child: 'Father of Zainab, Basic 4',
        photo: '/school_ceremony.jpg',
        quote: '"Her teachers email us before there\'s ever a problem. That alone is rare."',
        body: 'I work shifts and don\'t always make it for pickup. Best Legacy never makes me feel like the absent parent. They send Friday updates, share photos from cultural day on time, and the head teacher actually answers her phone. Small things, but they change a parent\'s week.',
    },
    {
        name: 'Mrs Ngozi Eze',
        child: 'Mother of Samuel, Basic 2',
        photo: '/group_celebration.jpg',
        quote: '"We chose them for the values, we stayed for the discipline."',
        body: 'Samuel had been at a much bigger school where he was just a number. Here he has 18 classmates, a class teacher who knows his strengths, and a school that genuinely teaches respect — at home he now greets visitors before being asked. That\'s what an early-years foundation should do.',
    },
];

/* ========================================================================
   Honest trust strip — only what is actually true
   ======================================================================== */
const TRUST_ITEMS = [
    { line1: 'Registered with',        line2: 'Ogun State Ministry of Education' },
    { line1: 'Member',                  line2: 'Association of Private Schools' },
    { line1: 'Christian-led, but',     line2: 'open to children of all faiths' },
    { line1: 'Established',             line2: '2008 · 16+ years serving Mowe' },
];

const LetterReveal = ({ text }) => {
    const letters = text.split("");
    return (
        <span className="inline-block">
            {letters.map((char, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20, rotate: 10 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{
                        duration: 0.8,
                        delay: i * 0.03,
                        ease: [0.2, 0.65, 0.3, 0.9]
                    }}
                    className="inline-block"
                >
                    {char === " " ? "\u00A0" : char}
                </motion.span>
            ))}
        </span>
    );
};

const Home = () => {
    return (
        <div className="flex flex-col -mt-16 overflow-x-hidden w-full max-w-[100vw]">
            <Hero />
            <MarqueeStrip
                tone="primary"
                items={[
                    'Nursery 1 → Basic 6',
                    'Sixteen years in Mowe',
                    'Class teachers who know every child by name',
                    'Apply for the 2026 / 2027 session',
                    '8, Kolawole Street, Ogun State',
                ]}
            />
            <TrustStrip />
            <AboutSixteenYears />
            <DayTimelineSection />
            <FeaturesGrid />
            <PricingTiers />
            <PullQuoteBand />
            <ParentStories />
            <ImpactStats />
            <MobileStickyBar />
        </div>
    );
};

/* ----------------------------------------------------------------- Mobile Sticky Actions */
const MobileStickyBar = () => (
    <div className="fixed bottom-6 left-4 right-4 z-50 md:hidden">
        <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/80 backdrop-blur-xl border border-white/20 p-2 rounded-2xl shadow-2xl grid grid-cols-2 gap-2"
        >
            <a 
                href="tel:+2348030000000"
                className="bg-primary text-white font-bold py-3.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs shadow-lg active:scale-95 transition-transform"
            >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                Call Us
            </a>
            <Link 
                to="/admissions" 
                className="bg-white text-primary border border-primary/20 font-bold py-3.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs shadow-sm active:scale-95 transition-transform"
            >
                Apply
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </Link>
        </motion.div>
    </div>
);

/* ----------------------------------------------------------------- Hero (Modern Bento Style) */
const Hero = () => {
    const reduced = useReducedMotion();
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const imgY = useTransform(scrollYProgress, [0, 1], [0, -60]);

    return (
        <section ref={heroRef} className="relative bg-bg pt-32 pb-24 md:pt-44 md:pb-40 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]">
                    
                    {/* The Anchor (Main Headline Block) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="md:col-span-8 md:row-span-2 bg-white rounded-[2.5rem] p-8 md:p-16 shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden group"
                    >
                        {/* Mobile background image + overlay */}
                        <div className="absolute inset-0 md:hidden">
                            <img src="/school_hero_Section.png" alt="" className="w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/50 to-white/90"></div>
                        </div>
                        <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none rounded-r-[2.5rem] hidden md:block"></div>
                        <Badge tone="mint" dot className="self-start mb-8 relative z-10">BEST LEGACY DIVINE SCHOOL</Badge>
                        <h1 className="text-5xl md:text-7xl font-black text-ink leading-[1.05] tracking-tighter relative z-10">
                            Nurturing minds.<br/>
                            Building <span className="relative inline-block text-primary italic font-serif">
                                legacies
                                <motion.svg
                                    className="absolute -bottom-2 left-0 w-full h-4 text-secondary/40 pointer-events-none"
                                    viewBox="0 0 300 20" preserveAspectRatio="none"
                                >
                                    <motion.path
                                        d="M5,15 Q150,5 295,15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                                    />
                                </motion.svg>
                            </span>.
                        </h1>
                        <p className="mt-8 text-gray-500 text-lg md:text-xl max-w-lg leading-relaxed relative z-10">
                            A warm, high-standards Nigerian school in Mowe where small classes and dedicated teachers build the foundation your child deserves.
                        </p>
                        <div className="mt-10 flex flex-wrap gap-4 relative z-10">
                            <Magnetic>
                                <Link to="/admissions" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all group-btn">
                                    Apply for 2026/27
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                                </Link>
                            </Magnetic>
                            <Magnetic>
                                <Link to="/about" className="bg-gray-50 text-ink font-bold px-8 py-4 rounded-full border border-gray-200 hover:border-primary hover:bg-white transition-all shadow-sm">
                                    Visit the school
                                </Link>
                            </Magnetic>
                        </div>
                    </motion.div>

                    {/* The Heart (Hero Image Block) */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                        className="md:col-span-4 md:row-span-2 rounded-[2.5rem] overflow-hidden relative shadow-sm border border-gray-100 group min-h-[350px] md:min-h-0"
                    >
                        <div className="absolute inset-0 bg-ink/10 z-10 group-hover:bg-transparent transition-colors duration-500"></div>
                        <motion.img 
                            style={{ y: reduced ? 0 : imgY }}
                            src="/school_hero_Section.png" 
                            alt="Pupil at Best Legacy" 
                            className="absolute inset-0 w-full h-[120%] object-cover object-top -mt-[10%] group-hover:scale-105 transition-transform duration-1000"
                        />
                    </motion.div>

                    {/* The Proof (Stats Block) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="md:col-span-8 md:row-span-1 bg-ink text-white rounded-[2.5rem] p-8 shadow-sm flex items-center justify-between relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"></div>
                        <div className="relative z-10 flex w-full justify-around text-center">
                            <div>
                                <div className="text-4xl md:text-5xl font-black font-serif italic"><CountUp to={16} suffix="+" /></div>
                                <div className="text-xs uppercase tracking-widest text-mint mt-2 font-bold">Years Experience</div>
                            </div>
                            <div className="w-px bg-white/20"></div>
                            <div>
                                <div className="text-4xl md:text-5xl font-black font-serif italic"><CountUp to={560} suffix="+" /></div>
                                <div className="text-xs uppercase tracking-widest text-mint mt-2 font-bold">Pupils Enrolled</div>
                            </div>
                            <div className="w-px bg-white/20 hidden sm:block"></div>
                            <div className="hidden sm:block">
                                <div className="text-4xl md:text-5xl font-black font-serif italic"><CountUp to={18} suffix="" /></div>
                                <div className="text-xs uppercase tracking-widest text-mint mt-2 font-bold">Avg Class Size</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* The Journey (Badge/Graphic Block) */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                        className="md:col-span-4 md:row-span-1 bg-secondary text-ink rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden"
                    >
                        {/* Decorative squiggle */}
                        <svg className="absolute -right-4 -top-4 w-32 h-32 text-white/20 rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        
                        <div className="text-sm font-bold uppercase tracking-widest text-ink/80 mb-2 z-10">Journey</div>
                        <div className="text-2xl font-black leading-tight z-10">
                            Nursery 1 <br/>
                            <span className="text-white">→ Basic 6</span>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

/* ----------------------------------------------------------------- Trust strip */
const TrustStrip = () => (
    <section className="bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5 text-center md:text-left">
            {TRUST_ITEMS.map((t) => (
                <div key={t.line2} className="text-xs">
                    <div className="text-gray-400 uppercase tracking-widest text-[10px] font-bold">{t.line1}</div>
                    <div className="mt-1 font-semibold text-ink leading-snug">{t.line2}</div>
                </div>
            ))}
        </div>
    </section>
);

/* ----------------------------------------------------------------- About 16+ years */
const AboutSixteenYears = () => (
    <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-start">
            <Reveal>
                <Badge tone="mint">About Us</Badge>
                <div className="mt-6 flex items-end gap-4">
                    <div className="text-7xl md:text-8xl font-black text-primary leading-none">
                        <CountUp to={16} duration={1.2} /><span className="text-brand-green">+</span>
                    </div>
                </div>
                <p className="mt-4 text-gray-500 text-sm max-w-xs">
                    Sixteen years in Mowe. Thousands of pupils. The same simple rule: small classes, named teachers, and a school that picks up the phone.
                </p>
            </Reveal>
            <Reveal delay={0.1}>
                <h2 className="text-3xl md:text-4xl font-black text-primary leading-tight">
                    Play, structure and faith — combined into a foundation that follows your child for life.
                </h2>
                <p className="mt-5 text-gray-600">
                    Our nursery section runs on observation and play. From Basic 1 the days get more structured, but the values don't change: every child is known, every parent is heard, every teacher is qualified.
                </p>
                <Button to="/about" size="md" className="mt-6">
                    More about us
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                </Button>
            </Reveal>
        </div>
    </section>
);

/* ----------------------------------------------------------------- Day timeline (NEW — design audit #1) */
const DayTimelineSection = () => {
    const ref = useRef(null);
    const reduced = useReducedMotion();
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.7', 'end 0.4'] });
    const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

    return (
        <section ref={ref} className="bg-bg py-24 relative overflow-hidden">
            <div className="absolute -top-24 right-1/4 w-72 h-72 rounded-full blob-mint blur-3xl pointer-events-none"></div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <Reveal>
                    <div className="text-center mb-16 max-w-2xl mx-auto">
                        <Badge tone="warm" dot>A typical day</Badge>
                        <h2 className="mt-4 text-3xl md:text-5xl font-black text-primary leading-[1.1] text-balance">
                            What does a day at Best Legacy actually look like?
                        </h2>
                        <div className="mt-3 flex justify-center text-secondary">
                            <SquiggleDivider width={160} />
                        </div>
                        <p className="mt-5 text-gray-600">
                            Less marketing, more honesty. This is the rhythm of a regular Wednesday for a Nursery 2 or Basic 3 child.
                        </p>
                    </div>
                </Reveal>

                <div className="relative">
                    {/* Center spine — gradient ghost */}
                    <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-[2px] bg-gray-200 md:-translate-x-1/2 rounded-full"></div>
                    {/* Center spine — animated fill */}
                    {!reduced && (
                        <motion.div
                            className="absolute left-6 md:left-1/2 top-0 w-[2px] bg-gradient-to-b from-primary via-primary to-secondary md:-translate-x-1/2 rounded-full origin-top"
                            style={{ height: lineHeight }}
                        />
                    )}
                    {reduced && (
                        <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary to-secondary md:-translate-x-1/2 rounded-full"></div>
                    )}

                    <div className="space-y-12 md:space-y-20">
                        {DAY_STOPS.map((stop, i) => {
                            const left = i % 2 === 0;
                            return (
                                <Reveal key={stop.title} delay={i * 0.05}>
                                    <div className={`relative md:grid md:grid-cols-2 md:gap-12 items-center ${left ? '' : 'md:[direction:rtl]'}`}>
                                        {/* Dot */}
                                        <div className="absolute left-6 md:left-1/2 -translate-x-1/2 -top-2 z-10">
                                            <motion.div
                                                whileHover={reduced ? undefined : { scale: 1.15 }}
                                                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg ${stop.tone === 'warm' ? 'bg-secondary text-ink' : 'bg-primary text-white'}`}
                                            >
                                                <span>{stop.emoji}</span>
                                            </motion.div>
                                        </div>

                                        {/* Card */}
                                        <div className={`pl-20 md:pl-0 ${left ? 'md:pr-16 md:text-right' : 'md:pl-16 md:[direction:ltr]'}`}>
                                            <div className="text-xs font-bold uppercase tracking-widest text-gray-400">{stop.time}</div>
                                            <h3 className="mt-2 text-xl md:text-2xl font-black text-primary">{stop.title}</h3>
                                            <p className="mt-3 text-gray-600 leading-relaxed">{stop.body}</p>
                                        </div>
                                        <div className="hidden md:block"></div>
                                    </div>
                                </Reveal>
                            );
                        })}
                    </div>
                </div>

                <Reveal delay={0.2}>
                    <div className="mt-20 text-center">
                        <Button to="/admissions" size="lg">Book a school visit</Button>
                    </div>
                </Reveal>
            </div>
        </section>
    );
};


/* ----------------------------------------------------------------- Features grid */
const FeaturesGrid = () => {
    const container = useRef(null);

    useGSAP(() => {
        gsap.from('.feature-card', {
            y: 100,
            opacity: 0,
            rotation: 5,
            duration: 1,
            stagger: 0.15,
            ease: 'back.out(1.7)',
            scrollTrigger: {
                trigger: '.features-grid',
                start: 'top 80%',
            }
        });
    }, { scope: container });

    return (
        <section className="bg-white pt-32 pb-20" ref={container}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Reveal>
                    <div className="grid md:grid-cols-2 gap-10 mb-12 items-end">
                        <div>
                            <Badge tone="mint">Features</Badge>
                            <p className="mt-4 text-gray-600 max-w-md">
                                Our environment encourages curiosity, character and confidence — without losing the academic rigour parents expect.
                            </p>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-primary leading-tight">
                            Built around <span className="text-brand-green">small</span>, safe, attentive classrooms.
                        </h2>
                    </div>
                </Reveal>

                <div className="features-grid mt-24 pt-10 lg:mt-0 lg:pt-0 flex overflow-x-auto pb-8 -mx-4 px-4 snap-x snap-mandatory lg:grid lg:grid-cols-12 lg:gap-6 lg:overflow-visible lg:pb-0 no-scrollbar">
                    {[
                        { n: '01', t: 'Creative Learning', d: 'Hands-on activities for every subject — even maths becomes a game when you do it well.', img: '/cultural_day.jpg', span: 'lg:col-span-8' },
                        { n: '02', t: 'Trained Teachers',  d: 'Every class teacher holds a B.Ed or NCE. We don\'t hire shortcuts.', img: '/staff_members.jpg', span: 'lg:col-span-4' },
                        { n: '03', t: 'Whole-child Care',  d: 'Academic, social, emotional, spiritual. We track all four because parents do too.', img: '/school_ceremony.jpg', span: 'lg:col-span-4' },
                        { n: '04', t: 'Safe & Familiar',   d: 'Locked-gate campus, named visitor logbook, and a school nurse on duty.', img: '/fun_in_the_pool.jpg', span: 'lg:col-span-8' },
                    ].map((f) => (
                        <motion.div
                            key={f.n}
                            whileHover={{ y: -8 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className={`group relative feature-card shrink-0 w-[85vw] sm:w-[400px] lg:w-auto snap-center mr-6 lg:mr-0 ${f.span}`}
                        >
                            {/* Glow Shadow — Blurred image underneath */}
                            <div 
                                className="absolute inset-4 opacity-40 blur-3xl saturate-150 transition-all duration-500 group-hover:opacity-70 group-hover:scale-105"
                                style={{ 
                                    backgroundImage: `url(${f.img})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    zIndex: 0
                                }}
                            />

                            <div className="relative h-full card-gradient-border p-6 shadow-sm hover:shadow-md flex flex-col bg-white z-10">
                                <div className="flex justify-between items-start">
                                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{f.n} · FEATURE</div>
                                    <div className="w-8 h-8 rounded-full bg-primary-soft text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                                    </div>
                                </div>
                                <h3 className="mt-4 text-2xl font-black text-ink leading-tight">{f.t}</h3>
                                <p className="mt-3 text-sm text-gray-500 max-w-sm leading-relaxed">{f.d}</p>
                                <div className="mt-8 rounded-2xl overflow-hidden aspect-video lg:aspect-auto lg:flex-grow border border-gray-100">
                                    <img src={f.img} alt={f.t} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-700"/>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ----------------------------------------------------------------- Pricing tiers */
const PricingTiers = () => (
    <section className="bg-bg py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
                <div className="text-center mb-16">
                    <Badge tone="mint">Our Programmes</Badge>
                    <h2 className="mt-6 text-4xl md:text-5xl font-black text-ink tracking-tight">Termly fees, kept simple.</h2>
                    <p className="mt-4 text-base text-gray-500 max-w-xl mx-auto">All amounts in Naira and per term. Books and feeding included. Sibling discount on the second child.</p>
                </div>
            </Reveal>

            <Reveal stagger gap={0.1}>
                {/* Mobile Slider / Desktop Grid Container */}
                <div className="flex overflow-x-auto pb-8 -mx-4 px-4 snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible lg:pb-0 lg:max-w-6xl lg:mx-auto items-center no-scrollbar">
                    {[
                        { name: 'Nursery (1 & 2)', age: '3–5 years',  price: '₦75K', featured: false },
                        { name: 'Basic 1 – 3',     age: '6–8 years',  price: '₦95K', featured: true },
                        { name: 'Basic 4 – 6',     age: '9–11 years', price: '₦115K', featured: false },
                    ].map((p) => (
                        <motion.div
                            key={p.name}
                            whileHover={{ y: -12, scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className={`relative rounded-[2.5rem] p-8 md:p-10 flex flex-col h-full z-10 overflow-hidden shrink-0 w-[85vw] sm:w-[400px] lg:w-auto snap-center mr-6 lg:mr-0 ${
                                p.featured 
                                ? 'bg-ink text-white shadow-2xl lg:-my-8' 
                                : 'bg-white text-ink shadow-card border border-gray-100'
                            }`}
                        >
                            {/* Premium Glow effect for featured card */}
                            {p.featured && (
                                <>
                                    <div className="absolute top-0 right-0 w-[150%] h-[150%] bg-gradient-to-bl from-primary/40 via-secondary/20 to-transparent pointer-events-none rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                                    <div className="absolute inset-0 border-2 border-white/10 rounded-[2.5rem] pointer-events-none"></div>
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
                                </>
                            )}

                            <div className="flex items-center justify-between relative z-10">
                                <div>
                                    <div className="font-black text-2xl tracking-tight">{p.name}</div>
                                    <div className={`text-sm font-medium mt-1 ${p.featured ? 'text-gray-400' : 'text-gray-500'}`}>Ages: {p.age}</div>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${p.featured ? 'bg-white/10 text-mint' : 'bg-primary-soft text-primary'}`}>
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/><circle cx="12" cy="12" r="9" strokeWidth="2"/></svg>
                                </div>
                            </div>

                            <div className="mt-8 relative z-10">
                                <span className="text-5xl font-black tracking-tighter">{p.price}</span>
                                <span className={`text-sm font-bold ml-1 ${p.featured ? 'text-gray-400' : 'text-gray-400'}`}>/term</span>
                            </div>

                            <div className={`mt-8 pt-8 border-t ${p.featured ? 'border-white/10' : 'border-gray-100'} flex-grow relative z-10`}>
                                <div className="font-bold mb-4 uppercase tracking-wider text-xs">Everything included</div>
                                <ul className="space-y-4">
                                    {['Tuition & class materials', 'Textbooks & exercise books', 'Daily hot lunch & snack', 'Termly reports & PTA meetings', 'School nurse on call'].map(i => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${p.featured ? 'bg-primary text-white' : 'bg-mint text-primary'}`}>
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                            </div>
                                            <span className={`text-sm font-medium ${p.featured ? 'text-gray-300' : 'text-gray-600'}`}>{i}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-10 relative z-10 space-y-3">
                                <Link 
                                    to="/admissions" 
                                    className={`block w-full text-center rounded-2xl font-bold px-6 py-4 transition-all shadow-sm ${
                                        p.featured 
                                        ? 'bg-white text-ink hover:bg-gray-100 hover:scale-[1.02]' 
                                        : 'bg-primary text-white hover:bg-primary-dark hover:scale-[1.02]'
                                    }`}
                                >
                                    Apply now
                                </Link>
                                
                                {/* Call Mrs Kolawole Button */}
                                <a 
                                    href="tel:+2348030000000"
                                    className={`flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl font-bold text-xs transition-all ${
                                        p.featured 
                                        ? 'bg-primary text-white hover:bg-primary-dark' 
                                        : 'bg-primary-soft text-primary hover:bg-primary/10'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                    Call Us
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Reveal>
        </div>
    </section>
);

/* ----------------------------------------------------------------- Parent stories (NEW — design audit #2) */
const ParentStories = () => (
    <section className="bg-bg py-24 relative overflow-hidden">
        <div className="absolute -top-12 left-1/4 w-72 h-72 rounded-full blob-warm blur-3xl pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <Badge tone="warm" dot>Parent stories</Badge>
                    <h2 className="mt-4 text-3xl md:text-5xl font-black text-primary leading-tight text-balance">
                        Three parents, three reasons to stay.
                    </h2>
                    <div className="mt-3 flex justify-center text-secondary">
                        <SquiggleDivider width={140} />
                    </div>
                    <p className="mt-5 text-gray-600">No five-star averages — just real stories from Mowe families.</p>
                </div>
            </Reveal>

            <Reveal stagger gap={0.1}>
                {/* Mobile Slider / Desktop Grid */}
                <div className="flex overflow-x-auto pb-8 -mx-4 px-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0 no-scrollbar">
                    {PARENT_STORIES.map(s => (
                        <div key={s.name} className="shrink-0 w-[85vw] sm:w-[400px] md:w-auto snap-center mr-6 md:mr-0">
                            <TiltCard
                                max={4}
                                className="bg-white rounded-3xl p-7 shadow-card hover:shadow-card-lg flex flex-col h-full"
                            >
                                <div className="flex items-center gap-3">
                                    <img src={s.photo} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-mint" loading="lazy" width={56} height={56}/>
                                    <div>
                                        <div className="font-bold text-ink">{s.name}</div>
                                        <div className="text-xs text-gray-500">{s.child}</div>
                                    </div>
                                </div>
                                <div className="mt-6 text-sm text-gray-600 font-medium leading-relaxed italic">{s.quote}</div>
                                <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500 leading-relaxed flex-grow">{s.body}</div>
                            </TiltCard>
                        </div>
                    ))}
                </div>
            </Reveal>
        </div>
    </section>
);

/* ----------------------------------------------------------------- Impact Stats */
const ImpactStats = () => {
    const container = useRef(null);

    useGSAP(() => {
        gsap.from('.stat-item', {
            scale: 0.5,
            opacity: 0,
            duration: 1,
            stagger: 0.1,
            ease: 'elastic.out(1, 0.5)',
            scrollTrigger: {
                trigger: '.stats-grid',
                start: 'top 85%',
            }
        });
    }, { scope: container });

    return (
        <section className="bg-ink text-white py-16 md:py-20 relative overflow-hidden" ref={container}>
            {/* Elegant dark background with subtle glow */}
            <div className="absolute top-0 right-0 w-[80%] h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none rounded-l-full blur-3xl"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <Reveal>
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <Badge tone="mint" className="bg-white/10 text-mint border-white/20">The Legacy in Numbers</Badge>
                        <h2 className="mt-4 text-3xl md:text-5xl font-black leading-tight tracking-tighter">
                            Small details, <br/>
                            <span className="text-mint italic font-serif">massive impact</span>.
                        </h2>
                        <p className="mt-4 text-gray-400 text-lg">
                            Behind every child's smile is a foundation built on dedication, experience, and an environment designed for growth.
                        </p>
                    </div>
                </Reveal>

                <div className="stats-grid flex overflow-x-auto pb-8 -mx-4 px-4 snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:gap-x-8 lg:gap-y-10 lg:overflow-visible lg:pb-0 no-scrollbar">
                    {[
                        { num: 18, suffix: '',   label: 'Maximum Class Size', desc: 'Ensuring every pupil receives dedicated attention and personalized care.', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
                        { num: 16, suffix: '+',  label: 'Years of Excellence', desc: 'A proven track record of nurturing young minds in Mowe since 2008.', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                        { num: 100, suffix: '%', label: 'Certified Teachers', desc: 'Every class is led by qualified educators holding a B.Ed or NCE.', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
                        { num: 560, suffix: '+', label: 'Pupils Enrolled', desc: 'A growing community of confident learners transitioning to top secondary schools.', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
                    ].map((stat, i) => (
                        <div key={stat.label} className="stat-item flex flex-col items-center text-center group shrink-0 w-[80vw] sm:w-[300px] lg:w-auto snap-center mr-8 lg:mr-0">
                            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-mint group-hover:scale-110 group-hover:bg-mint/10 transition-all duration-500">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                                </svg>
                            </div>
                            <div className="text-4xl md:text-5xl font-black text-white font-serif italic mb-2 tracking-tighter">
                                <CountUp to={stat.num} suffix={stat.suffix} />
                            </div>
                            <h4 className="text-base font-bold text-white mb-2">{stat.label}</h4>
                            <p className="text-xs text-gray-400 leading-relaxed max-w-[14rem] mx-auto">
                                {stat.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ----------------------------------------------------------------- Editorial pull-quote band (agent #11) */
const PullQuoteBand = () => (
    <section className="bg-gradient-to-br from-primary-soft to-secondary-soft relative overflow-hidden py-24 md:py-32">
        {/* Giant decorative quotation mark, breathing */}
        <div
            aria-hidden="true"
            className="absolute -top-16 -left-6 md:-left-2 text-[260px] md:text-[420px] font-display font-black leading-none text-white/40 select-none animate-breathe"
            style={{ fontFamily: 'serif' }}
        >
            “
        </div>
        <div
            aria-hidden="true"
            className="absolute -bottom-32 right-0 text-[260px] md:text-[420px] font-display font-black leading-none text-white/30 select-none animate-breathe"
            style={{ fontFamily: 'serif', animationDelay: '2s' }}
        >
            ”
        </div>

        <div className="relative max-w-4xl mx-auto px-6 sm:px-10 text-center">
            <Reveal>
                <p className="text-3xl md:text-5xl font-black text-primary leading-[1.15] text-balance">
                    "We chose them for the values, we stayed for the discipline. <span className="text-secondary">Best Legacy is teaching our son who he is.</span>"
                </p>
            </Reveal>
            <Reveal delay={0.15}>
                <div className="mt-8 flex items-center justify-center gap-3">
                    <img src="/group_celebration.jpg" alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-md" loading="lazy" width={44} height={44}/>
                    <div className="text-left">
                        <div className="font-bold text-ink">Mrs Ngozi Eze</div>
                        <div className="text-xs text-gray-600">Mother of Samuel, Basic 2</div>
                    </div>
                </div>
            </Reveal>
        </div>
    </section>
);

/* ----------------------------------------------------------------- School life snap carousel */
const SchoolLifeCarousel = () => (
    <section className="bg-bg py-20 relative overflow-hidden">
        <div className="absolute -top-12 right-1/4 w-72 h-72 rounded-full blob-warm blur-3xl pointer-events-none"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
                <div className="md:flex items-end justify-between mb-10 gap-8">
                    <div>
                        <Badge tone="mint">School life</Badge>
                        <h2 className="mt-4 text-3xl md:text-5xl font-black text-primary leading-tight text-balance">
                            Scroll through a term at Best Legacy.
                        </h2>
                        <div className="mt-3 text-secondary">
                            <SquiggleDivider width={160} />
                        </div>
                    </div>
                    <p className="text-gray-600 max-w-md mt-4 md:mt-0">
                        Cultural Day, science fair, graduation, a Friday assembly. Drag, swipe or use the dots to step through.
                    </p>
                </div>
            </Reveal>

            <Reveal delay={0.1}>
                <SnapCarousel
                    slides={[
                        { src: '/cultural_day.jpg',     tag: 'Cultural Day',  caption: '"My favourite day of the year." — every Basic 4 pupil, ever.' },
                        { src: '/group_celebration.jpg', tag: 'Graduation',    caption: 'Class of Basic 6, 2025, before they head off to secondary school.' },
                        { src: '/school_ceremony.jpg',  tag: 'Assembly',      caption: 'Hymn, thought for the day, and a kindness shout-out — every morning.' },
                        { src: '/staff_members.jpg',    tag: 'Staff',         caption: 'The teachers your child will know by name — and who will know them right back.' },
                        { src: '/fun_in_the_pool.jpg',  tag: 'PE & Play',      caption: 'Real outdoor play. No screens. Lots of running.' },
                    ]}
                />
            </Reveal>
        </div>
    </section>
);

export default Home;
