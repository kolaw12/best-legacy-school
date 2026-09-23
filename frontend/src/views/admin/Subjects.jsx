import { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, Plus } from 'lucide-react';
import AdminPageHeader from '../../components/admin/PageHeader';
import BulkActionBar from '../../components/admin/BulkActionBar';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Field, { Input, Select } from '../../components/ui/Field';
import useRowSelection from '../../hooks/useRowSelection';
import adminApi from '../../config/adminApi';
import API_URL from '../../config/api';

const SubjectsPage = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirm, setConfirm] = useState(null); // { rows: [...] } | null
    const [busy, setBusy] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const load = () => {
        setLoading(true);
        adminApi.subjects()
            .then(r => setRows(Array.isArray(r.data) ? r.data : r.data.results || []))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const selection = useRowSelection(rows);

    const removeMany = async (toRemove) => {
        setBusy(true);
        const failed = [];
        for (const row of toRemove) {
            try {
                await axios.delete(`${API_URL}/api/academics/subjects/${row.id}/`);
                setRows(rs => rs.filter(r => r.id !== row.id));
            } catch (e) {
                failed.push(`${row.name}: ${e.response?.data?.error || 'failed'}`);
            }
        }
        selection.clear();
        setBusy(false);
        setConfirm(null);
        if (failed.length) alert(`Some subjects couldn't be moved to the trash:\n\n${failed.join('\n')}`);
    };

    const kg = rows.filter(r => r.section === 'kg');
    const nursery = rows.filter(r => r.section === 'nursery');
    const basic = rows.filter(r => r.section === 'basic');

    return (
        <>
            <AdminPageHeader
                title="Subjects"
                subtitle="KG focuses on early learning. Nursery builds developmental skills. Primary follows the Nigerian curriculum."
                actions={[
                    <BulkActionBar
                        key="bulk"
                        count={selection.selectedRows.length}
                        label="Move to trash"
                        onAction={() => setConfirm({ rows: selection.selectedRows })}
                    />,
                    <Button key="add" size="sm" onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4 mr-1.5" strokeWidth={2.5} />
                        Add subject
                    </Button>,
                ]}
            />

            <div className="grid lg:grid-cols-3 gap-6">
                <Panel title="Kindergarten subjects" rows={kg} loading={loading} tone="warm"
                       hint="Early learning, play-based, graded E / VG / G / F / NI."
                       selection={selection} onDelete={(row) => setConfirm({ rows: [row] })} />
                <Panel title="Nursery subjects" rows={nursery} loading={loading} tone="warm"
                       hint="Teacher-led, play-based, graded E / VG / G / F / NI."
                       selection={selection} onDelete={(row) => setConfirm({ rows: [row] })} />
                <Panel title="Primary subjects" rows={basic} loading={loading} tone="mint"
                       hint="CA1 + CA2 + Exam out of 100. Graded A–F."
                       selection={selection} onDelete={(row) => setConfirm({ rows: [row] })} />
            </div>

            <SubjectForm open={showForm} onClose={() => setShowForm(false)} onCreated={() => { load(); setShowForm(false); }} />

            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={() => removeMany(confirm.rows)}
                busy={busy}
                title={confirm?.rows.length > 1 ? `Move ${confirm.rows.length} subjects to the trash?` : `Move "${confirm?.rows[0]?.name}" to the trash?`}
                body="You can restore it later from Trash."
                confirmLabel={confirm?.rows.length > 1 ? `Move ${confirm.rows.length} to trash` : 'Move to trash'}
                tone="danger"
            />
        </>
    );
};

const SubjectForm = ({ open, onClose, onCreated }) => {
    const [name, setName] = useState('');
    const [section, setSection] = useState('basic');
    const [code, setCode] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await axios.post(`${API_URL}/api/academics/subjects/`, { name, section, code });
            onCreated?.();
            setName('');
            setSection('basic');
            setCode('');
        } catch (err) {
            const data = err.response?.data;
            if (data && typeof data === 'object') {
                setError(Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n'));
            } else {
                setError(err.message || 'Failed to create subject.');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Add a subject"
            subtitle="Create a nursery or basic subject."
            size="sm"
            footer={[
                <Button key="cancel" variant="outline" size="sm" onClick={onClose} type="button">Cancel</Button>,
                <Button key="save" size="sm" onClick={submit} disabled={saving}>
                    {saving ? 'Creating…' : 'Create subject'}
                </Button>,
            ]}
        >
            {error && <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700 whitespace-pre-wrap">{error}</div>}

            <form onSubmit={submit} className="space-y-4">
                <Field label="Subject name" required>
                    <Input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        placeholder="e.g. Mathematics, Phonics"
                    />
                </Field>
                <Field label="Section" required>
                    <Select value={section} onChange={e => setSection(e.target.value)}>
                        <option value="kg">Kindergarten</option>
                        <option value="nursery">Nursery</option>
                        <option value="basic">Primary</option>
                    </Select>
                </Field>
                <Field label="Short code" hint="Optional — e.g. MTH, ENG, PHY">
                    <Input
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        placeholder="e.g. MTH"
                        maxLength={20}
                    />
                </Field>
            </form>
        </Modal>
    );
};

const Panel = ({ title, rows, loading, tone, hint, selection, onDelete }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
        <div className="flex items-start justify-between mb-1">
            <h3 className="font-bold text-ink">{title}</h3>
            <Badge tone={tone}>{loading ? '—' : `${rows.length}`}</Badge>
        </div>
        <p className="text-xs text-gray-500 mb-5">{hint}</p>

        {loading ? (
            <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse"/>)}</div>
        ) : (
            <ul className="divide-y divide-gray-50">
                {rows.map(s => (
                    <li key={s.id} className="flex items-center justify-between py-2.5 group">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={selection.isSelected(s)}
                                onChange={() => selection.toggle(s)}
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary-soft"
                            />
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${tone === 'warm' ? 'bg-secondary-soft text-secondary-dark' : 'bg-primary-soft text-primary-dark'}`}>
                                {s.code || s.name.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="text-sm font-medium text-ink">{s.name}</span>
                        </div>
                        <button
                            onClick={() => onDelete(s)}
                            title="Move to trash"
                            className="p-1.5 rounded-lg text-gray-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition"
                        >
                            <Trash2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                    </li>
                ))}
                {rows.length === 0 && (
                    <li className="py-6 text-center text-sm text-gray-400">No subjects yet.</li>
                )}
            </ul>
        )}
    </div>
);

export default SubjectsPage;
