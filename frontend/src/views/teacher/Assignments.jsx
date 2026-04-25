import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Field, { Input, Select, Textarea } from '../../components/ui/Field';
import Reveal from '../../components/ui/Reveal';
import useTeacherClass from '../../context/useTeacherClass';
import API_URL from '../../config/api';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const TeacherAssignments = () => {
    const { teacher, classLevel, loading: tLoading } = useTeacherClass();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [terms, setTerms] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [createOpen, setCreateOpen] = useState(false);
    const [reviewing, setReviewing] = useState(null);

    const load = useCallback(() => {
        if (!classLevel?.id) return;
        setLoading(true);
        axios.get(`${API_URL}/api/assignments/`, { params: { class_level: classLevel.id } })
            .then(r => setAssignments(r.data || []))
            .finally(() => setLoading(false));
    }, [classLevel?.id]);

    useEffect(load, [load]);

    useEffect(() => {
        if (!classLevel?.id) return;
        axios.get(`${API_URL}/api/academics/terms/`).then(r => setTerms(r.data || []));
        axios.get(`${API_URL}/api/academics/subjects/`, { params: { section: classLevel.section } }).then(r => setSubjects(r.data || []));
    }, [classLevel?.id]);

    if (tLoading) return <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>;
    if (!classLevel) {
        return <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-sm text-gray-500">No class assigned.</div>;
    }

    return (
        <>
            <Reveal>
                <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                    <div>
                        <Badge tone="warm" dot>{classLevel.name}</Badge>
                        <h1 className="mt-3 text-2xl md:text-3xl font-black text-primary">Assignments</h1>
                        <p className="mt-1 text-sm text-gray-500">Set work, see who's submitted, grade quickly.</p>
                    </div>
                    <Button size="sm" onClick={() => setCreateOpen(true)}>+ New assignment</Button>
                </header>
            </Reveal>

            {loading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-white border border-gray-100 animate-pulse"/>)}</div>
            ) : assignments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-mint text-primary mx-auto flex items-center justify-center text-2xl">📝</div>
                    <h3 className="mt-3 text-lg font-bold text-ink">No assignments yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Click "+ New assignment" to set the first one for {classLevel.name}.</p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {assignments.map(a => (
                        <motion.li
                            key={a.id}
                            whileHover={{ y: -2 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-card p-5"
                        >
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-gray-500">{a.subject_name || 'Class activity'} · Due {fmtDate(a.due_date)}</div>
                                    <h4 className="mt-1 font-bold text-ink">{a.title}</h4>
                                    {a.description && <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-2">{a.description}</p>}
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-gray-500">Submissions</div>
                                    <div className="text-2xl font-black text-primary">{a.submission_count}</div>
                                </div>
                                <button
                                    onClick={() => setReviewing(a)}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition"
                                >
                                    Review & grade
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                                </button>
                            </div>
                        </motion.li>
                    ))}
                </ul>
            )}

            <CreateModal
                open={createOpen}
                classLevel={classLevel}
                terms={terms}
                subjects={subjects}
                teacher={teacher}
                onClose={() => setCreateOpen(false)}
                onSaved={load}
            />

            <ReviewModal
                assignment={reviewing}
                onClose={() => setReviewing(null)}
                onGraded={load}
            />
        </>
    );
};

const CreateModal = ({ open, onClose, onSaved, classLevel, terms, subjects, teacher }) => {
    const initial = {
        title: '', description: '', due_date: '',
        subject: '', term: '', max_score: 100,
    };
    const [form, setForm] = useState(initial);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (open) {
            const current = terms.find(t => t.is_current) || terms[0];
            setForm({ ...initial, term: current?.id || '' });
            setError(null);
        }
    }, [open, terms]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const payload = {
                ...form,
                class_level: classLevel.id,
                subject: form.subject || null,
                teacher: teacher?.id || null,
                is_published: true,
            };
            await axios.post(`${API_URL}/api/assignments/`, payload);
            onSaved?.();
            onClose?.();
        } catch (err) {
            const d = err.response?.data;
            setError(d && typeof d === 'object'
                ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')
                : err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open} onClose={onClose}
            title="New assignment"
            subtitle={`For ${classLevel.name}`}
            size="md"
            footer={[
                <Button key="cancel" variant="outline" size="sm" onClick={onClose} type="button">Cancel</Button>,
                <Button key="save" size="sm" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Publish assignment'}</Button>,
            ]}
        >
            {error && <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700 whitespace-pre-wrap">{error}</div>}
            <form onSubmit={submit} className="space-y-4">
                <Field label="Title" required>
                    <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Multiplication tables 6 to 9" required />
                </Field>
                <Field label="Description / instructions">
                    <Textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What should the pupil do?" />
                </Field>
                <div className="grid md:grid-cols-2 gap-4">
                    <Field label="Subject">
                        <Select value={form.subject} onChange={e => set('subject', e.target.value)}>
                            <option value="">— class activity —</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                    </Field>
                    <Field label="Term" required>
                        <Select value={form.term} onChange={e => set('term', e.target.value)} required>
                            {terms.map(t => <option key={t.id} value={t.id}>{t.name} — {t.session_name}{t.is_current ? ' (current)' : ''}</option>)}
                        </Select>
                    </Field>
                    <Field label="Due date">
                        <Input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
                    </Field>
                    <Field label="Max score">
                        <Input type="number" min={1} max={1000} value={form.max_score} onChange={e => set('max_score', e.target.value)} />
                    </Field>
                </div>
            </form>
        </Modal>
    );
};

