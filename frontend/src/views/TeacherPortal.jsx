import { useState, useEffect } from 'react';
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
    const [printingResult, setPrintingResult] = useState(null);
    const [results, setResults] = useState([]);
    const [message, setMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/results/`);
            setResults(response.data.slice(0, 10)); // Just the last 10 for management
        } catch (error) {
            console.error('Error fetching results from:', `${API_URL}/api/results/`);
            if (error.response) {
                console.error('Status Code:', error.response.status);
                console.error('Response Data:', error.response.data);
            }
        }
    };

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
        setMessage('Processing...');
        try {
            if (isEditing) {
                await axios.put(`${API_URL}/api/results/${resultData.id}/`, resultData);
                setMessage('Result Updated Successfully!');
                setIsEditing(false);
            } else {
                await axios.post(`${API_URL}/api/results/`, resultData);
                setMessage('Result Uploaded Successfully!');
            }
            setResultData({ ...resultData, subject: '', score: '', grade: '' });
            fetchResults();
        } catch (error) {
            console.error('Error saving result to:', `${API_URL}/api/results/`);
            if (error.response) {
                console.error('Status Code:', error.response.status);
                console.error('Response Data:', error.response.data);
            }
            setMessage('Error saving result.');
        }
    };

    const handleEdit = (result) => {
        setResultData(result);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this result?')) {
            try {
                await axios.delete(`${API_URL}/api/results/${id}/`);
                fetchResults();
                setMessage('Result Deleted Successfully');
            } catch (error) {
                console.error('Error deleting result:', error);
            }
        }
    };

    const handlePrint = (result) => {
        setPrintingResult(result);
        setTimeout(() => {
            window.print();
            setPrintingResult(null);
        }, 500);
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

                        <div className="pt-4 flex space-x-4">
                            <button type="submit" className="flex-1 inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark transition duration-300">
                                {isEditing ? 'Update Result' : 'Upload Result'}
                            </button>
                            {isEditing && (
                                <button type="button" onClick={() => { setIsEditing(false); setResultData({...resultData, subject: '', score: '', grade: ''}); }} className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Manage Section */}
                    <div className="mt-12">
                        <h3 className="text-xl font-bold text-gray-900 border-b-2 border-primary/10 pb-2 mb-6">Manage Recent Uploads</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subject</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Score</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {results.map((res) => (
                                        <tr key={res.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-primary">{res.student_id}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{res.student_name}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{res.subject}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold">{res.score} ({res.grade})</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm space-x-3">
                                                <button onClick={() => handleEdit(res)} className="text-indigo-600 hover:text-indigo-900 font-bold">Edit</button>
                                                <button onClick={() => handleDelete(res.id)} className="text-red-600 hover:text-red-900 font-bold">Delete</button>
                                                <button onClick={() => handlePrint(res)} className="text-green-600 hover:text-green-900 font-bold ml-3 flex inline-flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                                    Print
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {results.length === 0 && (
                                        <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">No results uploaded yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Printable Result Slip (Hidden normally) */}
            {printingResult && (
                <div className="fixed inset-0 bg-white z-[9999] p-12 printable-area">
                    <style>{`
                        @media print {
                            body * { visibility: hidden; }
                            .printable-area, .printable-area * { visibility: visible; }
                            .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
                        }
                    `}</style>
                    <div className="border-4 border-double border-primary p-8 max-w-2xl mx-auto">
                        <div className="text-center border-b-2 border-primary pb-4 mb-6">
                            <h2 className="text-4xl font-black text-primary tracking-tighter">BEST LEGACY DIVINE SCHOOL</h2>
                            <p className="text-sm font-bold text-gray-600 uppercase">Excellence in Learning, Wisdom in Character</p>
                            <p className="text-xs text-gray-500 mt-1">Lagos, Nigeria | info@bestlegacy.school</p>
                        </div>
                        
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 underline">STUDENT RESULT SLIP</h3>
                                <p className="mt-4"><span className="font-bold text-gray-600 uppercase text-xs">Student Name:</span> <br/><span className="text-lg font-black">{printingResult.student_name}</span></p>
                                <p className="mt-2"><span className="font-bold text-gray-600 uppercase text-xs">Registration No:</span> <br/><span className="text-lg font-mono font-bold text-primary">{printingResult.student_id}</span></p>
                            </div>
                            <div className="text-right">
                                <p><span className="font-bold text-gray-600 uppercase text-xs">Session:</span> <br/><span className="font-bold">{printingResult.session}</span></p>
                                <p className="mt-2"><span className="font-bold text-gray-600 uppercase text-xs">Term:</span> <br/><span className="font-bold">{printingResult.term}</span></p>
                                <p className="mt-2"><span className="font-bold text-gray-600 uppercase text-xs">Date Printed:</span> <br/><span className="font-medium text-sm">{new Date().toLocaleDateString()}</span></p>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="border-r border-gray-300">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Subject</p>
                                    <p className="text-xl font-black text-gray-900">{printingResult.subject}</p>
                                </div>
                                <div className="border-r border-gray-300">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Score</p>
                                    <p className="text-3xl font-black text-primary">{printingResult.score}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase">Grade</p>
                                    <p className="text-3xl font-black text-primary">{printingResult.grade}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 flex justify-between items-end">
                            <div className="text-center w-40">
                                <div className="border-t border-gray-400 pt-1 text-xs font-bold uppercase text-gray-500">Class Teacher</div>
                            </div>
                            <div className="text-center w-40">
                                <div className="border-t border-gray-400 pt-1 text-xs font-bold uppercase text-gray-500">Principal</div>
                            </div>
                        </div>
                        
                        <div className="mt-12 pt-4 border-t border-gray-100 text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">
                            Official Academic Record - Generated Digitally
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherPortal;
