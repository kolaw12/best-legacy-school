import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Field, { Input } from '../components/ui/Field';
import Logo from '../components/ui/Logo';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const from = location.state?.from || '/admin/dashboard';

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const profile = await login(username, password);
            if (['super_admin', 'school_admin'].includes(profile.role)) {
                let target = from.startsWith('/admin') ? from : '/admin/dashboard';
                if (target === '/admin-dashboard') target = '/admin/dashboard';
                navigate(target);
            } else if (profile.role === 'teacher') {
                const target = from.startsWith('/admin/teacher') ? from : '/admin/teacher/dashboard';
                navigate(target);
            } else if (profile.role === 'parent') {
                const target = from.startsWith('/portal') ? from : '/portal/dashboard';
                navigate(target);
            } else {
                setError(`Your role (${profile.role_display}) doesn't have a workspace yet.`);
            }
        } catch (err) {
            setError(
                err.response?.data?.non_field_errors?.[0]
                || err.response?.data?.detail
                || 'Invalid username or password.'
            );
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
                <div className="text-center">
                    <Badge tone="mint" dot>Admin Console</Badge>
                </div>
                <h1 className="mt-3 text-2xl font-black text-ink text-center">Welcome back.</h1>
                <p className="mt-1 text-sm text-gray-500 text-center">Sign in to BLDS.</p>

                {error && (
                    <div className="mt-5 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">{error}</div>
                )}

                <form onSubmit={handleLogin} className="mt-6 space-y-4">
                    <Field label="Username" required>
                        <Input value={username} onChange={e => setUsername(e.target.value)} autoFocus required />
                    </Field>
                    <Field label="Password" required>
                        <div className="relative">
                            <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required className="pr-10" />
                            <button type="button" onClick={() => setShowPassword(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink transition">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </Field>
                    <Button type="submit" size="lg" disabled={loading} className="w-full">
                        {loading ? 'Signing in…' : 'Sign in'}
                    </Button>
                </form>

                <div className="mt-6 text-center space-y-2">
                    <p className="text-xs text-gray-500">
                        Need an account? Ask a school admin to set one up for you.
                    </p>
                    <Link to="/parent-login" className="text-xs text-gray-400 hover:text-ink transition">
                        Parent login →
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
