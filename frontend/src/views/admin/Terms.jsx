import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CalendarDays, Check } from 'lucide-react';
import AdminPageHeader from '../../components/admin/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Field, { Input } from '../../components/ui/Field';
import API_URL from '../../config/api';

const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const TermsPage = () => {
    const [sessions, setSessions] = useState([]);
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sessionModalOpen, setSessionModalOpen] = useState(false);
    const [editingTerm, setEditingTerm] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(() => {
        setLoading(true);
        Promise.all([
            axios.get(`${API_URL}/api/academics/sessions/`),
            axios.get(`${API_URL}/api/academics/terms/`),
        ]).then(([sRes, tRes]) => {
            setSessions(sRes.data || []);
            setTerms(tRes.data || []);
        }).finally(() => setLoading(false));
    }, []);

    useEffect(load, [load]);

    const termsBySession = useMemo(() => {
        const map = {};
        for (const t of terms) (map[t.session] ||= []).push(t);
        for (const list of Object.values(map)) list.sort((a, b) => a.start_date.localeCompare(b.start_date));
        return map;
    }, [terms]);

    const setCurrentSession = async (session) => {
        setBusyId(`s${session.id}`);
        try {
            await axios.patch(`${API_URL}/api/academics/sessions/${session.id}/`, { is_current: true });
            load();
        } catch (e) {
            alert(e.response?.data?.error || 'Could not update.');
        } finally {
            setBusyId(null);
        }
    };

    const setCurrentTerm = async (term) => {
        setBusyId(`t${term.id}`);
        try {
            await axios.patch(`${API_URL}/api/academics/terms/${term.id}/`, { is_current: true });
            load();
        } catch (e) {
            alert(e.response?.data?.error || 'Could not update.');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <>
            <AdminPageHeader
                title="Sessions & Terms"
                subtitle="Add a new session when a school year starts — First, Second and Third term are created for it automatically, with even date splits you can fine-tune below. Nothing here is ever deleted, so past sessions and their results stay exactly where they are."
                actions={[
                    <Button key="add" size="sm" onClick={() => setSessionModalOpen(true)}>+ New session</Button>,
                ]}
            />

            {loading ? (
                <div className="space-y-3">
                    {[...Array(2)].map((_, i) => <div key={i} className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
                </div>
            ) : sessions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-sm text-gray-500">
                    No sessions yet — add the first one to get started.
                </div>
            ) : (
                <div className="space-y-4">
                    {sessions.map(session => (
                        <div key={session.id} className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
                            <div className="p-5 flex items-center justify-between gap-4 flex-wrap border-b border-gray-100">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-ink text-lg">{session.name}</h3>
                                        {session.is_current && <Badge tone="mint" dot>Current session</Badge>}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{fmt(session.start_date)} — {fmt(session.end_date)}</p>
                                </div>
                                {!session.is_current && (
                                    <button
                                        disabled={busyId === `s${session.id}`}
                                        onClick={() => setCurrentSession(session)}
                                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition disabled:opacity-50"
                                    >
                                        Set as current
                                    </button>
                                )}
                            </div>
                            <div className="divide-y divide-gray-50">
                                {(termsBySession[session.id] || []).map(term => (
                                    <div key={term.id} className="p-4 px-5 flex items-center justify-between gap-4 flex-wrap">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary-dark flex items-center justify-center shrink-0">
                                                <CalendarDays className="w-4 h-4" strokeWidth={2} />
                                            </span>
                                            <div>
                                                <div className="text-sm font-semibold text-ink flex items-center gap-2">
                                                    {term.name} Term
                                                    {term.is_current && <Badge tone="mint"><Check className="w-3 h-3" strokeWidth={3} /> Current</Badge>}
                                                </div>
                                                <div className="text-xs text-gray-500">{fmt(term.start_date)} — {fmt(term.end_date)}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setEditingTerm(term)}
                                                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition"
                                            >
                                                Edit dates
                                            </button>
                                            {!term.is_current && (
                                                <button
                                                    disabled={busyId === `t${term.id}`}
                                                    onClick={() => setCurrentTerm(term)}
                                                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary-soft text-primary-dark hover:bg-primary hover:text-white transition disabled:opacity-50"
                                                >
                                                    Set as current
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <NewSessionModal open={sessionModalOpen} onClose={() => setSessionModalOpen(false)} onSaved={load} />
            <EditTermModal term={editingTerm} onClose={() => setEditingTerm(null)} onSaved={load} />
        </>
    );
};

const NewSessionModal = ({ open, onClose, onSaved }) => {
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!open) return;
        setName(''); setStartDate(''); setEndDate(''); setError(null);
    }, [open]);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await axios.post(`${API_URL}/api/academics/sessions/`, {
                name, start_date: startDate, end_date: endDate, is_current: false,
            });
            onSaved?.();
            onClose?.();
        } catch (err) {
            const d = err.response?.data;
            setError(d && typeof d === 'object'
                ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')
                : 'Could not create session.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open} onClose={onClose}
            title="New session"
            subtitle="Its First, Second and Third term are created for you, split evenly across these dates."
            size="sm"
            footer={[
                <Button key="cancel" variant="outline" size="sm" onClick={onClose} type="button">Cancel</Button>,
                <Button key="save" size="sm" onClick={submit} disabled={saving}>{saving ? 'Creating…' : 'Create session'}</Button>,
            ]}
        >
            {error && <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700 whitespace-pre-wrap">{error}</div>}
            <form onSubmit={submit} className="space-y-4">
                <Field label="Session name" required hint="e.g. 2028/2029">
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="2028/2029" required />
                </Field>
                <Field label="Start date" required>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                </Field>
                <Field label="End date" required>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                </Field>
            </form>
        </Modal>
    );
};

const EditTermModal = ({ term, onClose, onSaved }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!term) return;
        setStartDate(term.start_date);
        setEndDate(term.end_date);
        setError(null);
    }, [term]);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await axios.patch(`${API_URL}/api/academics/terms/${term.id}/`, { start_date: startDate, end_date: endDate });
            onSaved?.();
            onClose?.();
        } catch (err) {
            const d = err.response?.data;
            setError(d && typeof d === 'object'
                ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')
                : 'Could not save.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={!!term} onClose={onClose}
            title={term ? `Edit ${term.name} Term dates` : ''}
            subtitle={term?.session_name}
            size="sm"
            footer={[
                <Button key="cancel" variant="outline" size="sm" onClick={onClose} type="button">Cancel</Button>,
                <Button key="save" size="sm" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>,
            ]}
        >
            {error && <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700 whitespace-pre-wrap">{error}</div>}
            <form onSubmit={submit} className="space-y-4">
                <Field label="Start date" required>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                </Field>
                <Field label="End date" required>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                </Field>
            </form>
        </Modal>
    );
};

export default TermsPage;
