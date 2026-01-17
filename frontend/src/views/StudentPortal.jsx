import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StudentPortal = () => {
    const navigate = useNavigate();
    const [studentId, setStudentId] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedId = localStorage.getItem('studentId');
        if (!storedId) {
            navigate('/academics');
            return;
        }
        setStudentId(storedId);
        fetchResults(storedId);
    }, [navigate]);

    const fetchResults = async (id) => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/results/?student_id=${id}`);
            setResults(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching results:', error);
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userRole');
        localStorage.removeItem('studentId');
        navigate('/academics');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Student Portal</h1>
                        <p className="text-gray-600 mt-1">Reg No: <span className="font-mono font-bold">{studentId}</span></p>
                    </div>
                    <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
                </div>

                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Academic Results</h2>
                    </div>
                    
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading results...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {results.map((result) => (
                                        <tr key={result.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.subject}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.score}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">{result.grade}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.term}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.session}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${result.score >= 40 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {result.score >= 40 ? 'PASS' : 'FAIL'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {results.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                No results found for this ID.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentPortal;
