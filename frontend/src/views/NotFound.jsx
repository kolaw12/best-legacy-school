import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import SparkleField from '../components/ui/SparkleField';

const NotFound = () => {
    const location = useLocation();

    return (
        <section className="relative overflow-hidden bg-mint min-h-[calc(100vh-4rem)] flex items-center pt-20 pb-24">
            <SparkleField count={8} color="rgb(91 108 245 / 0.45)" />
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full blob-mint blur-3xl"></div>
            <div className="absolute -bottom-32 left-12 w-72 h-72 rounded-full blob-warm blur-3xl"></div>

            <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <Badge tone="white" dot>Lost in the corridor</Badge>

                <motion.div
                    initial={{ opacity: 0, scale: 0.7, rotate: -6 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 14 }}
                    className="mt-6 text-[120px] md:text-[200px] font-display font-black text-primary leading-none"
                >
                    4<span className="inline-block animate-breathe">0</span>4
                </motion.div>

                <h1 className="mt-2 text-2xl md:text-4xl font-black text-primary text-balance">
                    Hmm, we can't find that page.
                </h1>
                <p className="mt-4 text-gray-600 max-w-lg mx-auto">
                    The page <code className="font-mono text-secondary bg-white/60 px-2 py-0.5 rounded">{location.pathname}</code> isn't on our map.
                    It might have moved, or you might have followed an old link.
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Button to="/" size="lg">← Back to home</Button>
                    <Button to="/contact" variant="outline" size="lg">Tell us what you were looking for</Button>
                </div>

                <div className="mt-14 max-w-md mx-auto bg-white rounded-2xl p-5 shadow-card text-left">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Maybe you meant…</div>
                    <ul className="grid grid-cols-2 gap-2 text-sm">
                        {[
                            { to: '/admissions', label: 'Admissions' },
                            { to: '/about',      label: 'About us' },
                            { to: '/faq',        label: 'FAQs' },
                            { to: '/gallery',    label: 'Gallery' },
                            { to: '/contact',    label: 'Contact' },
                            { to: '/admin-login', label: 'Sign in' },
                        ].map(l => (
                            <li key={l.to}>
                                <Link to={l.to} className="block px-3 py-2 rounded-xl hover:bg-mint text-ink transition">
                                    → {l.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};

export default NotFound;
