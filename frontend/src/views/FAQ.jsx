import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, SearchX, Phone, Search } from 'lucide-react';
import PageHero from '../components/PageHero';
import Seo from '../components/Seo';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Reveal from '../components/ui/Reveal';
import { Input } from '../components/ui/Field';

const FAQ_GROUPS = [
    {
        group: 'Admissions',
        items: [
            {
                q: 'What ages do you admit?',
                a: 'Nursery 1 starts at 3 years old; we admit through Basic 6 (typically up to age 11). Children must be 3 by 1 September of the academic year for Nursery 1.',
            },
            {
                q: 'When does the school year start?',
                a: 'First term begins in early September. The full session calendar is shared at offer stage, with break dates aligned to Ogun State school terms.',
            },
            {
                q: 'How do I apply mid-year?',
                a: 'Mid-year admissions are possible if there is space in the relevant class. Submit an application via the Admissions page; we\'ll respond within 2 working days with availability.',
            },
            {
                q: 'Is there an entrance exam?',
                a: 'Not in the formal sense. We invite the child for a 30-minute one-on-one visit with the would-be class teacher: simple conversation, a small reading or counting activity, and play. It\'s designed to set them up well, not to filter them out.',
            },
        ],
    },
    {
        group: 'Fees & Payments',
        items: [
            {
                q: 'What\'s included in the termly fee?',
                a: 'Tuition, all class materials, textbooks, exercise books, daily hot lunch and snack, termly reports, PTA meetings, and the school nurse on call. Uniform and any one-off trips are billed separately.',
            },
            {
                q: 'Do you offer a sibling discount?',
                a: 'Yes — 10% off the second child\'s tuition for as long as both are enrolled.',
            },
            {
                q: 'How can I pay?',
                a: 'Bank transfer is preferred. We email you a Best Legacy invoice with our school account details; once payment lands you receive a numbered receipt within 24 hours. Card and POS available at the bursary office.',
            },
            {
                q: 'What happens if I pay late?',
                a: 'We carry families through one term in good faith on a written payment plan. Beyond that, please speak to the bursar — we\'d rather work it out together than involve the child.',
            },
        ],
    },
    {
        group: 'Daily Life',
        items: [
            {
                q: 'What time does the school day start and end?',
                a: 'Gates open at 7:30am, assembly at 8:00am, dismissal at 3:00pm. After-school care runs until 5:00pm at a small extra charge.',
            },
            {
                q: 'Do you provide meals?',
                a: 'Yes — a healthy mid-morning snack and a hot lunch, both prepared on-site. Menus are shared weekly. We accommodate common allergies; please flag at admission.',
            },
            {
                q: 'What about uniform?',
                a: 'A simple two-piece in our school colours. Uniforms are sold at the bursary; a starter set is around ₦12,000.',
            },
            {
                q: 'Do you do after-school clubs?',
                a: 'Currently we offer reading club, art club, a small football session and Saturday choir practice. New clubs run if at least 8 children sign up.',
            },
        ],
    },
    {
        group: 'Values & Culture',
        items: [
            {
                q: 'Is Best Legacy a Christian school?',
                a: 'Yes — we are Christian-led, with a short morning assembly and a weekly Christian Religious Studies lesson. We welcome children from all faiths and backgrounds; respect for one another is non-negotiable, on every side.',
            },
            {
                q: 'How do you handle discipline?',
                a: 'Restoration over punishment. Class teachers know each child by name; if behaviour drifts we talk to the child first, then loop the parent in. Suspensions are rare and always discussed in advance.',
            },
            {
                q: 'How do you communicate with parents?',
                a: 'A Friday email from the head teacher; instant messages from class teachers when something specific comes up; full reports each term; and a parent–teacher meeting at the end of each term.',
            },
        ],
    },
];

