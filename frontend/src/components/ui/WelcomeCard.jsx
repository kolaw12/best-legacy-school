import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

/**
 * Interactive step-by-step guided onboarding card.
 * Shows one step at a time with Next/Previous navigation and a progress bar.
 * Persists the dismiss in localStorage by storageKey.
 *
 * <WelcomeCard
 *   storageKey="bls.tour.admin"
 *   title="Welcome to BLDS Admin"
 *   subtitle="A quick tour of your dashboard."
 *   steps={[
 *     { icon: <Users className="w-4 h-4" />, label: 'Students', description: 'Manage all student records, profiles, and enrollment.' },
 *     { icon: <Banknote className="w-4 h-4" />, label: 'Finance', description: 'Track fees, payments, and generate receipts.' },
 *     ...
 *   ]}
 * />
 */
const WelcomeCard = ({ storageKey, title, subtitle, steps = [], tone = 'primary' }) => {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [showAll, setShowAll] = useState(false);

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

    const current = steps[step];
    const isLast = step === steps.length - 1;

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
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-ink flex items-center justify-center transition z-10"
                    >
                        <X className="w-4 h-4" strokeWidth={2} />
                    </button>
                    <h2 className="text-xl md:text-2xl font-black text-primary leading-tight pr-10">{title}</h2>
                    {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}

                    {/* Progress dots */}
                    <div className="flex items-center gap-1.5 mt-4">
                        {steps.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setStep(i)}
                                className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : i < step ? 'w-3 bg-primary/40' : 'w-3 bg-gray-300'}`}
                            />
                        ))}
                    </div>

                    {/* Step content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="mt-5"
                        >
                            {showAll ? (
                                <ul className="grid sm:grid-cols-2 gap-3">
                                    {steps.map((s, i) => (
                                        <li key={i} className="flex items-start gap-3 bg-white/70 rounded-xl px-3 py-2.5">
                                            <span className="shrink-0 w-7 h-7 rounded-lg bg-white text-base flex items-center justify-center shadow-sm">{s.icon}</span>
                                            <div>
                                                <span className="text-sm font-semibold text-ink">{s.label}</span>
                                                {s.description && <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : current ? (
                                <div className="flex items-start gap-4 bg-white/70 rounded-xl px-4 py-4">
                                    <span className="shrink-0 w-10 h-10 rounded-xl bg-white text-lg flex items-center justify-center shadow-sm">{current.icon}</span>
                                    <div>
                                        <div className="text-sm font-bold text-ink">{current.label}</div>
                                        {current.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{current.description}</p>}
                                    </div>
                                </div>
                            ) : null}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="mt-5 flex items-center justify-between">
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="text-xs font-semibold text-gray-500 hover:text-ink transition"
                        >
                            {showAll ? 'Show step by step' : 'Show all steps'}
                        </button>
                        <div className="flex items-center gap-2">
                            {step > 0 && (
                                <button
                                    onClick={() => setStep(s => s - 1)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-ink transition px-3 py-1.5 rounded-lg hover:bg-white/60"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                                </button>
                            )}
                            {isLast ? (
                                <button
                                    onClick={dismiss}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-dark transition"
                                >
                                    <Check className="w-3.5 h-3.5" /> Got it
                                </button>
                            ) : (
                                <button
                                    onClick={() => setStep(s => s + 1)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition px-3 py-1.5 rounded-lg hover:bg-white/60"
                                >
                                    Next <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WelcomeCard;
