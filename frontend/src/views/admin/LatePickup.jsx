import { useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../../config/api';
import Reveal from '../../components/ui/Reveal';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }) : '—';

const LatePickup = () => {
    const [items, setItems] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [studentId, setStudentId] = useState('');
    const [note, setNote] = useState('');

    const reload = () => axios.get(`${API_URL}/api/operations/late-checkouts/?today=true`)
        .then(r => setItems(r.data || []));

    useEffect(() => {
        setLoading(true);
        Promise.all([
            reload(),
            axios.get(`${API_URL}/api/academics/students/?status=active`).then(r => setStudents(r.data || [])),
        ]).finally(() => setLoading(false));
    }, []);

    const log = async () => {
        if (!studentId) return;
        try {
            await axios.post(`${API_URL}/api/operations/late-checkouts/`, {
                student: Number(studentId), note,
            });
            setStudentId('');
            setNote('');
            setAdding(false);
            reload();
        } catch (e) {
            alert(`Could not log: ${e.response?.data?.detail || e.message}`);
        }
    };

    const collect = async (id, by) => {
        try {
            await axios.post(`${API_URL}/api/operations/late-checkouts/${id}/collect/`, { collected_by: by || 'guardian on file' });
            reload();
        } catch (e) {
            alert(`Could not mark collected: ${e.message}`);
        }
    };

    const waiting = items.filter(i => i.status === 'waiting');
    const collected = items.filter(i => i.status === 'collected');

    return (
        <>
            <Reveal>
                <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <Badge tone="warm" dot>End-of-day</Badge>
                        <h1 className="mt-3 text-2xl md:text-3xl font-black text-primary">Today's late-pickup register</h1>
                        <p className="mt-1 text-sm text-gray-500">Children still on premises after dismissal. Mark collected as guardians arrive.</p>
                    </div>
                    {!adding && <Button size="sm" onClick={() => setAdding(true)}>+ Log a child</Button>}
                </header>
            </Reveal>

            {adding && (
                <div className="mb-6 bg-gray-50 rounded-2xl p-4 grid md:grid-cols-3 gap-3">
                    <select value={studentId} onChange={e => setStudentId(e.target.value)}
                            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary md:col-span-1">
                        <option value="">Choose pupil…</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.full_name} · {s.class_name}</option>)}
                    </select>
                    <input value={note} onChange={e => setNote(e.target.value)}
                           placeholder="Note (optional, e.g. 'parent stuck in traffic')"
                           className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary md:col-span-2" />
                    <div className="flex justify-end gap-2 md:col-span-3">
                        <button onClick={() => setAdding(false)} className="text-sm font-semibold px-4 py-2 rounded-full bg-white border border-gray-200">Cancel</button>
                        <Button size="sm" onClick={log} disabled={!studentId}>Log</Button>
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl shadow-card overflow-hidden">
                    <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex justify-between">
                        <h3 className="font-black text-amber-900">Still waiting</h3>
                        <Badge tone="warm">{waiting.length}</Badge>
                    </div>
                    {loading ? (
                        <div className="p-6 text-sm text-gray-400 text-center">Loading…</div>
                    ) : waiting.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-500">All clear — every pupil is home.</div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {waiting.map(i => (
                                <li key={i.id} className="p-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                                        {i.student_name?.split(' ').map(s => s[0]).slice(0, 2).join('')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-ink truncate">{i.student_name}</div>
                                        <div className="text-xs text-gray-500">{i.class_name} · logged {fmtTime(i.logged_at)}</div>
                                        {i.note && <div className="text-[11px] text-gray-400 mt-0.5">{i.note}</div>}
                                    </div>
                                    <Button size="sm" onClick={() => {
                                        const by = prompt('Who collected? (e.g. Mrs Adeleke / nanny / driver)') || '';
                                        if (by !== null) collect(i.id, by);
                                    }}>
                                        Mark collected
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="bg-white rounded-3xl shadow-card overflow-hidden">
                    <div className="px-5 py-3 bg-mint border-b border-primary/10 flex justify-between">
                        <h3 className="font-black text-primary-dark">Collected today</h3>
                        <Badge tone="mint">{collected.length}</Badge>
                    </div>
                    {collected.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-500">Nobody collected via this register yet today.</div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {collected.map(i => (
                                <li key={i.id} className="p-4">
                                    <div className="font-semibold text-ink text-sm">{i.student_name}</div>
                                    <div className="text-xs text-gray-500">
                                        {i.class_name} · waited {fmtTime(i.logged_at)} → collected {fmtTime(i.collected_at)}
                                    </div>
                                    {i.collected_by && <div className="text-[11px] text-gray-400 mt-0.5">By: {i.collected_by}</div>}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
};

export default LatePickup;
