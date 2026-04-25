import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Select } from '../../components/ui/Field';
import useTeacherClass from '../../context/useTeacherClass';
import API_URL from '../../config/api';

const RATING_OPTIONS = [
    { code: 'E',  label: 'Excellent',          color: 'bg-primary text-white' },
    { code: 'VG', label: 'Very Good',          color: 'bg-emerald-400 text-white' },
    { code: 'G',  label: 'Good',               color: 'bg-amber-400 text-white' },
    { code: 'F',  label: 'Fair',               color: 'bg-orange-400 text-white' },
    { code: 'NI', label: 'Needs Improvement',  color: 'bg-rose-400 text-white' },
];

const NURSERY_DOMAINS = [
    { code: 'literacy', label: 'Literacy Readiness' },
    { code: 'numeracy', label: 'Numeracy Readiness' },
    { code: 'social', label: 'Social Development' },
    { code: 'emotional', label: 'Emotional Development' },
    { code: 'motor', label: 'Motor Skills' },
    { code: 'creative', label: 'Creative Arts' },
    { code: 'participation', label: 'Class Participation' },
    { code: 'behavior', label: 'Behaviour' },
];

const TeacherGrades = () => {
    const { classLevel, loading: tLoading } = useTeacherClass();
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [terms, setTerms] = useState([]);
    const [currentTermId, setCurrentTermId] = useState(null);
    const [subjectId, setSubjectId] = useState(null);       // basic only
    const [domain, setDomain] = useState(NURSERY_DOMAINS[0].code); // nursery only
    const [termId, setTermId] = useState(null);
    const [rows, setRows] = useState({}); // studentId -> input state
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(null);

    const isNursery = classLevel?.section === 'nursery';

    // Load shared reference data once
    useEffect(() => {
        if (!classLevel?.id) return;
        Promise.all([
            axios.get(`${API_URL}/api/academics/students/`, { params: { class_level: classLevel.id, status: 'active' } }),
            axios.get(`${API_URL}/api/academics/subjects/`, { params: { section: classLevel.section } }),
            axios.get(`${API_URL}/api/academics/terms/`),
        ]).then(([sRes, subRes, tRes]) => {
            setStudents(sRes.data || []);
            const subs = subRes.data || [];
            setSubjects(subs);
            if (subs.length && !subjectId) setSubjectId(String(subs[0].id));
            const ts = tRes.data || [];
            setTerms(ts);
            const current = ts.find(t => t.is_current) || ts[0];
            if (current) {
                setCurrentTermId(current.id);
                setTermId(current.id);
            }
        });
    }, [classLevel?.id]);

    // Load existing entries whenever selection changes
    const load = useCallback(() => {
        if (!students.length || !termId) return;
        setLoading(true);
        setSaved(null);

        if (isNursery) {
            axios.get(`${API_URL}/api/academics/assessments/`, { params: { class_level: classLevel.id, term: termId } })
                .then(r => {
                    const all = r.data || [];
                    const init = {};
                    students.forEach(s => {
                        const rec = all.find(a => a.student === s.id && a.domain === domain);
                        init[s.id] = { rating: rec?.rating || 'G', remark: rec?.remark || '' };
                    });
                    setRows(init);
                }).finally(() => setLoading(false));
        } else {
            if (!subjectId) { setLoading(false); return; }
            axios.get(`${API_URL}/api/academics/grades/`, { params: { class_level: classLevel.id, subject: subjectId, term: termId } })
                .then(r => {
                    const all = r.data || [];
                    const init = {};
                    students.forEach(s => {
                        const rec = all.find(g => g.student === s.id);
                        init[s.id] = {
                            ca1: rec?.ca1 ?? 0,
                            ca2: rec?.ca2 ?? 0,
                            exam: rec?.exam ?? 0,
                            remark: rec?.remark || '',
                        };
                    });
                    setRows(init);
                }).finally(() => setLoading(false));
        }
    }, [students, termId, subjectId, domain, isNursery, classLevel?.id]);

    useEffect(load, [load]);

    const set = (id, k, v) => setRows(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [k]: v } }));

    const save = async () => {
        setSaving(true);
        setSaved(null);
        try {
            if (isNursery) {
                const payload = {
                    term: termId,
                    domain,
                    rows: students.map(s => ({
                        student: s.id,
                        rating: rows[s.id]?.rating || 'G',
                        remark: rows[s.id]?.remark || '',
                    })),
                };
                const { data } = await axios.post(`${API_URL}/api/academics/assessments/bulk/`, payload);
                setSaved({ ok: true, saved: data.saved });
            } else {
                const payload = {
                    subject: subjectId, term: termId,
                    rows: students.map(s => ({
                        student: s.id,
                        ca1: Number(rows[s.id]?.ca1 || 0),
                        ca2: Number(rows[s.id]?.ca2 || 0),
                        exam: Number(rows[s.id]?.exam || 0),
                        remark: rows[s.id]?.remark || '',
                    })),
                };
                const { data } = await axios.post(`${API_URL}/api/academics/grades/bulk/`, payload);
                setSaved({ ok: true, saved: data.saved });
            }
            load();
        } catch (e) {
            setSaved({ ok: false, error: e.response?.data?.error || e.message });
        } finally {
            setSaving(false);
        }
    };

    const summary = useMemo(() => {
        if (isNursery) return null;
        const totals = students.map(s => (Number(rows[s.id]?.ca1 || 0) + Number(rows[s.id]?.ca2 || 0) + Number(rows[s.id]?.exam || 0)));
        const avg = totals.length ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : 0;
        return { avg, max: Math.max(...totals, 0), min: Math.min(...totals, 0) };
    }, [rows, students, isNursery]);

    if (tLoading) return <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>;
    if (!classLevel) return <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-sm text-gray-500">No class assigned.</div>;

    return (
        <>
            <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                    <Badge tone={isNursery ? 'warm' : 'mint'} dot>{classLevel.name}</Badge>
                    <h1 className="mt-3 text-2xl md:text-3xl font-black text-ink">{isNursery ? 'Developmental Assessment' : 'Grade Entry'}</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {isNursery
                            ? 'Rate each pupil per domain on a 5-point scale. Comments are optional.'
                            : 'Enter CA1 (0–20), CA2 (0–20), and Exam (0–60). Totals and letter grades are computed automatically.'}
                    </p>
                </div>
                <Button size="sm" onClick={save} disabled={saving || !students.length}>{saving ? 'Saving…' : 'Save entries'}</Button>
            </header>

            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 grid md:grid-cols-3 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Term</label>
                    <Select value={termId || ''} onChange={e => setTermId(Number(e.target.value))}>
                        {terms.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.name} — {t.session_name}{t.is_current ? ' (current)' : ''}
                            </option>
                        ))}
                    </Select>
                </div>
                {isNursery ? (
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Domain</label>
                        <Select value={domain} onChange={e => setDomain(e.target.value)}>
                            {NURSERY_DOMAINS.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
                        </Select>
                    </div>
                ) : (
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Subject</label>
                        <Select value={subjectId || ''} onChange={e => setSubjectId(e.target.value)}>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                    </div>
                )}
            </div>

            {!isNursery && summary && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <Tile label="Class Average" value={`${summary.avg}/100`} tone="bg-primary-soft" accent="text-primary-dark" />
                    <Tile label="Highest" value={`${summary.max}/100`} tone="bg-emerald-50" accent="text-emerald-700" />
                    <Tile label="Lowest" value={`${summary.min}/100`} tone="bg-amber-50" accent="text-amber-700" />
                </div>
            )}

            {saved && (
                <div className={`rounded-xl p-3 mb-4 text-sm ${saved.ok ? 'bg-primary-soft text-primary-dark' : 'bg-rose-50 text-rose-700'}`}>
                    {saved.ok ? `Saved ${saved.saved} entries.` : `Save failed: ${saved.error}`}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
                {loading ? (
                    <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />)}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                    <th className="text-left px-4 py-3">Pupil</th>
                                    {isNursery ? (
                                        <>
                                            <th className="text-left px-4 py-3">Rating</th>
                                            <th className="text-left px-4 py-3">Comment</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="text-center px-3 py-3 w-20">CA1 / 20</th>
                                            <th className="text-center px-3 py-3 w-20">CA2 / 20</th>
                                            <th className="text-center px-3 py-3 w-20">Exam / 60</th>
                                            <th className="text-center px-3 py-3 w-20">Total</th>
                                            <th className="text-left px-3 py-3 w-40">Comment</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => {
                                    const r = rows[s.id] || {};
                                    const total = isNursery ? 0 : (Number(r.ca1 || 0) + Number(r.ca2 || 0) + Number(r.exam || 0));
                                    return (
                                        <tr key={s.id} className="border-b border-gray-50 hover:bg-primary-soft/20">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-primary-soft text-primary-dark flex items-center justify-center font-bold text-xs">
                                                        {(s.first_name?.[0] || '') + (s.last_name?.[0] || '')}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-ink">{s.full_name}</div>
                                                        <div className="text-xs text-gray-400 font-mono">{s.admission_no}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            {isNursery ? (
                                                <>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-1 flex-wrap">
                                                            {RATING_OPTIONS.map(opt => (
                                                                <button key={opt.code} onClick={() => set(s.id, 'rating', opt.code)}
                                                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                                                                        r.rating === opt.code ? opt.color : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                                                    }`}>{opt.code}</button>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input value={r.remark || ''} onChange={e => set(s.id, 'remark', e.target.value)}
                                                            placeholder="optional"
                                                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary w-full" />
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-3 py-3 text-center">
                                                        <input type="number" min={0} max={20} value={r.ca1 || 0} onChange={e => set(s.id, 'ca1', e.target.value)}
                                                            className="w-16 text-center text-sm px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:border-primary" />
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <input type="number" min={0} max={20} value={r.ca2 || 0} onChange={e => set(s.id, 'ca2', e.target.value)}
                                                            className="w-16 text-center text-sm px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:border-primary" />
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <input type="number" min={0} max={60} value={r.exam || 0} onChange={e => set(s.id, 'exam', e.target.value)}
                                                            className="w-16 text-center text-sm px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:border-primary" />
                                                    </td>
                                                    <td className="px-3 py-3 text-center font-bold text-ink">{total}</td>
                                                    <td className="px-3 py-3">
                                                        <input value={r.remark || ''} onChange={e => set(s.id, 'remark', e.target.value)} placeholder="optional"
                                                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary w-full" />
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
};

const Tile = ({ label, value, tone, accent }) => (
    <div className={`rounded-xl p-4 ${tone}`}>
        <div className="text-xs font-semibold text-gray-500">{label}</div>
        <div className={`text-2xl font-black mt-1 ${accent}`}>{value}</div>
    </div>
);

export default TeacherGrades;
