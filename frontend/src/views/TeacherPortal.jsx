import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

const TeacherPortal = () => {
    const navigate = useNavigate();
    const [resultData, setResultData] = useState({
        student_id: '',
        student_name: '',
        subject: '',
        score: '',
        grade: '',
        term: 'First Term',
        session: '2025/2026'
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setResultData({ ...resultData, [e.target.name]: e.target.value });
    };

    const calculateGrade = (score) => {
        const s = parseInt(score);
        if (s >= 70) return 'A';
        if (s >= 60) return 'B';
        if (s >= 50) return 'C';
        if (s >= 45) return 'D';
        if (s >= 40) return 'E';
        return 'F';
    };

    const handleScoreChange = (e) => {
        const score = e.target.value;
        const grade = calculateGrade(score);
        setResultData({ ...resultData, score: score, grade: grade });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('Uploading...');
        try {
            await axios.post(`${API_URL}/api/results/`, resultData);
            setMessage('Result Uploaded Successfully!');
            setResultData({ ...resultData, subject: '', score: '', grade: '' }); // Reset fields but keep student info for faster entry
        } catch (error) {
            console.error('Error uploading result:', error);
            setMessage('Error uploading result.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userRole');
        navigate('/academics');
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-primary px-6 py-4 flex justify-between items-center text-white">
                    <h1 className="text-2xl font-bold">Teacher Portal - Result Upload</h1>
                    <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm">Logout</button>
                </div>
                
                <div className="p-8">
                    {message && (
                        <div className={`mb-6 p-4 rounded ${message.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Student Info</h3>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Student ID / Reg No</label>
                                <input type="text" name="student_id" required value={resultData.student_id} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. BLS/2025/001" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Student Name</label>
                                <input type="text" name="student_name" required value={resultData.student_name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>

                            <div className="md:col-span-2">
                                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4 mt-4">Result Details</h3>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Term</label>
                                <select name="term" value={resultData.term} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                                    <option>First Term</option>
                                    <option>Second Term</option>
                                    <option>Third Term</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Session</label>
                                <input type="text" name="session" value={resultData.session} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Subject</label>
                                <input type="text" name="subject" required value={resultData.subject} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. Mathematics" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Score (0-100)</label>
                                <input type="number" name="score" required value={resultData.score} onChange={handleScoreChange} max="100" min="0" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Grade (Auto-calc)</label>
                                <input type="text" name="grade" readOnly value={resultData.grade} className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-500 sm:text-sm" />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button type="submit" className="w-full inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-300">
                                Upload Result
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TeacherPortal;
