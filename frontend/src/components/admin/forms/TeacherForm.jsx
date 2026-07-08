import { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Field, { Input, Select } from '../../ui/Field';
import CredentialsReveal from '../CredentialsReveal';
import API_URL from '../../../config/api';
import adminApi from '../../../config/adminApi';

const EMPTY = {
    first_name: '', last_name: '', email: '', phone: '',
    qualification: '', hire_date: '', is_active: true,
    class_teacher_of: '', subjects: [], classes: [],
};

const TeacherForm = ({ open, onClose, initial, onSaved }) => {
    const [form, setForm] = useState(EMPTY);
    const [classes, setClasses] = useState([]);
    const [allSubjects, setAllSubjects] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [justCreated, setJustCreated] = useState(null);

    useEffect(() => {
        if (!open) return;
        adminApi.classes().then(r => setClasses(r.data || []));
        adminApi.subjects().then(r => setAllSubjects(r.data || []));
        if (initial) {
            setForm({
                first_name: initial.first_name || '',
                last_name: initial.last_name || '',
                email: initial.email || '',
                phone: initial.phone || '',
                qualification: initial.qualification || '',
                hire_date: initial.hire_date || '',
                is_active: !!initial.is_active,
                class_teacher_of: initial.class_teacher_of || '',
                subjects: initial.subjects || [],
                classes: initial.classes || [],
            });
        } else {
            setForm(EMPTY);
        }
        setError(null);
        setJustCreated(null);
    }, [open, initial]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const toggleInList = (k, id) => setForm(f => ({
        ...f,
        [k]: f[k].includes(id) ? f[k].filter(x => x !== id) : [...f[k], id],
    }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const payload = { ...form };
            if (!payload.hire_date) delete payload.hire_date;
            if (!payload.class_teacher_of) payload.class_teacher_of = null;

            if (initial?.id) {
                await axios.patch(`${API_URL}/api/academics/teachers/${initial.id}/`, payload);
                onSaved?.();
                onClose?.();
            } else {
                const res = await axios.post(`${API_URL}/api/academics/teachers/`, payload);
                onSaved?.();
                // A login is auto-provisioned server-side (email is required
                // above) — surface it since the credentials email has no
                // delivery guarantee.
                setJustCreated({ email: payload.email, credentials: res.data.provisioned_login || null });
            }
        } catch (err) {
            const data = err.response?.data;
            if (data && typeof data === 'object') {
                setError(Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n'));
            } else {
                setError(err.message || 'Failed to save.');
            }
        } finally {
            setSaving(false);
        }
    };

    if (justCreated) {
        return (
            <Modal open={open} onClose={onClose} title="Teacher added" size="sm"
                   footer={[<Button key="done" size="sm" onClick={onClose}>Done</Button>]}>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    A staff-portal login has been created for <strong>{justCreated.email}</strong>. An email with these
                    credentials was attempted too, but delivery isn't guaranteed — copy them now just in case.
                </p>
                {justCreated.credentials ? (
                    <CredentialsReveal username={justCreated.credentials.username} password={justCreated.credentials.password} />
                ) : (
                    <p className="text-sm text-gray-500">Sign in at <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">/admin-login</span>.</p>
                )}
            </Modal>
        );
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={initial ? 'Edit teacher' : 'Add a new teacher'}
            subtitle={initial?.staff_id}
            size="lg"
            footer={[
                <Button key="cancel" variant="outline" size="sm" onClick={onClose} type="button">Cancel</Button>,
                <Button key="save" size="sm" onClick={submit} disabled={saving}>
                    {saving ? 'Saving…' : (initial ? 'Save changes' : 'Create teacher')}
                </Button>,
            ]}
        >
            {error && <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700 whitespace-pre-wrap">{error}</div>}

            <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
                <Field label="First name" required><Input value={form.first_name} onChange={e => set('first_name', e.target.value)} required /></Field>
                <Field label="Last name" required><Input value={form.last_name} onChange={e => set('last_name', e.target.value)} required /></Field>
                <Field label="Email" required><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} required /></Field>
                <Field label="Phone"><Input value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
                <Field label="Qualification" className="md:col-span-2"><Input value={form.qualification} onChange={e => set('qualification', e.target.value)} placeholder="e.g. B.Ed Early Childhood" /></Field>
                <Field label="Hire date"><Input type="date" value={form.hire_date} onChange={e => set('hire_date', e.target.value)} /></Field>
                <Field label="Class teacher of">
                    <Select value={form.class_teacher_of} onChange={e => set('class_teacher_of', e.target.value)}>
                        <option value="">— subject teacher only —</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                </Field>
                <Field label="Status">
                    <Select value={form.is_active ? 'true' : 'false'} onChange={e => set('is_active', e.target.value === 'true')}>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </Select>
                </Field>

                <Field
                    label="Other classes they teach a subject in"
                    hint="Beyond the homeroom class above — pick every class this teacher enters results for. This is what lets a subject-only teacher (no homeroom class) see a class and upload results at all."
                    className="md:col-span-2"
                >
                    <CheckboxGrid
                        options={classes.map(c => ({ id: c.id, label: c.name }))}
                        selected={form.classes}
                        onToggle={id => toggleInList('classes', id)}
                    />
                </Field>

                <Field label="Subjects taught" className="md:col-span-2">
                    <CheckboxGrid
                        options={allSubjects.map(s => ({ id: s.id, label: `${s.name} (${s.section === 'nursery' ? 'Nursery' : 'Basic'})` }))}
                        selected={form.subjects}
                        onToggle={id => toggleInList('subjects', id)}
                    />
                </Field>
            </form>
        </Modal>
    );
};

const CheckboxGrid = ({ options, selected, onToggle }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-3 border border-gray-200 rounded-xl bg-gray-50/50" data-lenis-prevent>
        {options.length === 0 && <span className="text-xs text-gray-400 col-span-full">Nothing to choose from yet.</span>}
        {options.map(o => (
            <label key={o.id} className="flex items-center gap-2 text-sm text-ink cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={selected.includes(o.id)}
                    onChange={() => onToggle(o.id)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary-soft"
                />
                <span className="truncate">{o.label}</span>
            </label>
        ))}
    </div>
);

export default TeacherForm;
