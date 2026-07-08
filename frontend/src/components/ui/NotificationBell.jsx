import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Bell } from 'lucide-react';
import API_URL from '../../config/api';

const fmtRelative = (iso) => {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60)  return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
};

const AUDIENCE_TONE = {
    all:      { dot: 'bg-primary',   label: 'Everyone' },
    parents:  { dot: 'bg-secondary', label: 'Parents' },
    teachers: { dot: 'bg-amber-400', label: 'Teachers' },
    admins:   { dot: 'bg-rose-500',  label: 'Admins' },
};

/**
 * In-portal notifications dropdown. Polls every 60s for unread count;
 * loads full list when the panel is opened.
 *
 * Used in the top bar of admin / teacher / parent layouts.
 */
const NotificationBell = () => {
    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const ref = useRef(null);

    // Initial unread count + 60s poll.
    useEffect(() => {
        const fetchUnread = () =>
            axios.get(`${API_URL}/api/auth/announcements/unread-count/`)
                .then(r => setUnread(r.data?.unread || 0))
                .catch(() => { /* silent — bell just shows 0 */ });
        fetchUnread();
        const id = setInterval(fetchUnread, 60_000);
        return () => clearInterval(id);
    }, []);

    // Click-outside to close.
    useEffect(() => {
        if (!open) return;
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    const openPanel = async () => {
        setOpen(o => !o);
        if (!open && items.length === 0) {
            setLoading(true);
            try {
                const { data } = await axios.get(`${API_URL}/api/auth/announcements/`);
                setItems(Array.isArray(data) ? data : data.results || []);
            } finally {
                setLoading(false);
            }
        }
    };

    const dismiss = async (id) => {
        // Optimistic — mark read locally immediately.
        setItems(prev => prev.map(x => x.id === id ? { ...x, is_read: true } : x));
        setUnread(n => Math.max(0, n - 1));
        try {
            await axios.post(`${API_URL}/api/auth/announcements/${id}/dismiss/`);
        } catch {
            /* if it fails, the next poll resyncs. */
        }
    };

    return (
        <div ref={ref} className="relative">
            <button
                onClick={openPanel}
                aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
                className="relative p-2 rounded-full text-gray-500 hover:text-ink hover:bg-gray-100 transition-colors"
            >
                <Bell className="w-5 h-5" strokeWidth={2} />
                {unread > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary text-ink text-[10px] font-black flex items-center justify-center shadow-sm"
                    >
                        {unread > 9 ? '9+' : unread}
                    </motion.span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-x-4 top-20 lg:absolute lg:inset-auto lg:right-0 lg:top-full lg:mt-3 lg:w-[380px] bg-white rounded-2xl shadow-card-lg border border-gray-100 z-50 overflow-hidden"
                    >
                        <header className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-sm font-bold text-ink">Notifications</span>
                            {unread > 0 && (
                                <span className="text-[11px] font-semibold text-secondary-dark bg-secondary-soft px-2 py-0.5 rounded-full">{unread} new</span>
                            )}
                        </header>

                        <div className="max-h-[60vh] overflow-y-auto" data-lenis-prevent>
                            {loading ? (
                                <div className="p-6 space-y-3">
                                    {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-shimmer" />)}
                                </div>
                            ) : items.length === 0 ? (
                                <div className="p-10 text-center">
                                    <Bell className="w-7 h-7 mx-auto text-gray-300" strokeWidth={1.5} />
                                    <p className="mt-3 text-sm text-gray-500">You're all caught up.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-50">
                                    {items.map(it => {
                                        const tone = AUDIENCE_TONE[it.audience] || AUDIENCE_TONE.all;
                                        return (
                                            <li key={it.id} className={`p-4 flex gap-3 transition ${it.is_read ? 'opacity-60' : ''}`}>
                                                <span className={`shrink-0 w-2.5 h-2.5 rounded-full mt-1.5 ${tone.dot}`}></span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-baseline justify-between gap-2">
                                                        <h4 className="font-bold text-ink text-sm truncate">{it.title}</h4>
                                                        <span className="text-[10px] text-gray-400 shrink-0">{fmtRelative(it.created_at)}</span>
                                                    </div>
                                                    <p className="mt-0.5 text-xs text-gray-600 leading-relaxed">{it.body}</p>
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">{tone.label}</span>
                                                        {!it.is_read && (
                                                            <button
                                                                onClick={() => dismiss(it.id)}
                                                                className="text-[11px] font-semibold text-primary hover:underline"
                                                            >
                                                                Mark as read
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
