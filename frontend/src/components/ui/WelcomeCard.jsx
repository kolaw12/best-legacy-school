import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Dismissable, role-specific welcome card with a 3-4 step checklist.
 * Persists the dismiss in localStorage by storageKey.
 *
 * <WelcomeCard
 *   storageKey="bls.tour.parent"
 *   title="Welcome to your Parent Portal"
 *   subtitle="A 30-second tour of what you can do here."
 *   steps={[
 *     { icon: <Baby className="w-4 h-4" />, label: 'View each child\'s report card' },
 *     { icon: <Calendar className="w-4 h-4" />, label: 'See attendance day by day' },
 *     ...
 *   ]}
 * />
 */
const WelcomeCard = ({ storageKey, title, subtitle, steps = [], tone = 'primary' }) => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        try {
            const dismissed = localStorage.getItem(storageKey) === 'dismissed';
            setOpen(!dismissed);
        } catch {
            setOpen(true);
        }
    }, [storageKey]);

    const dismiss = () => {
        try { localStorage.setItem(storageKey, 'dismissed'); } catch { /* ignore */ }
        setOpen(false);
    };

    const accent = tone === 'warm'
        ? 'from-secondary-soft via-white to-secondary-soft/40 border-secondary/20'
        : 'from-primary-soft via-white to-primary-soft/40 border-primary/20';

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className={`relative bg-gradient-to-br ${accent} border rounded-3xl p-6 md:p-7 shadow-card overflow-hidden mb-8`}
                >
                    <button
                        onClick={dismiss}
                        aria-label="Dismiss welcome"
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-ink flex items-center justify-center transition"
                    >
                        <X className="w-4 h-4" strokeWidth={2} />
                    </button>
                    <h2 className="text-xl md:text-2xl font-black text-primary leading-tight pr-10">{title}</h2>
                    {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
                    <ul className="mt-5 grid sm:grid-cols-2 gap-3">
                        {steps.map((s, i) => (
                            <li key={i} className="flex items-start gap-3 bg-white/70 rounded-xl px-3 py-2.5">
                                <span className="shrink-0 w-7 h-7 rounded-lg bg-white text-base flex items-center justify-center shadow-sm">{s.icon}</span>
                                <span className="text-sm text-ink leading-snug pt-0.5">{s.label}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-5 text-right">
                        <button onClick={dismiss} className="text-xs font-semibold text-gray-500 hover:text-ink transition">
                            Got it — don't show again
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WelcomeCard;
