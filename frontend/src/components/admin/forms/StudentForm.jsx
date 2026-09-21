import { useEffect, useState } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Field, { Input, Select, Textarea } from '../../ui/Field';
import CopyButton from '../../ui/CopyButton';
import adminApi from '../../../config/adminApi';
import API_URL from '../../../config/api';
import axios from 'axios';

const EMPTY_STUDENT = {
    first_name: '', last_name: '', date_of_birth: '', gender: 'M',
    class_level: '', status: 'active',
    guardian: '',  // existing guardian id
    allergies: '', medical_notes: '', dietary_notes: '',
    // new guardian fields (used if guardian=new)
    g_first_name: '', g_last_name: '', g_relationship: 'mother', g_phone: '', g_email: '', g_address: '', g_temp_password: '',
};

const StudentForm = ({ open, onClose, initial, onSaved }) => {
    const [form, setForm] = useState(EMPTY_STUDENT);
    const [classes, setClasses] = useState([]);
    const [guardians, setGuardians] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [newGuardian, setNewGuardian] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [createdCredentials, setCreatedCredentials] = useState(null);

    useEffect(() => {
        if (!open) return;
        Promise.all([adminApi.classes(), adminApi.guardians()])
            .then(([cls, gds]) => {
                setClasses(cls.data || []);
                setGuardians(gds.data || []);
                if (initial) {
                    const guardianList = gds.data || [];
                    const validGuardian = initial.guardian && guardianList.some(g => g.id === initial.guardian)
                        ? initial.guardian : '';
                    setForm(f => ({
                        ...f,
                        first_name: initial.first_name || '',
                        last_name: initial.last_name || '',
                        date_of_birth: initial.date_of_birth || '',
                        gender: initial.gender || 'M',
                        class_level: initial.class_level || '',
                        status: initial.status || 'active',
                        guardian: validGuardian,
                        allergies:     initial.allergies     || '',
                        medical_notes: initial.medical_notes || '',
                        dietary_notes: initial.dietary_notes || '',
                        g_first_name: '', g_last_name: '', g_relationship: 'mother', g_phone: '', g_email: '', g_address: '', g_temp_password: '',
                    }));
                    setNewGuardian(false);
                    setPhotoFile(null);
                    setPhotoPreview(initial.photo || null);
                } else {
                    setForm(EMPTY_STUDENT);
                    setNewGuardian(false);
                    setPhotoFile(null);
                    setPhotoPreview(null);
                }
                setError(null);
            });
    }, [open, initial]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setCreatedCredentials(null);
        try {
            let guardianId = form.guardian || null;
            let guardianCreds = null;
            if (newGuardian && form.g_first_name) {
                const guardianPayload = {
                    first_name: form.g_first_name,
                    last_name: form.g_last_name,
                    relationship: form.g_relationship,
                    phone: form.g_phone,
                    email: form.g_email,
                    address: form.g_address,
                };
                // Pass temp password if no email
                if (!form.g_email && form.g_temp_password) {
                    guardianPayload.temp_password = form.g_temp_password;
                }
                const { data: g } = await axios.post(`${API_URL}/api/academics/guardians/`, guardianPayload);
                guardianId = g.id;
                // Capture credentials from response (via ProvisionCredentialsMixin)
                if (g.provisioned_login) {
                    guardianCreds = g.provisioned_login;
                }
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

            const isMultipart = photoFile;
            const body = isMultipart ? (() => {
                const fd = new FormData();
                for (const [k, v] of Object.entries(payload)) {
                    if (v === null || v === undefined) continue;
                    if (Array.isArray(v)) {
                        v.forEach(item => fd.append(k, item));
                    } else {
                        fd.append(k, v);
                    }
                }
                fd.append('photo', photoFile);
                return fd;
            })() : payload;

            const config = isMultipart ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};

            if (initial?.id) {
                await axios.patch(`${API_URL}/api/academics/students/${initial.id}/`, body, config);
                onSaved?.();
                onClose?.();
            } else {
                await axios.post(`${API_URL}/api/academics/students/`, body, config);
                onSaved?.();
                if (guardianCreds) {
                    // Show credentials instead of closing
                    setCreatedCredentials(guardianCreds);
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

            {/* Show parent login credentials after creation */}
            {createdCredentials && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-2 mb-3">
                        <span className="text-amber-600 text-sm font-bold">Parent login created</span>
                    </div>
                    <p className="text-xs text-amber-800 mb-3">
                        Share these details with the parent. They can log in at <span className="font-mono">/parent-login</span>.
                    </p>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2">
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Username</div>
                                <div className="font-mono text-sm text-ink">{createdCredentials.username}</div>
                            </div>
                            <CopyButton value={createdCredentials.username} label="username" />
                        </div>
                        {createdCredentials.password && (
                            <div className="flex items-center justify-between gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2">
                                <div>
                                    <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Password</div>
                                    <div className="font-mono text-sm text-ink">{createdCredentials.password}</div>
                                </div>
                                <CopyButton value={createdCredentials.password} label="password" />
                            </div>
                        )}
                        {createdCredentials.invite_url && (
                            <div className="flex items-center justify-between gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2">
                                <div className="min-w-0 flex-1">
                                    <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Invite link</div>
                                    <div className="font-mono text-xs text-ink truncate">{createdCredentials.invite_url}</div>
                                </div>
                                <CopyButton value={createdCredentials.invite_url} label="invite link" />
                            </div>
                        )}
                    </div>
                    <div className="mt-3 flex justify-end">
                        <Button size="sm" onClick={onClose}>Done</Button>
                    </div>
                </div>
            )}

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
                    <div className="mt-4">
                        <Field label="Photo" hint="Passport-size photo of the student">
                            <div className="flex items-center gap-4">
                                {photoPreview && (
                                    <img src={photoPreview} alt="Student photo" className="w-16 h-16 rounded-full object-cover border border-gray-200" />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setPhotoFile(file);
                                            setPhotoPreview(URL.createObjectURL(file));
                                        }
                                    }}
                                    className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                />
                            </div>
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
                            <Field label="Email"><Input type="email" value={form.g_email} onChange={e => set('g_email', e.target.value)} placeholder="Parent email for portal access" /></Field>
                            {!form.g_email && (
                                <Field label="Parent portal password" hint="Set a login password for the parent (no email = no invite link)">
                                    <Input
                                        value={form.g_temp_password || ''}
                                        onChange={e => set('g_temp_password', e.target.value)}
                                        placeholder="e.g. Welcome2026!"
                                    />
                                </Field>
                            )}
                            <Field label="Address" className="md:col-span-2"><Textarea rows={2} value={form.g_address} onChange={e => set('g_address', e.target.value)} /></Field>
                        </div>
                    )}
                </div>
            </form>
        </Modal>
    );
};

export default StudentForm;
