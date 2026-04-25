import { useEffect, useState } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Field, { Input, Select, Textarea } from '../../ui/Field';
import adminApi from '../../../config/adminApi';
import API_URL from '../../../config/api';
import axios from 'axios';

const EMPTY_STUDENT = {
    first_name: '', last_name: '', date_of_birth: '', gender: 'M',
    class_level: '', status: 'active',
    guardian: '',  // existing guardian id
    allergies: '', medical_notes: '', dietary_notes: '',
    // new guardian fields (used if guardian=new)
    g_first_name: '', g_last_name: '', g_relationship: 'mother', g_phone: '', g_email: '', g_address: '',
};

const StudentForm = ({ open, onClose, initial, onSaved }) => {
    const [form, setForm] = useState(EMPTY_STUDENT);
    const [classes, setClasses] = useState([]);
    const [guardians, setGuardians] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [newGuardian, setNewGuardian] = useState(false);

    useEffect(() => {
        if (!open) return;
        adminApi.classes().then(r => setClasses(r.data || []));
        adminApi.guardians().then(r => setGuardians(r.data || []));
        if (initial) {
            setForm({
                first_name: initial.first_name || '',
                last_name: initial.last_name || '',
                date_of_birth: initial.date_of_birth || '',
                gender: initial.gender || 'M',
                class_level: initial.class_level || '',
                status: initial.status || 'active',
                guardian: initial.guardian || '',
                allergies:     initial.allergies     || '',
                medical_notes: initial.medical_notes || '',
                dietary_notes: initial.dietary_notes || '',
                g_first_name: '', g_last_name: '', g_relationship: 'mother', g_phone: '', g_email: '', g_address: '',
            });
            setNewGuardian(false);
        } else {
            setForm(EMPTY_STUDENT);
            setNewGuardian(false);
        }
        setError(null);
    }, [open, initial]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            let guardianId = form.guardian || null;
            if (newGuardian && form.g_first_name) {
                const { data: g } = await axios.post(`${API_URL}/api/academics/guardians/`, {
                    first_name: form.g_first_name,
                    last_name: form.g_last_name,
                    relationship: form.g_relationship,
                    phone: form.g_phone,
                    email: form.g_email,
                    address: form.g_address,
                });
                guardianId = g.id;
            }

            const payload = {
                first_name: form.first_name,
                last_name: form.last_name,
                date_of_birth: form.date_of_birth,
                gender: form.gender,
                class_level: form.class_level,
                status: form.status,
                guardian: guardianId,
                allergies:     form.allergies,
                medical_notes: form.medical_notes,
                dietary_notes: form.dietary_notes,
            };

            if (initial?.id) {
                await axios.patch(`${API_URL}/api/academics/students/${initial.id}/`, payload);
            } else {
                await axios.post(`${API_URL}/api/academics/students/`, payload);
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
            title={initial ? 'Edit student' : 'Add a new student'}
            subtitle={initial ? initial.admission_no : 'Enrols a child into the current session.'}
            size="lg"
            footer={[
                <Button key="cancel" variant="outline" size="sm" onClick={onClose} type="button">Cancel</Button>,
                <Button key="save" size="sm" onClick={submit} disabled={saving}>
                    {saving ? 'Saving…' : (initial ? 'Save changes' : 'Create student')}
                </Button>,
            ]}
        >
            {error && <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700 whitespace-pre-wrap">{error}</div>}

            <form onSubmit={submit} className="space-y-6">
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Child</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Field label="First name" required><Input value={form.first_name} onChange={e => set('first_name', e.target.value)} required /></Field>
                        <Field label="Last name" required><Input value={form.last_name} onChange={e => set('last_name', e.target.value)} required /></Field>
                        <Field label="Date of birth" required><Input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} required /></Field>
                        <Field label="Gender" required>
                            <Select value={form.gender} onChange={e => set('gender', e.target.value)}>
                                <option value="M">Male</option><option value="F">Female</option>
                            </Select>
                        </Field>
                        <Field label="Class level" required>
                            <Select value={form.class_level} onChange={e => set('class_level', e.target.value)} required>
                                <option value="">Select class…</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </Select>
                        </Field>
                        <Field label="Status">
                            <Select value={form.status} onChange={e => set('status', e.target.value)}>
                                <option value="active">Active</option>
                                <option value="graduated">Graduated</option>
                                <option value="withdrawn">Withdrawn</option>
                                <option value="suspended">Suspended</option>
                            </Select>
                        </Field>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Health & safety notes</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                        <Field label="Allergies" hint="Anything the kitchen + nurse must know">
                            <Textarea rows={2} value={form.allergies} onChange={e => set('allergies', e.target.value)} placeholder="e.g. peanuts (severe), shellfish" />
                        </Field>
                        <Field label="Medical notes" hint="Asthma, ongoing meds, etc.">
                            <Textarea rows={2} value={form.medical_notes} onChange={e => set('medical_notes', e.target.value)} placeholder="Inhaler in bag" />
                        </Field>
                        <Field label="Dietary" hint="Halal, vegetarian, lactose, etc.">
                            <Textarea rows={2} value={form.dietary_notes} onChange={e => set('dietary_notes', e.target.value)} placeholder="No pork" />
                        </Field>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Guardian</h4>
                        <button type="button" onClick={() => setNewGuardian(n => !n)} className="text-xs font-semibold text-primary hover:underline">
                            {newGuardian ? '← pick existing' : '+ add new'}
                        </button>
                    </div>
                    {!newGuardian ? (
                        <Field label="Select guardian">
                            <Select value={form.guardian} onChange={e => set('guardian', e.target.value)}>
                                <option value="">— none —</option>
                                {guardians.map(g => <option key={g.id} value={g.id}>{g.full_name} · {g.phone}</option>)}
                            </Select>
                        </Field>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                            <Field label="Guardian first name" required><Input value={form.g_first_name} onChange={e => set('g_first_name', e.target.value)} /></Field>
                            <Field label="Guardian last name"><Input value={form.g_last_name} onChange={e => set('g_last_name', e.target.value)} /></Field>
                            <Field label="Relationship">
                                <Select value={form.g_relationship} onChange={e => set('g_relationship', e.target.value)}>
                                    <option value="father">Father</option>
                                    <option value="mother">Mother</option>
                                    <option value="guardian">Guardian</option>
                                    <option value="other">Other</option>
                                </Select>
                            </Field>
                            <Field label="Phone" required><Input value={form.g_phone} onChange={e => set('g_phone', e.target.value)} /></Field>
                            <Field label="Email"><Input type="email" value={form.g_email} onChange={e => set('g_email', e.target.value)} /></Field>
                            <Field label="Address" className="md:col-span-2"><Textarea rows={2} value={form.g_address} onChange={e => set('g_address', e.target.value)} /></Field>
                        </div>
                    )}
                </div>
            </form>
        </Modal>
    );
};

export default StudentForm;
