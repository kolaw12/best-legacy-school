import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const AcademicsLogin = () => {
    const [role, setRole] = useState('student'); // 'student' or 'teacher'
    const [identifier, setIdentifier] = useState(''); // Student ID or Teacher Username
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        
        // 1. Check Hardcoded Credentials (Legacy support)
        if (role === 'teacher' && identifier === 'teacher' && password === 'teacher') {
            localStorage.setItem('userRole', 'teacher');
            navigate('/academics/teacher');
            return;
        }

        // 2. Check Registered Users from LocalStorage
        const existingUsers = JSON.parse(localStorage.getItem('academics_users')) || [];
        const user = existingUsers.find(u => u.identifier === identifier && u.role === role);

        if (user) {
            if (user.password === password) {
                localStorage.setItem('userRole', role);
                if (role === 'student') {
                    localStorage.setItem('studentId', identifier);
                    navigate('/academics/student');
                } else {
                    navigate('/academics/teacher');
                }
            } else {
                alert('Invalid Password');
            }
        } else {
            // For students without an account, we might still allow simple access if they just want to view?
            // But user requested "create user name and password". So let's enforce it or fail.
            // However, to keep the previous flow working for "just ID" if desired... 
            // Actually, let's enforce the signed up account OR the student ID only flow?
            // The previous requirement was "Student uses Reg No".
            // If I enforce password now, they MUST sign up.
            // Let's allow a fallback for Student if password is empty? No, `required` is on input.
            
            alert('User not found. Please Sign Up.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Academics Portal
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Access results and academic records
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="flex justify-center mb-6">
                        <div className="inline-flex rounded-md shadow-sm" role="group">
                            <button
                                type="button"
                                onClick={() => setRole('student')}
                                className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${role === 'student' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                            >
                                Student / Parent
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('teacher')}
                                className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${role === 'teacher' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                            >
                                Teacher / Staff
                            </button>
                        </div>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                                {role === 'student' ? 'Student Registration Number' : 'Username'}
                            </label>
                            <div className="mt-1">
                                <input
                                    id="identifier"
                                    name="identifier"
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                                Login
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    Don't have an account?
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <Link to="/academics/signup" className="font-medium text-primary hover:text-primary-dark">
                                Create an Account
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcademicsLogin;
