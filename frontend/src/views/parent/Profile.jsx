import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Field, { Input } from '../../components/ui/Field';
import API_URL from '../../config/api';
import axios from 'axios';

const ParentProfile = () => {
    const { profile, updateProfile } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const initials = (profile?.full_name || profile?.username || 'P')
        .split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        if (newPassword.length < 8) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
            return;
        }

        setSaving(true);
        try {
            await updateProfile({ current_password: currentPassword, new_password: newPassword });
            setMessage({ type: 'success', text: 'Password changed successfully.' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.new_password?.[0] || 'Failed to change password.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-black text-ink">My Profile</h1>

            {/* Profile info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl">{initials}</div>
                    <div>
                        <div className="text-lg font-bold text-ink">{profile?.full_name || profile?.username}</div>
                        <div className="text-sm text-gray-500">{profile?.email || profile?.username}</div>
                        <div className="text-xs text-gray-400 mt-0.5">Parent Portal</div>
                    </div>
                </div>
            </div>

            {/* Change password */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
                <h2 className="text-lg font-bold text-ink mb-4">Change Password</h2>
                <p className="text-sm text-gray-500 mb-4">If you were given a temporary password, we recommend changing it now.</p>

                {message && (
                    <div className={`mb-4 rounded-xl p-3 text-sm ${
                        message.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-primary-soft border border-primary/20 text-primary-dark'
                    }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <Field label="Current password" required>
                        <div className="relative">
                            <Input type={showPassword ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="pr-10" />
                            <button type="button" onClick={() => setShowPassword(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink transition">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </Field>
                    <Field label="New password" required>
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            required
                            minLength={8}
                            placeholder="At least 8 characters"
                        />
                    </Field>
                    <Field label="Confirm new password" required>
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                    </Field>
                    <div className="flex justify-end">
                        <Button type="submit" size="sm" disabled={saving}>
                            {saving ? 'Saving…' : 'Change password'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ParentProfile;
