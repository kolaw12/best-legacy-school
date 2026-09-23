import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import AdminPageHeader from '../../components/admin/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Select } from '../../components/ui/Field';
import Skeleton from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/ToastProvider';
import API_URL from '../../config/api';
import adminApi from '../../config/adminApi';

const ACTIONS = [
    { code: 'promote',  label: 'Promote',  tone: 'bg-primary text-white' },
    { code: 'repeat',   label: 'Repeat',   tone: 'bg-amber-400 text-ink' },
    { code: 'graduate', label: 'Graduate', tone: 'bg-secondary text-ink' },
    { code: 'withdraw', label: 'Withdraw', tone: 'bg-rose-400 text-white' },
];

const Promotion = () => {
    const [sessions, setSessions] = useState([]);
    const [fromSession, setFromSession] = useState('');
    const [toSession, setToSession] = useState('');
    const [students, setStudents] = useState([]);
    const [actions, setActions] = useState({});  // studentId → action
    const [selected, setSelected] = useState({}); // studentId → true
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState(null);
    const toast = useToast();

    useEffect(() => {
        Promise.all([adminApi.sessions(), adminApi.students({ status: 'active' })])
            .then(([s, st]) => {
                const ss = s.data || [];
                setSessions(ss);
                const cur = ss.find(x => x.is_current) || ss[0];
                if (cur) setFromSession(String(cur.id));
                const next = ss.find(x => x.id !== (cur?.id)) || cur;
                if (next) setToSession(String(next.id));
                setStudents(st.data || []);
                // default action: promote
                const init = {};
                (st.data || []).forEach(s => { init[s.id] = 'promote'; });
                setActions(init);
            })
            .finally(() => setLoading(false));
    }, []);

    // --- Selection helpers ---
    const selectedIds = useMemo(() => {
        return Object.keys(selected).filter(id => selected[id]).map(Number);
    }, [selected]);
    const selectedCount = selectedIds.length;

    const toggleSelect = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));
    const selectAll = (ids) => {
        const next = { ...selected };
        const allSelected = ids.every(id => next[id]);
        ids.forEach(id => { next[id] = !allSelected; });
        setSelected(next);
    };
    const clearSelection = () => setSelected({});

    // Apply action to all students (existing behavior)
    const setAllTo = (action) => {
        const fresh = {};
        students.forEach(s => { fresh[s.id] = action; });
        setActions(fresh);
    };

    // Apply action to selected students only
    const setSelectedTo = (action) => {
        const next = { ...actions };
        selectedIds.forEach(id => { next[id] = action; });
        setActions(next);
    };

    const setAction = (id, action) => setActions(prev => ({ ...prev, [id]: action }));

    const counts = useMemo(() => {
        // Only count selected students if there's a selection, otherwise count all
        const source = selectedCount > 0
            ? students.filter(s => selected[s.id])
            : students;
        const c = { promote: 0, repeat: 0, graduate: 0, withdraw: 0 };
        source.forEach(s => { const a = actions[s.id]; if (a) c[a] = (c[a] || 0) + 1; });
        return { ...c, _total: source.length };
    }, [actions, students, selected, selectedCount]);

    const byClass = useMemo(() => {
        const buckets = {};
        students.forEach(s => {
            (buckets[s.class_name] = buckets[s.class_name] || []).push(s);
        });
        const order = ['KG 1', 'KG 2', 'Nursery 1', 'Nursery 2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5'];
        return order.filter(k => buckets[k]).map(k => ({ name: k, students: buckets[k] }));
    }, [students]);

    const run = async () => {
        if (!fromSession || !toSession) return toast.error('Pick both sessions.');
        if (fromSession === toSession) return toast.error('Source and target sessions must differ.');

        // If there's a selection, only promote selected students.
        // If no selection, promote all (default action).
        const hasSelection = selectedCount > 0;
        const studentsToProcess = hasSelection
            ? students.filter(s => selected[s.id])
            : students;

        if (studentsToProcess.length === 0) return toast.error('No students to process.');

        if (!window.confirm(
            `Promote ${counts.promote}, repeat ${counts.repeat}, graduate ${counts.graduate}, withdraw ${counts.withdraw}? This updates ${studentsToProcess.length} pupil(s) and switches the current session. Continue?`
        )) return;

        setRunning(true);
        setResult(null);
        try {
            const payload = {
                from_session: Number(fromSession),
                to_session: Number(toSession),
                // Only send actions for students we want to process
                actions: studentsToProcess.map(s => ({
                    student: s.id, action: actions[s.id] || 'promote',
                })),
            };
            const { data } = await axios.post(`${API_URL}/api/academics/students/promote/`, payload);
            setResult(data);
            const s = data.summary || {};
            toast.success(`Promoted ${s.promoted} · Repeated ${s.repeated} · Graduated ${s.graduated} · Withdrawn ${s.withdrawn}`);
        } catch (err) {
            toast.error(err.response?.data?.error || err.message);
        } finally {
            setRunning(false);
        }
    };

    return (
        <>
            <AdminPageHeader
                title="Promotion Engine"
                subtitle="End-of-session: move every active pupil to the next class. You can override individual pupils with Repeat / Graduate / Withdraw before running."
            />

            {/* Session selector */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 mb-6 grid md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">From session (closing out)</label>
                    <Select value={fromSession} onChange={e => setFromSession(e.target.value)}>
                        {sessions.map(s => <option key={s.id} value={s.id}>{s.name}{s.is_current ? ' (current)' : ''}</option>)}
                    </Select>
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">To session (new)</label>
                    <Select value={toSession} onChange={e => setToSession(e.target.value)}>
                        {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                </div>
            </div>

            {/* Quick-set everyone */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-xs font-semibold text-gray-500 mr-2">Set all to:</span>
                {ACTIONS.map(a => (
                    <button
                        key={a.code}
                        onClick={() => setAllTo(a.code)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full ${a.tone} hover:opacity-90 transition`}
                    >
                        {a.label}
                    </button>
                ))}
            </div>

            {/* Tally */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <Tally label="Promote"  count={counts.promote}  total={counts._total} bg="bg-primary-soft text-primary-dark" />
                <Tally label="Repeat"   count={counts.repeat}   total={counts._total} bg="bg-amber-50 text-amber-800" />
                <Tally label="Graduate" count={counts.graduate} total={counts._total} bg="bg-secondary-soft text-secondary-dark" />
                <Tally label="Withdraw" count={counts.withdraw} total={counts._total} bg="bg-rose-50 text-rose-700" />
            </div>

            {/* Selected students action bar */}
            {selectedCount > 0 && (
                <div className="bg-primary-soft/60 border border-primary/20 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold text-primary-dark">
                        {selectedCount} student{selectedCount !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex flex-wrap gap-1.5 ml-2">
                        {ACTIONS.map(a => (
                            <button
                                key={a.code}
                                onClick={() => setSelectedTo(a.code)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full ${a.tone} hover:opacity-90 transition`}
                            >
                                Set selected to {a.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={clearSelection}
                        className="ml-auto text-xs font-semibold text-gray-500 hover:text-ink transition"
                    >
                        Clear selection
                    </button>
                </div>
            )}

            {/* Per-class blocks */}
            {loading ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
            ) : (
                <div className="space-y-6">
                    {byClass.map(group => {
                        const groupIds = group.students.map(s => s.id);
                        const allGroupSelected = groupIds.length > 0 && groupIds.every(id => selected[id]);
                        const someGroupSelected = groupIds.some(id => selected[id]);

                        return (
                            <div key={group.name} className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <input
                                        type="checkbox"
                                        checked={allGroupSelected}
                                        ref={el => { if (el) el.indeterminate = someGroupSelected && !allGroupSelected; }}
                                        onChange={() => selectAll(groupIds)}
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary-soft"
                                    />
                                    <Badge tone={group.name.startsWith('Nursery') ? 'warm' : 'mint'}>{group.name}</Badge>
                                    <span className="text-xs text-gray-500">{group.students.length} pupils</span>
                                </div>
                                <ul className="divide-y divide-gray-50">
                                    {group.students.map(s => (
                                        <li key={s.id} className={`flex flex-col md:flex-row md:items-center gap-3 py-3 rounded-lg transition ${selected[s.id] ? 'bg-primary-soft/30 -mx-2 px-2' : ''}`}>
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    checked={!!selected[s.id]}
                                                    onChange={() => toggleSelect(s.id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary-soft"
                                                />
                                                <div className="w-9 h-9 rounded-full bg-primary-soft text-primary-dark flex items-center justify-center font-bold text-xs">
                                                    {(s.first_name?.[0] || '') + (s.last_name?.[0] || '')}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-ink truncate">{s.full_name}</div>
                                                    <div className="text-xs text-gray-400 font-mono">{s.admission_no}</div>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {ACTIONS.map(a => {
                                                    const active = actions[s.id] === a.code;
                                                    return (
                                                        <button
                                                            key={a.code}
                                                            onClick={() => setAction(s.id, a.code)}
                                                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition ${
                                                                active ? a.tone + ' shadow-sm' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                                            }`}
                                                        >
                                                            {a.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Run */}
            <div className="mt-8 sticky bottom-4 z-10 bg-white border border-gray-100 shadow-card-lg rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-gray-600">
                    <span className="font-bold text-ink">{students.length}</span> pupils ready · {counts.promote} promote · {counts.repeat} repeat · {counts.graduate} graduate · {counts.withdraw} withdraw
                </div>
                <Button onClick={run} disabled={running || students.length === 0}>
                    {running ? 'Running…' : 'Run promotion'}
                </Button>
            </div>

            {result && (
                <div className="mt-6 bg-primary-soft border border-primary/30 rounded-2xl p-5 text-sm">
                    <strong className="primary-dark">Promotion complete.</strong>
                    <div className="mt-1 text-ink">
                        {result.summary?.promoted} promoted · {result.summary?.repeated} repeated · {result.summary?.graduated} graduated · {result.summary?.withdrawn} withdrawn.
                        {(result.summary?.errors || 0) > 0 && <span className="text-rose-700"> · {result.summary.errors} errors</span>}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">{result.from_session} → {result.to_session}. The new session is now current.</div>
                </div>
            )}
        </>
    );
};

const Tally = ({ label, count, total, bg }) => (
    <div className={`rounded-xl p-4 ${bg}`}>
        <div className="text-xs font-semibold opacity-80">{label}</div>
        <div className="text-2xl font-black mt-1">
            {count}<span className="text-sm font-medium opacity-60"> / {total}</span>
        </div>
    </div>
);

export default Promotion;
