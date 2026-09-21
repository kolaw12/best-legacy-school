import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Button from '../components/ui/Button';
import Field, { Input } from '../components/ui/Field';
import Logo from '../components/ui/Logo';
import API_URL from '../config/api';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState(null);

    if (!token) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-mint py-16 px-4">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-card-lg p-8 text-center">
                    <h1 className="text-2xl font-black text-ink">Invalid link</h1>
                    <p className="mt-2 text-sm text-gray-500">This password reset link is invalid or missing.</p>
                    <Link to="/forgot-password" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
                        Request a new link
                    </Link>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/auth/password-reset/confirm/`, { token, password });
            setDone(true);
            setTimeout(() => navigate('/admin-login'), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Reset failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-mint py-16 px-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-card-lg p-8">
                <div className="flex justify-center mb-4">
                    <Logo size="xl" />
                </div>

                {done ? (
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h1 className="text-2xl font-black text-ink">Password reset!</h1>
                        <p className="mt-2 text-sm text-gray-500">Redirecting to login...</p>
                    </div>
                ) : (
                    <>
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-soft flex items-center justify-center">
                                <Lock className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-2xl font-black text-ink">Set new password</h1>
                            <p className="mt-1 text-sm text-gray-500">Choose a strong password for your account.</p>
                        </div>

                        {error && (
                            <div className="mt-5 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">{error}</div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <Field label="New password" required>
                                <div className="relative">
                                    <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoFocus required minLength={8} className="pr-10" />
                                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink transition">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </Field>
                            <Field label="Confirm password" required>
                                <Input type={showPassword ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} />
                            </Field>
                            <Button type="submit" size="lg" disabled={loading} className="w-full">
                                {loading ? 'Resetting...' : 'Reset password'}
                            </Button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
