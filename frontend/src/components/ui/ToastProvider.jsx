import { createContext, useCallback, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Lightweight toast system.
 *   const toast = useToast();
 *   toast.success("Saved");
 *   toast.error("Failed", { duration: 5000 });
 */
const ToastContext = createContext(null);

const TONES = {
    success: { dot: 'bg-primary',   ring: 'ring-primary/30',    text: 'text-primary-dark',   icon: '✓' },
    error:   { dot: 'bg-rose-500',  ring: 'ring-rose-300',      text: 'text-rose-700',       icon: '!' },
    info:    { dot: 'bg-secondary', ring: 'ring-secondary/30',  text: 'text-secondary-dark', icon: 'i' },
};

let _id = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const push = useCallback((tone, message, opts = {}) => {
        const id = ++_id;
        const duration = opts.duration ?? (tone === 'error' ? 5500 : 3500);
        setToasts(prev => [...prev, { id, tone, message, duration }]);
        if (duration > 0) setTimeout(() => dismiss(id), duration);
        return id;
    }, [dismiss]);

    const api = {
        success: (msg, opts) => push('success', msg, opts),
        error:   (msg, opts) => push('error', msg, opts),
        info:    (msg, opts) => push('info', msg, opts),
        dismiss,
    };

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div
                className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none w-[min(360px,calc(100vw-2rem))]"
                role="region"
                aria-label="Notifications"
                aria-live="polite"
            >
                <AnimatePresence>
                    {toasts.map(t => {
                        const tone = TONES[t.tone] || TONES.info;
                        return (
                            <motion.div
                                key={t.id}
                                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                                className={`pointer-events-auto bg-white rounded-2xl shadow-card-lg p-4 flex items-start gap-3 ring-1 ${tone.ring}`}
                            >
                                <span className={`shrink-0 w-7 h-7 rounded-full ${tone.dot} text-white flex items-center justify-center text-sm font-black`}>
                                    {tone.icon}
                                </span>
                                <div className={`flex-1 text-sm font-semibold ${tone.text}`}>{t.message}</div>
                                <button
                                    onClick={() => dismiss(t.id)}
                                    aria-label="Dismiss"
                                    className="shrink-0 text-gray-400 hover:text-ink p-1 -m-1"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        // Fallback: don't throw, just no-op so components don't crash if forgotten
        return { success: () => {}, error: () => {}, info: () => {}, dismiss: () => {} };
    }
    return ctx;
};

export default ToastProvider;
