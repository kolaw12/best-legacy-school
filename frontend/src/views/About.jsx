import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Target, Eye, Users, Heart, Handshake, Puzzle, ArrowRight } from 'lucide-react';
import Seo from '../components/Seo';

const EASE = [0.22, 1, 0.36, 1];

/* Mount-triggered fade — this site uses Lenis smooth-scroll, which can leave
   whileInView-based reveals stuck at their hidden initial state, so we
   animate on mount instead (see views/Home.jsx for the same fix). */
const Fade = ({ children, delay = 0, x = 0, y = 24, className }) => {
    const reduced = useReducedMotion();
    if (reduced) return <div className={className}>{children}</div>;
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, x, y, filter: 'blur(6px)' }}
            animate={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay, ease: EASE }}
        >
            {children}
        </motion.div>
    );
};

const Eyebrow = ({ children, tone = 'light' }) => (
    <div className="flex items-center gap-3">
        <span className="w-1.5 h-1.5 rounded-full bg-gold" />
        <span className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${tone === 'dark' ? 'text-white/70' : 'text-gray-500'}`}>
            {children}
        </span>
    </div>
);

const VALUES = [
    { title: 'Child-First Learning', desc: 'Every decision starts with what helps a child grow into a confident, curious learner.', icon: Users },
    { title: 'Character & Faith', desc: 'We pair academic rigour with moral instruction rooted in Christian values and Nigerian culture.', icon: Heart },
    { title: 'Warm Partnership', desc: 'Teachers and parents move in step: progress notes, open days, and honest conversation.', icon: Handshake },
    { title: 'Play Meets Purpose', desc: 'Play-based activities in Nursery, structured learning in Basic, joyful discovery in both.', icon: Puzzle },
];

const MILESTONES = [
    { year: '2009', title: 'Our beginning', desc: 'Started as a small nursery centre in Mowe, Ogun State with 14 children.' },
    { year: '2014', title: 'Primary section opens', desc: 'Expanded to offer Basic 1–6 with a full Nigerian curriculum.' },
    { year: '2019', title: 'ICT & creative studio', desc: 'Built our computer lab and creative arts room to support modern learning.' },
    { year: '2024', title: '500+ legacy builders', desc: 'Over 500 children have passed through our halls, and that number keeps growing.' },
];

const About = () => (
    <div className="bg-white -mt-16 md:-mt-[4.5rem]">
        <Seo
            title="About Us"
            description="Sixteen years of raising confident, Christ-centred learners. Best Legacy Divine School combines a strong Nigerian curriculum, warm teaching, and real partnership with parents in Mowe, Ogun State."
            path="/about"
        />
        <AboutHero />
        <MissionVision />
        <Values />
        <Story />
        <Principal />
    </div>
);

/* ----------------------------------------------------------------- Hero */
const AboutHero = () => (
    <section className="relative bg-paper overflow-hidden pt-28 pb-16 md:pt-32 md:pb-20">
        <div className="absolute inset-0 mesh-gradient-premium opacity-70 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 sm:px-8 grid md:grid-cols-12 gap-y-10 gap-x-10 items-center">
            <div className="md:col-span-7">
                <Fade>
                    <Eyebrow>About us</Eyebrow>
                    <h1 className="mt-5 font-serif text-4xl sm:text-5xl md:text-6xl font-medium text-ink leading-[1.05] tracking-tight text-balance">
                        Sixteen years of raising <span className="italic text-primary">confident</span>, Christ-centred learners.
                    </h1>
                    <p className="mt-5 max-w-lg text-gray-600 text-lg leading-relaxed">
                        Best Legacy Divine School is a Nursery and Primary school in Mowe, Ogun State. We combine a strong Nigerian curriculum, warm teaching, and real partnership with parents.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                        <Link
                            to="/admissions"
                            className="inline-flex items-center gap-2 bg-ink text-white font-semibold px-7 py-3.5 rounded-full shadow-[0_12px_32px_-8px_rgba(27,31,59,0.35)] hover:bg-gray-800 transition-colors"
                        >
                            Start an application
                            <ArrowRight className="w-4 h-4" strokeWidth={2} />
                        </Link>
                        <Link
                            to="/contact"
                            className="inline-flex items-center gap-2 text-ink font-semibold border-b border-ink/20 pb-0.5 hover:border-gold hover:text-primary transition-colors"
                        >
                            Book a visit
                        </Link>
                    </div>
                </Fade>

                <Fade delay={0.2}>
                    <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-4 pt-6 border-t border-gray-200/70">
                        <div>
                            <div className="font-serif text-3xl text-ink">16<span className="text-primary">+</span></div>
                            <div className="mt-1 text-[11px] uppercase tracking-[0.15em] text-gray-500">Years in Mowe</div>
                        </div>
                        <div>
                            <div className="font-serif text-3xl text-ink">500<span className="text-primary">+</span></div>
                            <div className="mt-1 text-[11px] uppercase tracking-[0.15em] text-gray-500">Legacy builders</div>
                        </div>
                    </div>
                </Fade>
            </div>

            <div className="md:col-span-5 relative">
                <Fade x={24} y={0} delay={0.15}>
                    <div className="relative">
                        <div className="absolute -inset-4 border border-gold/40 rounded-2xl hidden md:block" />
                        <div className="relative rounded-2xl overflow-hidden shadow-card-lg aspect-[4/5]">
                            <img src="/school_hero_Section.jpg" alt="Pupils at Best Legacy Divine School" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-5 -left-5 bg-ink text-white rounded-2xl px-4 py-3 shadow-[0_20px_45px_-12px_rgba(27,31,59,0.45)] hidden sm:block">
                            <div className="text-[10px] uppercase tracking-[0.15em] text-white/60">Est.</div>
                            <div className="font-serif text-xl">2009</div>
                        </div>
                    </div>
                </Fade>
            </div>
        </div>
    </section>
);

/* ----------------------------------------------------------------- Mission / Vision */
const MissionVision = () => (
    <section className="bg-white py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 grid md:grid-cols-2 gap-6">
            <Fade className="h-full">
                <div className="h-full rounded-2xl border border-gray-100 shadow-card hover:shadow-card-lg transition-shadow p-8 md:p-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                            <Target className="w-5 h-5" strokeWidth={1.75} />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Our mission</span>
                    </div>
                    <h3 className="mt-6 font-serif text-2xl md:text-3xl text-ink leading-tight">
                        To raise well-rounded Nigerian children: academically strong, morally grounded, and ready for the next stage.
                    </h3>
                    <p className="mt-4 text-gray-600 leading-relaxed">
                        We nurture every child through play-based Nursery learning, a rigorous Basic curriculum, and teachers who know each student by name.
                    </p>
                </div>
            </Fade>
            <Fade delay={0.1} className="h-full">
                <div className="h-full rounded-2xl border border-gray-100 shadow-card hover:shadow-card-lg transition-shadow p-8 md:p-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                            <Eye className="w-5 h-5" strokeWidth={1.75} />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Our vision</span>
                    </div>
                    <h3 className="mt-6 font-serif text-2xl md:text-3xl text-ink leading-tight">
                        A primary school known for the quiet, steady confidence of its graduates.
                    </h3>
                    <p className="mt-4 text-gray-600 leading-relaxed">
                        By Basic 6, our pupils read fluently, think clearly, lead kindly, and carry a strong Christian foundation into secondary school.
                    </p>
                </div>
            </Fade>
        </div>
    </section>
);

/* ----------------------------------------------------------------- Values */
const Values = () => (
    <section className="bg-paper py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
            <Fade>
                <Eyebrow>Core values</Eyebrow>
                <h2 className="mt-6 font-serif text-3xl md:text-5xl text-ink leading-[1.1] max-w-2xl text-balance">
                    What we believe about teaching children.
                </h2>
                <p className="mt-4 text-gray-600 max-w-xl">
                    These four commitments shape how our teachers plan lessons, how we run the day, and how we speak with parents.
                </p>
            </Fade>

            <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {VALUES.map((v, i) => (
                    <Fade key={v.title} delay={i * 0.08} className="h-full">
                        <div className="h-full bg-white rounded-2xl p-6 border border-gray-100 hover:border-gold/30 hover:shadow-card-lg transition-all">
                            <div className="w-11 h-11 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                                <v.icon className="w-5 h-5" strokeWidth={1.75} />
                            </div>
                            <h4 className="mt-5 font-serif text-lg text-ink">{v.title}</h4>
                            <p className="mt-2 text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                        </div>
                    </Fade>
                ))}
            </div>
        </div>
    </section>
);

/* ----------------------------------------------------------------- Our story / timeline */
const Story = () => (
    <section className="bg-white py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 grid md:grid-cols-2 gap-12 items-start">
            <div>
                <Fade>
                    <Eyebrow>Our story</Eyebrow>
                    <h2 className="mt-6 font-serif text-3xl md:text-4xl text-ink leading-tight text-balance">
                        From fourteen children to a legacy.
                    </h2>
                    <p className="mt-4 text-gray-600 leading-relaxed max-w-md">
                        What started in 2009 as a one-room nursery on Kolawole Street has grown into a full Nursery and Primary school serving families across Mowe and Ibafo.
                    </p>
                </Fade>
                <Fade delay={0.15}>
                    <div className="mt-8 rounded-2xl overflow-hidden aspect-[4/3] shadow-card-lg">
                        <img src="/school_library.jpg" alt="School life" className="w-full h-full object-cover" />
                    </div>
                </Fade>
            </div>

            <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
                {MILESTONES.map((m, i) => (
                    <Fade key={m.year} x={-16} y={0} delay={i * 0.06}>
                        <div className="py-5 flex items-baseline gap-4">
                            <span className="shrink-0 w-14 font-serif text-xl text-primary">{m.year}</span>
                            <div>
                                <div className="font-semibold text-ink">{m.title}</div>
                                <p className="mt-1 text-sm text-gray-600 leading-relaxed">{m.desc}</p>
                            </div>
                        </div>
                    </Fade>
                ))}
            </div>
        </div>
    </section>
);

/* ----------------------------------------------------------------- Principal */
const Principal = () => (
    <section className="relative bg-ink text-white py-20 md:py-28 overflow-hidden">
        <div className="absolute top-0 right-0 w-[70%] h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none rounded-l-full blur-3xl" />
        <div className="absolute inset-0 grain-dot opacity-20 mix-blend-overlay pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 sm:px-8 grid md:grid-cols-5 gap-10 items-center">
            <Fade x={-24} y={0} className="md:col-span-2">
                <div className="relative">
                    <div className="absolute -inset-4 border border-gold/30 rounded-2xl hidden md:block" />
                    <div className="relative rounded-2xl overflow-hidden shadow-card-lg aspect-[4/5]">
                        <img src="/staff_members.jpg" alt="School Principal" className="w-full h-full object-cover" />
                    </div>
                </div>
            </Fade>
            <Fade delay={0.1} x={24} y={0} className="md:col-span-3">
                <Eyebrow tone="dark">A word from the principal</Eyebrow>
                <h2 className="mt-6 font-serif text-3xl md:text-4xl leading-tight text-balance">
                    &ldquo;Our job is not just to teach, it&rsquo;s to <span className="italic text-gold">know each child</span>.&rdquo;
                </h2>
                <p className="mt-6 text-white/70 leading-relaxed">
                    When a parent hands us their child, they are handing us a trust. We take that seriously. Every teacher here knows every pupil in their class: what they love, what they struggle with, what makes them laugh. That&rsquo;s the Best Legacy way.
                </p>
                <p className="mt-4 text-white/70 leading-relaxed">
                    If you&rsquo;re considering our school, come and visit. Watch a Nursery class sing, sit in on a Basic 5 maths lesson, and talk to our teachers. Then decide.
                </p>
                <div className="mt-6">
                    <div className="font-semibold">Mrs Olusola Kolawole</div>
                    <div className="text-sm text-white/50">Principal, Best Legacy Divine School</div>
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                    <Link
                        to="/admissions"
                        className="inline-flex items-center gap-2 bg-white text-ink font-semibold px-7 py-3.5 rounded-full shadow-[0_12px_32px_-8px_rgba(0,0,0,0.35)] hover:bg-white/90 transition-colors"
                    >
                        Start an application
                        <ArrowRight className="w-4 h-4" strokeWidth={2} />
                    </Link>
                    <Link
                        to="/contact"
                        className="inline-flex items-center gap-2 text-white font-semibold border-b border-white/40 pb-0.5 hover:border-gold hover:text-gold transition-colors"
                    >
                        Book a visit
                    </Link>
                </div>
            </Fade>
        </div>
    </section>
);

export default About;
