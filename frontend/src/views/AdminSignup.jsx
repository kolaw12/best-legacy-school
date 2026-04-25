import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Field, { Input } from '../components/ui/Field';
import Logo from '../components/ui/Logo';

const AdminSignup = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        // Simulate creating an account by storing in localStorage
        const newUser = { username, password, email };
        localStorage.setItem('customAdminUser', JSON.stringify(newUser));
        
        // Small delay for feel
        setTimeout(() => {
            setLoading(false);
            alert('Account created successfully! Please login.');
            navigate('/admin-login');
        }, 800);
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-mint py-16 px-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-card-lg p-8">
                <div className="flex justify-center mb-4">
                    <Logo size="xl" />
                </div>
                <div className="text-center">
                    <Badge tone="mint" dot>Admin Registration</Badge>
                </div>
                <h1 className="mt-3 text-2xl font-black text-ink text-center">Join the workspace.</h1>
                <p className="mt-1 text-sm text-gray-500 text-center">Create your administrative credentials below.</p>

                <form onSubmit={handleSignup} className="mt-8 space-y-4">
                    <Field label="Username" required>
                        <Input 
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                            placeholder="johndoe"
                            autoFocus 
                            required 
                        />
                    </Field>
                    <Field label="Email Address" required>
                        <Input 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            placeholder="admin@bestlegacy.edu.ng"
                            required 
                        />
                    </Field>
                    <Field label="Create Password" required>
                        <Input 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                        />
                    </Field>
                    <Button type="submit" size="lg" disabled={loading} className="w-full mt-2">
                        {loading ? 'Creating account…' : 'Create Account'}
                    </Button>
                </form>

                <div className="mt-6 text-center text-xs text-gray-500">
                    Already have an account? <Link to="/admin-login" className="text-primary font-semibold hover:underline">Log in</Link>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-3 opacity-60">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">
                        Your account will be locally <br/> persistent on this device.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminSignup;
