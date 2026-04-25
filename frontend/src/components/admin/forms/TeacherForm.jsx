import { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Field, { Input, Select } from '../../ui/Field';
import API_URL from '../../../config/api';
import adminApi from '../../../config/adminApi';

const EMPTY = {
    first_name: '', last_name: '', email: '', phone: '',
    qualification: '', hire_date: '', is_active: true,
    class_teacher_of: '',
};

const TeacherForm = ({ open, onClose, initial, onSaved }) => {
    const [form, setForm] = useState(EMPTY);
    const [classes, setClasses] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!open) return;
        adminApi.classes().then(r => setClasses(r.data || []));
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
            });
        } else {
            setForm(EMPTY);
        }
        setError(null);
    }, [open, initial]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
            } else {
                await axios.post(`${API_URL}/api/academics/teachers/`, payload);
            }
            onSaved?.();
            onClose?.();
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

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={initial ? 'Edit teacher' : 'Add a new teacher'}
            subtitle={initial?.staff_id}
            size="md"
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
                <Field label="Status" className="md:col-span-2">
                    <Select value={form.is_active ? 'true' : 'false'} onChange={e => set('is_active', e.target.value === 'true')}>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </Select>
                </Field>
            </form>
        </Modal>
    );
};

export default TeacherForm;
