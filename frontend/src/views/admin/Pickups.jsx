import { useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../../config/api';
import Reveal from '../../components/ui/Reveal';
import Badge from '../../components/ui/Badge';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const Pickups = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        setLoading(true);
        axios.get(`${API_URL}/api/academics/pickup-auths/?today=true`)
            .then(r => setItems(r.data || []))
            .finally(() => setLoading(false));
    }, []);

    const filtered = items.filter(p => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            p.name.toLowerCase().includes(q) ||
            p.phone?.toLowerCase().includes(q) ||
            p.student_name?.toLowerCase().includes(q) ||
            p.student_class?.toLowerCase().includes(q)
        );
    });

    const grouped = filtered.reduce((acc, p) => {
        const key = p.student_class || '—';
        (acc[key] ||= []).push(p);
        return acc;
    }, {});

    const today = new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <>
            {/* Print-only stylesheet */}
            <style>{`
                @media print {
                    body { background: white !important; }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    main { padding: 0 !important; max-width: 100% !important; }
                    aside, .sticky { display: none !important; }
                    .lg\\:pl-64 { padding-left: 0 !important; }
                }
                .print-only { display: none; }
            `}</style>

            <Reveal>
                <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-primary">Today's pickup list</h1>
                        <p className="text-sm text-gray-500 mt-1">{today} · everyone authorised to collect a child today</p>
                    </div>
                    <div className="flex gap-2 no-print">
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search name, phone or class…"
                            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary w-56"
                        />
                        <button
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                            Print
                        </button>
                    </div>
                </header>
            </Reveal>

            <div className="print-only mb-6 pb-3 border-b border-gray-300">
                <h1 className="text-3xl font-black">Best Legacy Divine School — Pickup List</h1>
                <p className="text-sm text-gray-700">{today}</p>
            </div>

            {loading ? (
                <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
            ) : items.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                    <div className="text-5xl mb-3">🚸</div>
                    <h3 className="font-bold text-ink">No active pickups for today</h3>
                    <p className="text-sm text-gray-500 mt-1">Parents haven't added any authorisations yet, or all entries have expired.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(grouped).map(([cls, list]) => (
                        <Reveal key={cls}>
                            <div className="bg-white rounded-3xl shadow-card overflow-hidden">
                                <div className="px-5 py-3 bg-primary-soft border-b border-primary/10 flex items-center justify-between">
                                    <h3 className="font-black text-primary-dark">{cls}</h3>
                                    <span className="text-xs font-semibold text-primary-dark/70">{list.length} {list.length === 1 ? 'entry' : 'entries'}</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-[11px] uppercase tracking-widest text-gray-500 bg-gray-50">
                                                <th className="text-left px-4 py-3 font-bold">Child</th>
                                                <th className="text-left px-4 py-3 font-bold">Authorised pickup</th>
                                                <th className="text-left px-4 py-3 font-bold">Relationship</th>
                                                <th className="text-left px-4 py-3 font-bold">Phone</th>
                                                <th className="text-left px-4 py-3 font-bold">ID hint</th>
                                                <th className="text-left px-4 py-3 font-bold">Valid</th>
                                                <th className="text-left px-4 py-3 font-bold no-print">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {list.map(p => (
                                                <tr key={p.id} className="border-t border-gray-100">
                                                    <td className="px-4 py-3 font-semibold text-ink">{p.student_name}</td>
                                                    <td className="px-4 py-3 font-medium">{p.name}</td>
                                                    <td className="px-4 py-3 text-gray-600">{p.relationship_label}</td>
                                                    <td className="px-4 py-3 font-mono text-xs">{p.phone || '—'}</td>
                                                    <td className="px-4 py-3 text-gray-600">{p.id_note || '—'}</td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                                        {p.valid_from ? `from ${fmtDate(p.valid_from)}` : 'open'}
                                                        {p.valid_until ? ` · until ${fmtDate(p.valid_until)}` : ''}
                                                    </td>
                                                    <td className="px-4 py-3 no-print">
                                                        <Badge tone="mint">OK</Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            )}

            <div className="print-only mt-8 pt-4 border-t border-gray-300 text-xs text-gray-600">
                <p>Gate staff: verify ID hint and phone. Anyone not on this list MUST be turned away — escalate to the office.</p>
            </div>
        </>
    );
};

export default Pickups;
