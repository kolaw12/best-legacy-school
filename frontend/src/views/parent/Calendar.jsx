import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Reveal from '../../components/ui/Reveal';
import API_URL from '../../config/api';

const KIND_TONE = {
    holiday: 'mint',
    term_start: 'mint',
    term_end: 'warm',
    midterm: 'mint',
    exam: 'warm',
    ptm: 'neutral',
    sports: 'mint',
    cultural: 'mint',
    trip: 'mint',
    closure: 'warm',
    other: 'neutral',
};

const monthLabel = (y, m) =>
    new Date(y, m - 1, 1).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });

const ParentCalendar = () => {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        axios.get(`${API_URL}/api/wellbeing/calendar/`, { params: { year, month } })
            .then(r => setEvents(r.data?.events || []))
            .finally(() => setLoading(false));
    }, [year, month]);

    const eventsByDay = useMemo(() => {
        const map = {};
        events.forEach(e => {
            const start = new Date(e.start_date);
            const end = e.end_date ? new Date(e.end_date) : start;
            const cur = new Date(start);
            while (cur <= end) {
                if (cur.getFullYear() === year && cur.getMonth() + 1 === month) {
                    const day = cur.getDate();
                    (map[day] ||= []).push(e);
                }
                cur.setDate(cur.getDate() + 1);
            }
        });
        return map;
    }, [events, year, month]);

    const firstDow = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const prev = () => {
        if (month === 1) { setMonth(12); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };
    const next = () => {
        if (month === 12) { setMonth(1); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    const isToday = (d) =>
        d === today.getDate() &&
        month === today.getMonth() + 1 &&
        year === today.getFullYear();

    return (
        <>
            <Reveal>
                <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <Badge tone="mint" dot>School calendar</Badge>
                        <h1 className="mt-3 text-3xl md:text-4xl font-black text-primary">{monthLabel(year, month)}</h1>
                        <p className="mt-1 text-sm text-gray-500">Term dates, exams, parent-teacher days, holidays.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={prev} className="px-3 py-2 rounded-xl bg-white border border-gray-200 hover:border-primary text-sm font-semibold">←</button>
                        <button onClick={() => { const t = new Date(); setYear(t.getFullYear()); setMonth(t.getMonth() + 1); }}
                                className="px-3 py-2 rounded-xl bg-primary-soft text-primary-dark text-sm font-semibold hover:bg-primary hover:text-white transition">
                            Today
                        </button>
                        <button onClick={next} className="px-3 py-2 rounded-xl bg-white border border-gray-200 hover:border-primary text-sm font-semibold">→</button>
                    </div>
                </header>
            </Reveal>

            {loading ? (
                <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
            ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Calendar grid */}
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-card p-4 md:p-6">
                        <div className="grid grid-cols-7 gap-1 mb-1">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                <div key={i} className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 py-2">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {cells.map((d, i) => (
                                <div key={i} className={`aspect-square rounded-xl p-1.5 text-xs flex flex-col gap-0.5 ${
                                    !d ? 'bg-transparent' :
                                    isToday(d) ? 'bg-primary text-white' :
                                    eventsByDay[d] ? 'bg-primary-soft' : 'bg-gray-50 hover:bg-gray-100'
                                }`}>
                                    {d && (
                                        <>
                                            <div className={`font-bold ${isToday(d) ? 'text-white' : 'text-ink'}`}>{d}</div>
                                            {eventsByDay[d]?.slice(0, 2).map(e => (
                                                <motion.div
                                                    key={e.id}
                                                    initial={{ opacity: 0, y: 4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`text-[9px] leading-tight px-1 py-0.5 rounded truncate ${
                                                        isToday(d) ? 'bg-white/30 text-white' : 'bg-white text-primary-dark'
                                                    }`}
                                                    title={e.title}
                                                >
                                                    {e.title}
                                                </motion.div>
                                            ))}
                                            {eventsByDay[d]?.length > 2 && (
                                                <div className={`text-[9px] ${isToday(d) ? 'text-white/80' : 'text-gray-400'}`}>
                                                    +{eventsByDay[d].length - 2} more
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* List view */}
                    <div className="bg-white rounded-3xl shadow-card p-6">
                        <h3 className="font-bold text-ink mb-4">Coming up this month</h3>
                        {events.length === 0 ? (
                            <p className="text-sm text-gray-400">No events scheduled. Quiet month.</p>
                        ) : (
                            <ul className="space-y-3 max-h-[480px] overflow-auto pr-1" data-lenis-prevent>
                                {events.map(e => (
                                    <li key={e.id} className="border border-gray-100 rounded-xl p-3 hover:border-primary transition">
                                        <div className="flex items-start gap-2 mb-1">
                                            <Badge tone={KIND_TONE[e.kind] || 'neutral'}>{e.kind_label}</Badge>
                                            <span className="text-xs text-gray-500 ml-auto">
                                                {new Date(e.start_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                                                {e.end_date && e.end_date !== e.start_date && ` → ${new Date(e.end_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`}
                                            </span>
                                        </div>
                                        <div className="font-semibold text-ink text-sm">{e.title}</div>
                                        {e.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{e.description}</p>}
                                        {e.location && <div className="text-[11px] text-gray-400 mt-1 inline-flex items-center gap-1"><MapPin className="w-3 h-3" strokeWidth={2} /> {e.location}</div>}
                                        {(e.starts_at || e.ends_at) && (
                                            <div className="text-[11px] text-gray-400 mt-0.5">
                                                {e.starts_at && `from ${e.starts_at.slice(0, 5)}`}
                                                {e.ends_at && ` to ${e.ends_at.slice(0, 5)}`}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default ParentCalendar;
