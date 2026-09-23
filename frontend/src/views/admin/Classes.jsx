import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus, GripVertical } from 'lucide-react';
import AdminPageHeader from '../../components/admin/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Field, { Input, Select } from '../../components/ui/Field';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import adminApi from '../../config/adminApi';

const SECTION_META = {
    kg:       { label: 'Kindergarten', tone: 'warm',   badge: 'warm' },
    nursery:  { label: 'Nursery',      tone: 'mint',   badge: 'mint' },
    basic:    { label: 'Primary',      tone: 'neutral', badge: 'neutral' },
};

const ClassesPage = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null); // ClassLevel object or null
    const [confirmDelete, setConfirmDelete] = useState(null);

    const load = () => {
        setLoading(true);
        adminApi.classes()
            .then(r => setRows(Array.isArray(r.data) ? r.data : r.data.results || []))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const kg = rows.filter(r => r.section === 'kg');
    const nursery = rows.filter(r => r.section === 'nursery');
    const primary = rows.filter(r => r.section === 'basic');

    const handleEdit = (cls) => {
        setEditing(cls);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setEditing(null);
        setShowForm(false);
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            await adminApi.deleteClass(confirmDelete.id);
            setRows(rs => rs.filter(r => r.id !== confirmDelete.id));
        } catch (e) {
            alert(e.response?.data?.detail || e.response?.data?.error || 'Cannot delete this class. It may have students assigned to it.');
        }
        setConfirmDelete(null);
    };

    return (
        <>
            <AdminPageHeader
                title="Classes"
                subtitle="Manage class levels across Kindergarten, Nursery, and Primary sections."
                actions={[
                    <Button key="add" size="sm" onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4 mr-1.5" strokeWidth={2.5} />
                        Add class
                    </Button>,
                ]}
            />

            <div className="space-y-8">
                <SectionTable title="Kindergarten" sectionKey="kg" rows={kg} loading={loading} onEdit={handleEdit} onDelete={setConfirmDelete} />
                <SectionTable title="Nursery" sectionKey="nursery" rows={nursery} loading={loading} onEdit={handleEdit} onDelete={setConfirmDelete} />
                <SectionTable title="Primary" sectionKey="basic" rows={primary} loading={loading} onEdit={handleEdit} onDelete={setConfirmDelete} />
            </div>

            {rows.length === 0 && !loading && (
                <div className="text-center py-16">
                    <p className="text-gray-400 text-sm">No classes found. Click &ldquo;Add class&rdquo; to create one.</p>
                </div>
            )}

            <ClassForm
                open={showForm}
                editing={editing}
                onClose={handleFormClose}
                onSaved={() => { load(); handleFormClose(); }}
            />

            <ConfirmDialog
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleDelete}
                title={`Delete "${confirmDelete?.name}"?`}
                body="This action cannot be undone. Students in this class will need to be reassigned first."
                confirmLabel="Delete class"
                tone="danger"
            />
        </>
    );
};

const SectionTable = ({ title, sectionKey, rows, loading, onEdit, onDelete }) => {
    const meta = SECTION_META[sectionKey] || SECTION_META.basic;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-ink">{title}</h2>
                <Badge tone={meta.badge}>{loading ? '...' : `${rows.length} class${rows.length !== 1 ? 'es' : ''}`}</Badge>
            </div>

            {loading ? (
                <div className="p-6 space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : rows.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-gray-400">
                    No {title.toLowerCase()} classes yet.
                </div>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                            <th className="px-6 py-3 font-medium">#</th>
                            <th className="px-6 py-3 font-medium">Class Name</th>
                            <th className="px-6 py-3 font-medium">Class Teacher</th>
                            <th className="px-6 py-3 font-medium text-right">Students</th>
                            <th className="px-6 py-3 font-medium text-right w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {rows.map((cls) => (
                            <tr key={cls.id} className="hover:bg-gray-50/50 transition group">
                                <td className="px-6 py-3.5 text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <GripVertical className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition" />
                                        {cls.order}
                                    </span>
                                </td>
                                <td className="px-6 py-3.5 font-semibold text-ink">{cls.name}</td>
                                <td className="px-6 py-3.5 text-gray-500">
                                    {cls.class_teacher_name || <span className="text-gray-300 italic">Unassigned</span>}
                                </td>
                                <td className="px-6 py-3.5 text-right font-bold text-ink">{cls.student_count}</td>
                                <td className="px-6 py-3.5 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            onClick={() => onEdit(cls)}
                                            title="Edit class"
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-soft transition"
                                        >
                                            <Pencil className="w-4 h-4" strokeWidth={2} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(cls)}
                                            title="Delete class"
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                        >
                                            <Trash2 className="w-4 h-4" strokeWidth={2} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

const ClassForm = ({ open, editing, onClose, onSaved }) => {
    const isEdit = !!editing;
    const [name, setName] = useState('');
    const [section, setSection] = useState('basic');
    const [order, setOrder] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (editing) {
            setName(editing.name);
            setSection(editing.section);
            setOrder(String(editing.order));
        } else {
            setName('');
            setSection('basic');
            setOrder('');
        }
        setError(null);
    }, [editing, open]);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const payload = {
                name: name.trim(),
                section,
                order: parseInt(order, 10) || 0,
            };
            if (isEdit) {
                await adminApi.updateClass(editing.id, payload);
            } else {
                await adminApi.createClass(payload);
            }
            onSaved?.();
        } catch (err) {
            const data = err.response?.data;
            if (data && typeof data === 'object') {
                setError(Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n'));
            } else {
                setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} class.`);
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? 'Edit class' : 'Add a class'}
            subtitle={isEdit ? `Update "${editing.name}"` : 'Create a new class level.'}
            size="sm"
            footer={[
                <Button key="cancel" variant="outline" size="sm" onClick={onClose} type="button">Cancel</Button>,
                <Button key="save" size="sm" onClick={submit} disabled={saving}>
                    {saving ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save changes' : 'Create class')}
                </Button>,
            ]}
        >
            {error && (
                <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700 whitespace-pre-wrap">
                    {error}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <Field label="Class name" required>
                    <Input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        placeholder="e.g. KG 1, Nursery 2, Primary 3"
                    />
                </Field>
                <Field label="Section" required>
                    <Select value={section} onChange={e => setSection(e.target.value)}>
                        <option value="kg">Kindergarten</option>
                        <option value="nursery">Nursery</option>
                        <option value="basic">Primary</option>
                    </Select>
                </Field>
                <Field label="Display order" hint="Lower numbers appear first. Must be unique.">
                    <Input
                        type="number"
                        min="1"
                        value={order}
                        onChange={e => setOrder(e.target.value)}
                        required
                        placeholder="e.g. 1, 2, 3..."
                    />
                </Field>
            </form>
        </Modal>
    );
};

export default ClassesPage;