const ReviewModal = ({ assignment, onClose, onGraded }) => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState({}); // submissionId -> { score, feedback }
    const [saving, setSaving] = useState(null);

    useEffect(() => {
        if (!assignment) return;
        setLoading(true);
        axios.get(`${API_URL}/api/submissions/?assignment=${assignment.id}`)
            .then(r => {
                setSubmissions(r.data || []);
                const d = {};
                (r.data || []).forEach(s => { d[s.id] = { score: s.score ?? '', feedback: s.feedback || '' }; });
                setDraft(d);
            })
            .finally(() => setLoading(false));
    }, [assignment]);

    const set = (id, k, v) => setDraft(d => ({ ...d, [id]: { ...(d[id] || {}), [k]: v } }));

    const grade = async (sub) => {
        setSaving(sub.id);
        try {
            const { data } = await axios.post(`${API_URL}/api/submissions/${sub.id}/grade/`, {
                score: draft[sub.id]?.score,
                feedback: draft[sub.id]?.feedback || '',
            });
            setSubmissions(prev => prev.map(s => s.id === sub.id ? data : s));
            onGraded?.();
        } catch (e) {
            alert(`Could not grade: ${e.response?.data?.error || e.message}`);
        } finally {
            setSaving(null);
        }
    };

    if (!assignment) return null;

    return (
        <Modal
            open={!!assignment} onClose={onClose}
            title={assignment.title}
            subtitle={`${assignment.subject_name || 'Class activity'} · Due ${fmtDate(assignment.due_date)} · Max ${assignment.max_score}`}
            size="lg"
        >
            {loading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse"/>)}</div>
            ) : submissions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">No pupils have submitted yet.</p>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {submissions.map(s => (
                        <li key={s.id} className="py-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 rounded-full bg-primary-soft text-primary-dark flex items-center justify-center font-bold text-xs">
                                    {(s.student_name || '?').split(' ').map(p => p[0]).slice(0, 2).join('')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-ink">{s.student_name}</div>
                                    <div className="text-xs text-gray-400 font-mono">{s.admission_no}</div>
                                </div>
                                <Badge tone={s.status === 'graded' ? 'mint' : 'neutral'}>{s.status}</Badge>
                            </div>
                            {s.text && (
                                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 mb-3">{s.text}</div>
                            )}
                            <div className="grid sm:grid-cols-3 gap-3 items-end">
                                <Field label={`Score (out of ${assignment.max_score})`}>
                                    <Input
                                        type="number" min={0} max={assignment.max_score}
                                        value={draft[s.id]?.score ?? ''}
                                        onChange={e => set(s.id, 'score', e.target.value)}
                                    />
                                </Field>
                                <Field label="Feedback" className="sm:col-span-2">
                                    <Input value={draft[s.id]?.feedback || ''} onChange={e => set(s.id, 'feedback', e.target.value)} placeholder="One-line note for the pupil and parent" />
                                </Field>
                            </div>
                            <div className="mt-3 flex justify-end">
                                <Button size="sm" onClick={() => grade(s)} disabled={saving === s.id}>
                                    {saving === s.id ? 'Saving…' : (s.status === 'graded' ? 'Update grade' : 'Save grade')}
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Modal>
    );
};

export default TeacherAssignments;
