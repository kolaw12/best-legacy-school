import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

const StudentPortal = () => {
    const navigate = useNavigate();
    const [studentId, setStudentId] = useState('');
    const [results, setResults] = useState([]);
    const [studentData, setStudentData] = useState(null);
    const [selectedTerm, setSelectedTerm] = useState('First Term');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedId = localStorage.getItem('studentId');
        if (!storedId) {
            navigate('/academics');
            return;
        }
        setStudentId(storedId);
        fetchResults(storedId, selectedTerm);
        fetchStudentData(storedId);
    }, [navigate, selectedTerm]);

    const fetchStudentData = async (id) => {
        try {
            const response = await axios.get(`${API_URL}/api/admissions/?student_id=${id}`);
            if (response.data && response.data.length > 0) {
                setStudentData(response.data[0]);
            }
        } catch (error) {
            console.error('Error fetching student data:', error);
        }
    };

    const fetchResults = async (id, term) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/results/?student_id=${id}&term=${term}`);
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

    const [imgError, setImgError] = useState(false);

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        // Handle cases where path might or might not have leading slash
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${API_URL}${cleanPath}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center space-x-6">
                        {studentData?.passport_photo && !imgError ? (
                            <img 
                                src={getImageUrl(studentData.passport_photo)} 
                                alt="Student" 
                                onError={() => setImgError(true)}
                                className="h-24 w-24 rounded-full object-cover border-4 border-primary/20"
                            />
                        ) : (
                            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 border-4 border-gray-100">
                                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{studentData?.student_name || 'Student Portal'}</h1>
                            <p className="text-gray-600 mt-1 uppercase tracking-wider text-sm">
                                Reg No: <span className="font-mono font-bold text-primary">{studentId}</span>
                            </p>
                            {studentData?.class_applying_for && (
                                <p className="text-gray-500 text-sm">Class: {studentData.class_applying_for}</p>
                            )}
                        </div>
                    </div>
                    <button onClick={handleLogout} className="mt-4 md:mt-0 bg-red-50 text-red-600 border border-red-100 px-6 py-2 rounded-full font-medium hover:bg-red-600 hover:text-white transition-all shadow-sm">
                        Logout
                    </button>
                </div>

                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center bg-gray-50/50 gap-4">
                        <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Academic Results</h2>
                        <div className="flex bg-gray-200 p-1 rounded-lg shadow-inner">
                            {['First Term', 'Second Term', 'Third Term'].map((term) => (
                                <button
                                    key={term}
                                    onClick={() => setSelectedTerm(term)}
                                    className={`px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-widest transition-all ${
                                        selectedTerm === term 
                                        ? 'bg-white text-primary shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {term.split(' ')[0]}
                                </button>
                            ))}
                        </div>
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
                                    {results.length > 0 && (
                                        <tr className="bg-primary/5 font-black text-gray-900 border-t-2 border-primary/20">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-black uppercase text-primary">AGGREGATE TOTAL</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-lg text-primary">
                                                {results.reduce((acc, curr) => acc + parseInt(curr.score || 0), 0)}
                                                <span className="text-[10px] text-gray-400 font-bold ml-1">/ {results.length * 100}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-2xl" colSpan="2">
                                                {(results.reduce((acc, curr) => acc + parseInt(curr.score || 0), 0) / results.length).toFixed(1)}%
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter -mt-1">Average Score</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase font-bold" colSpan="2 text-right">
                                                {results.length} Subjects Recorded
                                            </td>
                                        </tr>
                                    )}
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
