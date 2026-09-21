import { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/**
 * Lightweight toast system using CSS transitions (no framer-motion).
 *   const toast = useToast();
 *   toast.success("Saved");
 *   toast.error("Failed", { duration: 5000 });
 */
const ToastContext = createContext(null);

const TONES = {
    success: { dot: 'bg-primary',   ring: 'ring-primary/30',    text: 'text-primary-dark',   icon: CheckCircle2 },
    error:   { dot: 'bg-rose-500',  ring: 'ring-rose-300',      text: 'text-rose-700',       icon: AlertCircle },
    info:    { dot: 'bg-secondary', ring: 'ring-secondary/30',  text: 'text-secondary-dark', icon: Info },
};

let _id = 0;

const ToastItem = ({ toast, onDismiss }) => {
    const [entering, setEntering] = useState(true);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setEntering(false));
        return () => cancelAnimationFrame(raf);
    }, []);

    const tone = TONES[toast.tone] || TONES.info;

    return (
        <div
            className={`pointer-events-auto bg-white rounded-2xl shadow-card-lg p-4 flex items-start gap-3 ring-1 ${tone.ring} transition-all duration-300 ease-out ${
                entering ? 'opacity-0 translate-x-10 scale-95' : 'opacity-100 translate-x-0 scale-100'
            }`}
        >
            <span className={`shrink-0 w-7 h-7 rounded-full ${tone.dot} text-white flex items-center justify-center`}>
                <tone.icon className="w-4 h-4" strokeWidth={2.5} />
            </span>
            <div className={`flex-1 text-sm font-semibold ${tone.text}`}>{toast.message}</div>
            <button
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss"
                className="shrink-0 text-gray-400 hover:text-ink p-1 -m-1"
            >
                <X className="w-4 h-4" strokeWidth={2} />
            </button>
        </div>
    );
};

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
                {toasts.map(t => (
                    <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        return { success: () => {}, error: () => {}, info: () => {}, dismiss: () => {} };
    }
    return ctx;
};

export default ToastProvider;