const Item = ({ q, a }) => {
    const [open, setOpen] = useState(false);
    const [vote, setVote] = useState(null); // 'yes' | 'no' | null

    return (
        <li className="border-b border-gray-100 last:border-b-0">
            <button
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                className="w-full flex items-start justify-between gap-4 py-5 text-left group"
            >
                <span className={`font-semibold transition ${open ? 'text-primary' : 'text-ink group-hover:text-primary'}`}>{q}</span>
                <motion.span
                    animate={{ rotate: open ? 45 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-lg font-bold ${open ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-primary-soft group-hover:text-primary-dark'}`}
                >
                    +
                </motion.span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <p className="pb-4 text-gray-600 leading-relaxed">{a}</p>
                        <div className="pb-5 flex items-center gap-3 text-xs text-gray-500">
                            {vote === null ? (
                                <>
                                    <span>Was this helpful?</span>
                                    <button
                                        onClick={() => setVote('yes')}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 hover:border-primary hover:text-primary transition font-semibold"
                                    ><ThumbsUp className="w-3.5 h-3.5" strokeWidth={2} /> Yes</button>
                                    <Link
                                        to={{ pathname: '/contact', search: '?subject=' + encodeURIComponent(q) }}
                                        onClick={() => setVote('no')}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 hover:border-secondary hover:text-secondary transition font-semibold"
                                    ><ThumbsDown className="w-3.5 h-3.5" strokeWidth={2} /> Ask us directly</Link>
                                </>
                            ) : vote === 'yes' ? (
                                <span className="text-primary-dark font-semibold">Thanks — glad it helped.</span>
                            ) : (
                                <span className="text-secondary-dark font-semibold">Opening Contact form…</span>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </li>
    );
};

const FAQ = () => {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return FAQ_GROUPS;
        return FAQ_GROUPS
            .map(group => ({
                ...group,
                items: group.items.filter(it =>
                    it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q),
                ),
            }))
            .filter(group => group.items.length > 0);
    }, [query]);

    const totalMatches = filtered.reduce((acc, g) => acc + g.items.length, 0);
    const totalAll = FAQ_GROUPS.reduce((acc, g) => acc + g.items.length, 0);

    const faqJsonLd = useMemo(() => ({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_GROUPS.flatMap(g => g.items).map(({ q, a }) => ({
            '@type': 'Question',
            name: q,
            acceptedAnswer: { '@type': 'Answer', text: a },
        })),
    }), []);

    return (
    <div className="bg-white">
        <Seo
            title="Frequently Asked Questions"
            description="Real questions from real parents — admissions, fees, daily life, and values at Best Legacy Divine School, answered."
            path="/faq"
            jsonLd={faqJsonLd}
        />
        <PageHero
            eyebrow="Frequently Asked Questions"
            title="Real questions from real parents."
            subtitle="If your question isn't here, call us — Mrs Kolawole answers her own phone."
            bgImage="/cultural_day.jpg"
        />

        <section className="bg-bg py-20 relative overflow-hidden">
            <div className="absolute -top-12 left-1/4 w-72 h-72 rounded-full blob-mint blur-3xl pointer-events-none"></div>
            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

                {/* Search bar */}
                <Reveal>
                    <div className="bg-white rounded-3xl shadow-card p-5 md:p-6 flex flex-col md:flex-row gap-3 md:items-center">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={2} />
                            <Input
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search e.g. fees, uniform, religion, after-school care…"
                                className="!pl-11"
                                aria-label="Search frequently asked questions"
                            />
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                            {query
                                ? <><strong className="text-ink">{totalMatches}</strong> match{totalMatches === 1 ? '' : 'es'} of {totalAll}</>
                                : <>{totalAll} questions answered</>}
                        </div>
                    </div>
                </Reveal>

                {filtered.length === 0 && (
                    <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center">
                        <SearchX className="w-8 h-8 mx-auto text-gray-300" strokeWidth={1.5} />
                        <h3 className="mt-3 font-bold text-ink">No matching questions</h3>
                        <p className="mt-2 text-sm text-gray-500">Try a different word — or <Link to="/contact" className="text-primary font-semibold hover:underline">ask us directly</Link>.</p>
                    </div>
                )}

                {filtered.map(group => (
                    <Reveal key={group.group}>
                        <div className="bg-white rounded-3xl shadow-card p-7 md:p-9">
                            <Badge tone="mint">{group.group}</Badge>
                            <ul className="mt-5">
                                {group.items.map(item => <Item key={item.q} {...item} />)}
                            </ul>
                        </div>
                    </Reveal>
                ))}

                <Reveal>
                    <div className="bg-secondary text-ink rounded-3xl p-8 md:p-10 shadow-card-lg flex flex-col md:flex-row items-center gap-6 md:gap-10">
                        <div className="flex-1">
                            <h3 className="text-2xl md:text-3xl font-black leading-tight">Still have a question?</h3>
                            <p className="mt-2 text-ink/80">Send us a quick message — or just call. We reply within two working days, usually less.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button to="/contact" variant="dark" size="lg">Send a message</Button>
                            <a href="tel:+2348067663966" className="inline-flex items-center gap-2 bg-white text-secondary-dark font-semibold px-6 py-3.5 rounded-full hover:bg-secondary-soft transition">
                                <Phone className="w-4 h-4" strokeWidth={2} />
                                +234 (0) 806 766 3966
                            </a>
                        </div>
                    </div>
                </Reveal>

                <Reveal>
                    <p className="text-center text-sm text-gray-500">
                        Looking for the application form? <Link to="/admissions" className="text-primary font-semibold hover:underline">Visit Admissions →</Link>
                    </p>
                </Reveal>
            </div>
        </section>
    </div>
    );
};

export default FAQ;
