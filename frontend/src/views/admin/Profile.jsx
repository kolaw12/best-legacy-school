import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Field, { Input } from '../../components/ui/Field';
import Logo from '../../components/ui/Logo';

const AdminProfile = () => {
    const { profile, updateProfile } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        email: profile?.email || '',
        phone: profile?.phone || '',
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(profile?.photo || null);
    const [passwords, setPasswords] = useState({ new_password: '', confirm_password: '' });
    const [saving, setSaving] = useState(false);
    const [savingPw, setSavingPw] = useState(false);
    const [msg, setMsg] = useState(null);
    const [pwMsg, setPwMsg] = useState(null);
    const [error, setError] = useState(null);
    const [pwError, setPwError] = useState(null);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setMsg(null);
        try {
            const fd = new FormData();
            fd.append('first_name', form.first_name);
            fd.append('last_name', form.last_name);
            fd.append('email', form.email);
            fd.append('phone', form.phone);
            if (photoFile) fd.append('photo', photoFile);
            await updateProfile(fd);
            setMsg('Profile updated successfully.');
        } catch (err) {
            const data = err.response?.data;
            if (data && typeof data === 'object') {
                setError(Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n'));
            } else {
                setError(err.message || 'Failed to update profile.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handlePassword = async (e) => {
        e.preventDefault();
        if (passwords.new_password !== passwords.confirm_password) {
            setPwError('Passwords do not match.');
            return;
        }
        if (passwords.new_password.length < 6) {
            setPwError('Password must be at least 6 characters.');
            return;
        }
        setSavingPw(true);
        setPwError(null);
        setPwMsg(null);
        try {
            await updateProfile({ new_password: passwords.new_password });
            setPasswords({ new_password: '', confirm_password: '' });
            setPwMsg('Password changed successfully.');
        } catch (err) {
            setPwError(err.response?.data?.error || 'Failed to change password.');
        } finally {
            setSavingPw(false);
        }
    };

    const initials = (profile?.full_name || profile?.username || 'A')
        .split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-ink">My Profile</h1>
                <p className="mt-1 text-sm text-gray-500">Manage your account details.</p>
            </div>

            {/* Profile info */}
            <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card space-y-5">
                {/* Photo */}
                <div className="flex items-center gap-5">
                    {photoPreview ? (
                        <img src={photoPreview} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border border-gray-200" />
                    ) : (
                        <div className="w-20 h-20 rounded-2xl bg-primary-soft text-primary-dark flex items-center justify-center font-black text-2xl">{initials}</div>
                    )}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Profile photo</label>
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
                            className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-soft file:text-primary hover:file:bg-primary/20 cursor-pointer"
                        />
                    </div>
                </div>

                {error && <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700 whitespace-pre-wrap">{error}</div>}
                {msg && <div className="bg-primary-soft border border-primary/20 rounded-xl p-3 text-sm text-primary-dark">{msg}</div>}

                <div className="grid md:grid-cols-2 gap-4">
                    <Field label="First name" required>
                        <Input value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
                    </Field>
                    <Field label="Last name" required>
                        <Input value={form.last_name} onChange={e => set('last_name', e.target.value)} required />
                    </Field>
                    <Field label="Email" required>
                        <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
                    </Field>
                    <Field label="Phone">
                        <Input value={form.phone} onChange={e => set('phone', e.target.value)} />
                    </Field>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={saving}>
                        {saving ? 'Saving…' : 'Save changes'}
                    </Button>
                </div>
            </form>

            {/* Change password */}
            <form onSubmit={handlePassword} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card space-y-4">
                <h2 className="font-bold text-ink">Change Password</h2>

                {pwError && <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">{pwError}</div>}
                {pwMsg && <div className="bg-primary-soft border border-primary/20 rounded-xl p-3 text-sm text-primary-dark">{pwMsg}</div>}

                <div className="grid md:grid-cols-2 gap-4">
                    <Field label="New password" required>
                        <Input type="password" value={passwords.new_password} onChange={e => setPasswords(p => ({ ...p, new_password: e.target.value }))} required minLength={6} />
                    </Field>
                    <Field label="Confirm password" required>
                        <Input type="password" value={passwords.confirm_password} onChange={e => setPasswords(p => ({ ...p, confirm_password: e.target.value }))} required minLength={6} />
                    </Field>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" size="sm" variant="outline" disabled={savingPw}>
                        {savingPw ? 'Changing…' : 'Change password'}
                    </Button>
                </div>
            </form>

            {/* Account info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
                <h2 className="font-bold text-ink mb-3">Account Details</h2>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">Username</div>
                        <div className="mt-0.5 font-mono text-ink">{profile?.username}</div>
                    </div>
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">Role</div>
                        <div className="mt-0.5 font-semibold text-ink">{profile?.role_display}</div>
                    </div>
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">Member since</div>
                        <div className="mt-0.5 text-ink">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
