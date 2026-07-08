import { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Field, { Input, Select, Textarea } from '../../ui/Field';
import CredentialsReveal from '../CredentialsReveal';
import API_URL from '../../../config/api';

const EMPTY = {
    first_name: '', last_name: '', relationship: 'guardian',
    phone: '', email: '', occupation: '', address: '',
};

const GuardianForm = ({ open, onClose, initial, onSaved }) => {
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [justCreated, setJustCreated] = useState(null);

    useEffect(() => {
        if (!open) return;
        setJustCreated(null);
        setError(null);
        if (initial) {
            setForm({
                first_name: initial.first_name || '',
                last_name: initial.last_name || '',
                relationship: initial.relationship || 'guardian',
                phone: initial.phone || '',
                email: initial.email || '',
                occupation: initial.occupation || '',
                address: initial.address || '',
            });
        } else {
            setForm(EMPTY);
        }
    }, [open, initial]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            if (initial?.id) {
                await axios.patch(`${API_URL}/api/academics/guardians/${initial.id}/`, form);
                onSaved?.();
                onClose?.();
            } else {
                const res = await axios.post(`${API_URL}/api/academics/guardians/`, form);
                onSaved?.();
                if (form.email) {
                    // A login is auto-provisioned server-side when an email is
                    // given — let the admin know rather than silently closing,
                    // since the credentials email has no delivery guarantee.
                    setJustCreated({ email: form.email, credentials: res.data.provisioned_login || null });
                } else {
                    onClose?.();
                }
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
            <Modal open={open} onClose={onClose} title="Guardian added" size="sm"
                   footer={[<Button key="done" size="sm" onClick={onClose}>Done</Button>]}>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    A parent-portal login has been created for <strong>{justCreated.email}</strong>. An email with these
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
            title={initial ? 'Edit guardian' : 'Add a new guardian'}
            subtitle={initial ? undefined : 'A parent-portal login is created automatically if you give an email.'}
            size="md"
            footer={[
                <Button key="cancel" variant="outline" size="sm" onClick={onClose} type="button">Cancel</Button>,
                <Button key="save" size="sm" onClick={submit} disabled={saving}>
                    {saving ? 'Saving…' : (initial ? 'Save changes' : 'Create guardian')}
                </Button>,
            ]}
        >
            {error && <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700 whitespace-pre-wrap">{error}</div>}

            <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
                <Field label="First name" required><Input value={form.first_name} onChange={e => set('first_name', e.target.value)} required /></Field>
                <Field label="Last name"><Input value={form.last_name} onChange={e => set('last_name', e.target.value)} /></Field>
                <Field label="Relationship">
                    <Select value={form.relationship} onChange={e => set('relationship', e.target.value)}>
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                        <option value="guardian">Guardian</option>
                        <option value="other">Other</option>
                    </Select>
                </Field>
                <Field label="Phone" required><Input value={form.phone} onChange={e => set('phone', e.target.value)} required /></Field>
                <Field label="Email" hint="Needed to create their portal login." className="md:col-span-2">
                    <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                </Field>
                <Field label="Occupation"><Input value={form.occupation} onChange={e => set('occupation', e.target.value)} /></Field>
                <Field label="Address" className="md:col-span-2"><Textarea rows={2} value={form.address} onChange={e => set('address', e.target.value)} /></Field>
            </form>
        </Modal>
    );
};

export default GuardianForm;
