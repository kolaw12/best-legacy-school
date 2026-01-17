import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const AcademicsSignup = () => {
    const [role, setRole] = useState('student');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [classAssigned, setClassAssigned] = useState('JSS 1');
    const navigate = useNavigate();

    const handleSignup = (e) => {
        e.preventDefault();
        
        // Get existing users
        const existingUsers = JSON.parse(localStorage.getItem('academics_users')) || [];
        
        // Check if user already exists
        const userExists = existingUsers.find(u => u.identifier === identifier);
        if (userExists) {
            alert('User already exists!');
            return;
        }

        // Save new user
        const newUser = { 
            role, 
            identifier, 
            password, 
            classAssigned: role === 'teacher' ? classAssigned : null 
        };
        existingUsers.push(newUser);
        localStorage.setItem('academics_users', JSON.stringify(existingUsers));

        alert('Account created successfully! Please login.');
        navigate('/academics');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Create Account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Register for Academics Portal
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
                                Student
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('teacher')}
                                className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${role === 'teacher' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                            >
                                Teacher
                            </button>
                        </div>
                    </div>

                    <form className="space-y-6" onSubmit={handleSignup}>
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

                        {role === 'teacher' && (
                            <div className="mt-4">
                                <label htmlFor="classAssigned" className="block text-sm font-medium text-gray-700">
                                    Class Assigned
                                </label>
                                <div className="mt-1">
                                    <select
                                        id="classAssigned"
                                        name="classAssigned"
                                        required
                                        value={classAssigned}
                                        onChange={(e) => setClassAssigned(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    >
                                        <option value="JSS 1">JSS 1</option>
                                        <option value="JSS 2">JSS 2</option>
                                        <option value="JSS 3">JSS 3</option>
                                        <option value="SS 1">SS 1</option>
                                        <option value="SS 2">SS 2</option>
                                        <option value="SS 3">SS 3</option>
                                    </select>
                                </div>
                                <p className="mt-1 text-[10px] text-gray-400 italic">As a teacher, you will only have access to students and results for this class.</p>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary text-primary hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                                Sign Up
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
                                    Already have an account?
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <Link to="/academics" className="font-medium text-primary hover:text-primary-dark">
                                Login Here
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcademicsSignup;
