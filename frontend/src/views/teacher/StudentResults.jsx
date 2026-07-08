import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Check, Save } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Select } from '../../components/ui/Field';
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

const draftKey = (studentId, termId) => `bls.draft.results.${studentId}.${termId}`;

/**
 * Enter every subject (or nursery domain) for ONE pupil in one place, instead
 * of switching subject-by-subject across the whole class. Each row saves
 * independently the moment its "Save" button is clicked — there is no single
 * "submit everything" step that can be lost — so a teacher can fill in 4 of
 * 15 subjects, leave, and come back later to finish the rest without redoing
 * anything already saved. Anything typed but not yet saved is mirrored to
 * localStorage on every keystroke and restored on reload, so a crashed tab
 * or a closed browser doesn't lose in-progress typing either.
 */
const TeacherStudentResults = () => {
    const { studentId } = useParams();
    const [student, setStudent] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [terms, setTerms] = useState([]);
    const [termId, setTermId] = useState(null);
    const [rows, setRows] = useState({}); // key (subjectId or domain code) -> { ca1, ca2, exam, rating, remark, saved, saving }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [savingAll, setSavingAll] = useState(false);

    const isNursery = student?.class_section === 'nursery';

    useEffect(() => {
        axios.get(`${API_URL}/api/academics/students/${studentId}/`)
            .then(r => setStudent(r.data))
            .catch(e => setError(e.response?.data?.detail || 'Could not load this pupil — they may not be in one of your classes.'));
    }, [studentId]);

    useEffect(() => {
        axios.get(`${API_URL}/api/academics/terms/`).then(r => {
            const ts = r.data || [];
            setTerms(ts);
            const current = ts.find(t => t.is_current) || ts[0];
            if (current) setTermId(current.id);
        });
    }, []);

    useEffect(() => {
        if (!student?.class_section) return;
        if (student.class_section === 'nursery') return;
        axios.get(`${API_URL}/api/academics/subjects/`, { params: { section: student.class_section } })
            .then(r => setSubjects(r.data || []));
    }, [student?.class_section]);

    const load = useCallback(() => {
        if (!student || !termId) return;
        setLoading(true);

        const draft = JSON.parse(localStorage.getItem(draftKey(studentId, termId)) || '{}');

        if (isNursery) {
            axios.get(`${API_URL}/api/academics/assessments/`, { params: { student: studentId, term: termId } })
                .then(r => {
                    const existing = r.data || [];
                    const init = {};
                    NURSERY_DOMAINS.forEach(d => {
                        const rec = existing.find(a => a.domain === d.code);
                        init[d.code] = rec
                            ? { rating: rec.rating, remark: rec.remark || '', saved: true }
                            : { rating: draft[d.code]?.rating || 'G', remark: draft[d.code]?.remark || '', saved: false };
                    });
                    setRows(init);
                }).finally(() => setLoading(false));
        } else {
            axios.get(`${API_URL}/api/academics/grades/`, { params: { student: studentId, term: termId } })
                .then(r => {
                    const existing = r.data || [];
                    const init = {};
                    subjects.forEach(s => {
                        const rec = existing.find(g => g.subject === s.id);
                        init[s.id] = rec
                            ? { ca1: rec.ca1, ca2: rec.ca2, exam: rec.exam, remark: rec.remark || '', saved: true }
                            : { ca1: draft[s.id]?.ca1 ?? 0, ca2: draft[s.id]?.ca2 ?? 0, exam: draft[s.id]?.exam ?? 0, remark: draft[s.id]?.remark || '', saved: false };
                    });
                    setRows(init);
                }).finally(() => setLoading(false));
        }
    }, [student, termId, subjects, isNursery, studentId]);

    useEffect(load, [load]);

    // Mirror unsaved edits to localStorage so a closed tab or crash doesn't lose them.
    useEffect(() => {
        if (!termId || !Object.keys(rows).length) return;
        const unsaved = Object.fromEntries(Object.entries(rows).filter(([, v]) => !v.saved));
        if (Object.keys(unsaved).length) {
            localStorage.setItem(draftKey(studentId, termId), JSON.stringify(unsaved));
        } else {
            localStorage.removeItem(draftKey(studentId, termId));
        }
    }, [rows, termId, studentId]);

    const set = (key, k, v) => setRows(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [k]: v, saved: false } }));

    const saveOne = async (key) => {
        setRows(prev => ({ ...prev, [key]: { ...prev[key], saving: true } }));
        try {
            if (isNursery) {
                await axios.post(`${API_URL}/api/academics/assessments/bulk/`, {
                    term: termId, domain: key,
                    rows: [{ student: Number(studentId), rating: rows[key]?.rating || 'G', remark: rows[key]?.remark || '' }],
                });
            } else {
                await axios.post(`${API_URL}/api/academics/grades/bulk/`, {
                    subject: key, term: termId,
                    rows: [{
                        student: Number(studentId),
                        ca1: Number(rows[key]?.ca1 || 0), ca2: Number(rows[key]?.ca2 || 0), exam: Number(rows[key]?.exam || 0),
                        remark: rows[key]?.remark || '',
                    }],
                });
            }
            setRows(prev => ({ ...prev, [key]: { ...prev[key], saving: false, saved: true } }));
        } catch (e) {
            setRows(prev => ({ ...prev, [key]: { ...prev[key], saving: false } }));
            alert(`Could not save: ${e.response?.data?.error || e.message}`);
        }
    };

    const saveAllFilled = async () => {
        setSavingAll(true);
        const keys = Object.keys(rows).filter(k => !rows[k].saved);
        for (const key of keys) {
            await saveOne(key);
        }
        setSavingAll(false);
    };

    const unsavedCount = Object.values(rows).filter(r => !r.saved).length;
    const savedCount = Object.values(rows).length - unsavedCount;

    if (error) return <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-sm text-rose-600">{error}</div>;
    if (!student) return <div className="py-16 text-center text-gray-400 text-sm">Loading pupil…</div>;

    return (
        <>
            <Link to="/teacher/class" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mb-4">
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} /> Back to class
            </Link>

            <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                    <Badge tone={isNursery ? 'warm' : 'mint'} dot>{student.class_name}</Badge>
                    <h1 className="mt-3 text-2xl md:text-3xl font-black text-ink">{student.full_name}</h1>
                    <p className="mt-1 text-sm text-gray-500 font-mono">{student.admission_no}</p>
                </div>
            </header>

            <div className="sticky top-16 z-10 bg-white rounded-2xl border border-gray-100 shadow-card p-4 mb-4 flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1 max-w-xs">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Term</label>
                    <Select value={termId || ''} onChange={e => setTermId(Number(e.target.value))}>
                        {terms.map(t => (
                            <option key={t.id} value={t.id}>{t.name} — {t.session_name}{t.is_current ? ' (current)' : ''}</option>
                        ))}
                    </Select>
                </div>
                <div className="flex items-center gap-3 sm:ml-auto">
                    <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                        {savedCount}/{savedCount + unsavedCount} saved
                    </span>
                    <Button size="sm" onClick={saveAllFilled} disabled={savingAll || !unsavedCount}>
                        <Save className="w-4 h-4" strokeWidth={2} />
                        {savingAll ? 'Saving…' : `Save all (${unsavedCount})`}
                    </Button>
                </div>
            </div>

            <p className="text-xs text-gray-500 mb-4">
                Fill in as many {isNursery ? 'domains' : 'subjects'} as you have ready — each one saves on its own, so you can leave and come back for the rest without losing anything already saved.
            </p>

            {loading ? (
                <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-white border border-gray-100 rounded-2xl animate-pulse" />)}</div>
            ) : (
                <ul className="space-y-2">
                    {isNursery ? (
                        NURSERY_DOMAINS.map(d => {
                            const r = rows[d.code] || {};
                            return (
                                <li key={d.code} className={`bg-white rounded-2xl border p-4 flex flex-col md:flex-row md:items-center gap-3 ${r.saved ? 'border-primary-soft' : 'border-gray-100'}`}>
                                    <div className="w-44 shrink-0 flex items-center gap-2">
                                        {r.saved && <Check className="w-4 h-4 text-primary shrink-0" strokeWidth={2.5} />}
                                        <span className="font-semibold text-ink text-sm">{d.label}</span>
                                    </div>
                                    <div className="flex gap-1 flex-wrap">
                                        {RATING_OPTIONS.map(opt => (
                                            <button key={opt.code} onClick={() => set(d.code, 'rating', opt.code)}
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${r.rating === opt.code ? opt.color : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                                                {opt.code}
                                            </button>
                                        ))}
                                    </div>
                                    <input value={r.remark || ''} onChange={e => set(d.code, 'remark', e.target.value)} placeholder="optional comment"
                                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary flex-1 min-w-0" />
                                    <Button size="sm" variant={r.saved ? 'outline' : 'primary'} onClick={() => saveOne(d.code)} disabled={r.saving} className="shrink-0">
                                        {r.saving ? 'Saving…' : r.saved ? 'Saved' : 'Save'}
                                    </Button>
                                </li>
                            );
                        })
                    ) : (
                        subjects.map(s => {
                            const r = rows[s.id] || {};
                            const total = Number(r.ca1 || 0) + Number(r.ca2 || 0) + Number(r.exam || 0);
                            return (
                                <li key={s.id} className={`bg-white rounded-2xl border p-4 flex flex-col md:flex-row md:items-center gap-3 ${r.saved ? 'border-primary-soft' : 'border-gray-100'}`}>
                                    <div className="w-36 shrink-0 flex items-center gap-2">
                                        {r.saved && <Check className="w-4 h-4 text-primary shrink-0" strokeWidth={2.5} />}
                                        <span className="font-semibold text-ink text-sm">{s.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <NumField label="CA1" max={20} value={r.ca1} onChange={v => set(s.id, 'ca1', v)} />
                                        <NumField label="CA2" max={20} value={r.ca2} onChange={v => set(s.id, 'ca2', v)} />
                                        <NumField label="Exam" max={60} value={r.exam} onChange={v => set(s.id, 'exam', v)} />
                                        <div className="text-center px-2">
                                            <div className="font-bold text-ink text-sm">{total}</div>
                                            <div className="text-[10px]">/100</div>
                                        </div>
                                    </div>
                                    <input value={r.remark || ''} onChange={e => set(s.id, 'remark', e.target.value)} placeholder="optional comment"
                                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary flex-1 min-w-0" />
                                    <Button size="sm" variant={r.saved ? 'outline' : 'primary'} onClick={() => saveOne(s.id)} disabled={r.saving} className="shrink-0">
                                        {r.saving ? 'Saving…' : r.saved ? 'Saved' : 'Save'}
                                    </Button>
                                </li>
                            );
                        })
                    )}
                </ul>
            )}
        </>
    );
};

const NumField = ({ label, max, value, onChange }) => (
    <label className="flex flex-col items-center">
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
        <input type="number" min={0} max={max} value={value ?? 0} onChange={e => onChange(e.target.value)}
            className="w-14 text-center text-sm px-1.5 py-1 border border-gray-200 rounded-lg focus:outline-none focus:border-primary" />
    </label>
);

export default TeacherStudentResults;
