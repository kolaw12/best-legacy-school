import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../../config/api';

const naira = (v) => `₦${Number(v || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

/**
 * Persistent header chip showing the parent's outstanding total + days-until.
 * Turns warm-coral when due in <7 days, ink when paid up.
 */
const FeeDueChip = () => {
    const [outstanding, setOutstanding] = useState(0);
    const [nextDue, setNextDue] = useState(null);
    const [count, setCount] = useState(0);

    useEffect(() => {
        let cancelled = false;
        axios.get(`${API_URL}/api/finance/invoices/`)
            .then(r => {
                if (cancelled) return;
                const invoices = r.data || [];
                const open = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled');
                const total = open.reduce((acc, i) => acc + Number(i.balance || 0), 0);
                setOutstanding(total);
                setCount(open.length);
                // earliest due_date
                const dates = open.map(i => i.due_date).filter(Boolean).sort();
                setNextDue(dates[0] || null);
            })
            .catch(() => { /* silent — chip just hides */ });
        return () => { cancelled = true; };
    }, []);

    if (outstanding <= 0) {
        return (
            <Link
                to="/parent/fees"
                className="hidden md:inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary-soft text-primary-dark hover:bg-primary hover:text-white transition"
            >
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                All paid up · {count} invoices
            </Link>
        );
    }

    const days = nextDue
        ? Math.ceil((new Date(nextDue).getTime() - Date.now()) / (24 * 3600 * 1000))
        : null;
    const urgent = days != null && days <= 7;

    return (
        <Link
            to="/parent/fees"
            className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                urgent
                    ? 'bg-secondary text-ink hover:bg-secondary-dark shadow-sm'
                    : 'bg-secondary-soft text-secondary-dark hover:bg-secondary hover:text-ink'
            }`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${urgent ? 'bg-white' : 'bg-secondary'}`}></span>
            {days != null
                ? <>Due in {days} day{days === 1 ? '' : 's'} · {naira(outstanding)}</>
                : <>{naira(outstanding)} outstanding · pay now</>
            }
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </Link>
    );
};

export default FeeDueChip;
