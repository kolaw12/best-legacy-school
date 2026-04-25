import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import useTeacherClass from '../../context/useTeacherClass';
import API_URL from '../../config/api';

const STATUS_OPTIONS = [
    { code: 'present', label: 'Present', color: 'bg-primary text-white' },
    { code: 'absent',  label: 'Absent',  color: 'bg-secondary text-ink' },
    { code: 'late',    label: 'Late',    color: 'bg-amber-400 text-white' },
    { code: 'excused', label: 'Excused', color: 'bg-gray-300 text-ink' },
];

const today = () => new Date().toISOString().slice(0, 10);
const yesterdayOf = (d) => {
    const x = new Date(d);
    x.setDate(x.getDate() - 1);
    return x.toISOString().slice(0, 10);
};

const TeacherAttendance = () => {
    const { classLevel, loading: tLoading } = useTeacherClass();
    const [date, setDate] = useState(today());
    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState({});
    const [yesterdayMarks, setYesterdayMarks] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(null);
    const [dirty, setDirty] = useState(false);

    const load = useCallback(() => {
        if (!classLevel?.id) return;
        setLoading(true);
        setSaved(null);
        setDirty(false);
        Promise.all([
            axios.get(`${API_URL}/api/academics/students/`, { params: { class_level: classLevel.id, status: 'active' } }),
            axios.get(`${API_URL}/api/academics/attendance/`, { params: { class_level: classLevel.id, date } }),
            axios.get(`${API_URL}/api/academics/attendance/`, { params: { class_level: classLevel.id, date: yesterdayOf(date) } }),
        ])
            .then(([sRes, aRes, yRes]) => {
                const roster = sRes.data || [];
                const existing = aRes.data || [];
                const yesterday = yRes.data || [];
                const m = {};
                const ym = {};
                roster.forEach(s => {
                    const rec = existing.find(r => r.student === s.id);
                    m[s.id] = { status: rec?.status || 'present', note: rec?.note || '' };
                    const yrec = yesterday.find(r => r.student === s.id);
                    if (yrec) ym[s.id] = yrec.status;
                });
                setStudents(roster);
                setMarks(m);
                setYesterdayMarks(ym);
            })
            .finally(() => setLoading(false));
    }, [classLevel?.id, date]);

    useEffect(load, [load]);

    const setStatus = (id, status) => { setDirty(true); setMarks(m => ({ ...m, [id]: { ...(m[id] || {}), status } })); };
    const setNote = (id, note) => { setDirty(true); setMarks(m => ({ ...m, [id]: { ...(m[id] || {}), note } })); };
    const setAllTo = (status) => {
        setDirty(true);
        const fresh = {};
        students.forEach(s => { fresh[s.id] = { status, note: marks[s.id]?.note || '' }; });
        setMarks(fresh);
    };
    const yesterdayCounts = Object.values(yesterdayMarks).reduce((acc, st) => {
        acc[st] = (acc[st] || 0) + 1;
        return acc;
    }, {});
    const yesterdayHasData = Object.keys(yesterdayMarks).length > 0;

    const counts = useMemo(() => {
        const c = { present: 0, absent: 0, late: 0, excused: 0 };
        Object.values(marks).forEach(m => { c[m.status] = (c[m.status] || 0) + 1; });
        return c;
    }, [marks]);

    const rate = students.length ? Math.round(((counts.present + counts.late) / students.length) * 100) : 0;

    const save = async () => {
        const todayISO = today();
        const daysAgo = Math.round((new Date(todayISO) - new Date(date)) / 86400000);
        if (daysAgo > 1) {
            const ok = confirm(
                `You are saving attendance for ${new Date(date).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })} ` +
                `(${daysAgo} days ago). This will overwrite any existing records for that day. Continue?`
            );
            if (!ok) return;
        }
        setSaving(true);
        try {
            const { data } = await axios.post(`${API_URL}/api/academics/attendance/bulk/`, {
                class_level: classLevel.id,
                date,
                records: students.map(s => ({
                    student: s.id,
                    status: marks[s.id]?.status || 'present',
                    note: marks[s.id]?.note || '',
                })),
            });
            setSaved({ ok: true, ...data });
            setDirty(false);
        } catch (e) {
            setSaved({ ok: false, error: e.response?.data?.error || e.message });
        } finally {
            setSaving(false);
        }
    };

    if (tLoading) return <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>;
    if (!classLevel) {
        return <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-sm text-gray-500">No class assigned. Ask an admin to assign you a class.</div>;
    }

    return (
        <>
            <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                    <Badge tone="mint" dot>{classLevel.name}</Badge>
                    <h1 className="mt-3 text-2xl md:text-3xl font-black text-ink">Attendance</h1>
                    <p className="mt-1 text-sm text-gray-500">Mark your class for {new Date(date).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
                </div>
                <div className="flex gap-2">
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44" />
                    <Button size="sm" onClick={save} disabled={saving || !students.length}>{saving ? 'Saving…' : 'Save'}</Button>
                </div>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <Tile label="Roster" value={students.length} />
                <Tile label="Present" value={counts.present} tone="bg-primary-soft" accent="text-primary-dark" />
                <Tile label="Absent" value={counts.absent} tone="bg-secondary-soft" accent="text-secondary-dark" />
                <Tile label="Late" value={counts.late} tone="bg-amber-50" accent="text-amber-700" />
                <Tile label="Rate" value={`${rate}%`} tone="bg-ink" accent="text-white" whiteLabel />
            </div>

            {yesterdayHasData && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-bold uppercase tracking-widest text-indigo-700">Yesterday</span>
                    <span className="text-indigo-900">
                        {yesterdayCounts.present || 0} present · {yesterdayCounts.absent || 0} absent
                        {yesterdayCounts.late ? ` · ${yesterdayCounts.late} late` : ''}
                        {yesterdayCounts.excused ? ` · ${yesterdayCounts.excused} excused` : ''}
                    </span>
                    <span className="text-indigo-500/70 ml-auto">For context — chronic absentees show below</span>
                </div>
            )}

            <div className="flex gap-2 mb-4">
                <button onClick={() => setAllTo('present')} className="text-xs font-semibold px-4 py-2 rounded-full bg-primary-soft text-primary-dark hover:bg-primary hover:text-white transition">
                    Mark all present
                </button>
                <button onClick={() => setAllTo('absent')} className="text-xs font-semibold px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                    Mark all absent
                </button>
            </div>

            {saved && (
                <div className={`rounded-xl p-3 mb-4 text-sm ${saved.ok ? 'bg-primary-soft text-primary-dark' : 'bg-rose-50 text-rose-700'}`}>
                    {saved.ok ? `Saved ${saved.saved} records.` : `Save failed: ${saved.error}`}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
                {loading ? (
                    <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />)}</div>
                ) : students.length === 0 ? (
                    <div className="p-16 text-center text-sm text-gray-500">No pupils in this class yet.</div>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {students.map(s => {
                            const cur = marks[s.id]?.status || 'present';
                            return (
                                <li key={s.id} className="flex flex-col md:flex-row md:items-center gap-3 p-4 hover:bg-primary-soft/20 transition">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-primary-soft text-primary-dark flex items-center justify-center font-bold text-xs">
                                            {(s.first_name?.[0] || '') + (s.last_name?.[0] || '')}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-ink truncate flex items-center gap-2">
                                                {s.full_name}
                                                {yesterdayMarks[s.id] === 'absent' && (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">Absent yest.</span>
                                                )}
                                                {yesterdayMarks[s.id] === 'late' && (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Late yest.</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400 font-mono">{s.admission_no}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {STATUS_OPTIONS.map(opt => (
                                            <button key={opt.code} onClick={() => setStatus(s.id, opt.code)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                                                    cur === opt.code ? opt.color + ' shadow-sm' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                                }`}>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    {cur !== 'present' && (
                                        <input placeholder="note (optional)" value={marks[s.id]?.note || ''} onChange={e => setNote(s.id, e.target.value)}
                                               className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary w-full md:w-44" />
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Sticky bottom save bar — visible on mobile so teachers don't have to scroll back up */}
            {students.length > 0 && (
                <div className="md:hidden fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 flex items-center gap-3 shadow-lg">
                    <div className="flex-1 min-w-0">
                        <div className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">{students.length} pupils · {rate}% rate</div>
                        <div className="text-xs text-ink font-medium">
                            {dirty ? 'Unsaved changes' : (saved?.ok ? `Saved ${saved.saved} records` : 'All up to date')}
                        </div>
                    </div>
                    <Button size="sm" onClick={save} disabled={saving || !students.length}>
                        {saving ? 'Saving…' : 'Save'}
                    </Button>
                </div>
            )}
            {students.length > 0 && <div className="md:hidden h-20" aria-hidden />}
        </>
    );
};

const Tile = ({ label, value, tone = 'bg-white border border-gray-100', accent = 'text-ink', whiteLabel = false }) => (
    <div className={`rounded-xl p-4 ${tone}`}>
        <div className={`text-xs font-semibold ${whiteLabel ? 'text-white/70' : 'text-gray-500'}`}>{label}</div>
        <div className={`text-2xl font-black mt-1 ${accent}`}>{value}</div>
    </div>
);

export default TeacherAttendance;
