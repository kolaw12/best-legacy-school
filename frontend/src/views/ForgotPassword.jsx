import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Field, { Input } from '../components/ui/Field';
import Logo from '../components/ui/Logo';
import API_URL from '../config/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/auth/password-reset/`, { email });
            setSent(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong. Try again.');
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

                {sent ? (
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h1 className="text-2xl font-black text-ink">Check your email</h1>
                        <p className="mt-2 text-sm text-gray-500">
                            If an account with <strong>{email}</strong> exists, we've sent a password reset link.
                        </p>
                        <p className="mt-1 text-xs text-gray-400">The link expires in 1 hour.</p>
                        <Link to="/admin-login" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
                            Back to login
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-soft flex items-center justify-center">
                                <Mail className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-2xl font-black text-ink">Forgot password?</h1>
                            <p className="mt-1 text-sm text-gray-500">Enter your email and we'll send you a reset link.</p>
                        </div>

                        {error && (
                            <div className="mt-5 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">{error}</div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <Field label="Email" required>
                                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus required placeholder="you@example.com" />
                            </Field>
                            <Button type="submit" size="lg" disabled={loading} className="w-full">
                                {loading ? 'Sending...' : 'Send reset link'}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <Link to="/admin-login" className="text-xs text-gray-400 hover:text-ink transition">
                                ← Back to login
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
