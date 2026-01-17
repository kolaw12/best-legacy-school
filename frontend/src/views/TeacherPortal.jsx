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
    const [printingData, setPrintingData] = useState(null);
    const [results, setResults] = useState([]);
    const [searchId, setSearchId] = useState('');
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

    const handlePrint = async (studentId) => {
        setMessage('Generating Report Card...');
        try {
            const response = await axios.get(`${API_URL}/api/results/?student_id=${studentId}`);
            if (response.data.length > 0) {
                setPrintingData({
                    student_id: studentId,
                    student_name: response.data[0].student_name,
                    session: response.data[0].session,
                    term: response.data[0].term,
                    results: response.data
                });
                setMessage('');
                setTimeout(() => {
                    window.print();
                    setPrintingData(null);
                }, 500);
            } else {
                setMessage('No results found for this student.');
            }
        } catch (error) {
            console.error('Error fetching student results for print:', error);
            setMessage('Error generating report card.');
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
                                            </td>
                                        </tr>
                                    ))}
                                    {results.length === 0 && (
                                        <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">No results uploaded yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Print Quick Tool */}
                        <div className="mt-8 bg-green-50 p-6 rounded-xl border-2 border-dashed border-green-200">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-lg font-black text-green-800">Print Comprehensive Report Card</h4>
                                    <p className="text-sm text-green-700">Type a Student ID below to generate their full term record.</p>
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="BLS/2026/001" 
                                        value={searchId}
                                        onChange={(e) => setSearchId(e.target.value)}
                                        className="border-2 border-green-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none text-sm font-bold w-40"
                                    />
                                    <button 
                                        onClick={() => handlePrint(searchId || resultData.student_id)} 
                                        className="bg-green-600 text-white px-6 py-2 rounded-md font-black hover:bg-green-700 transition flex items-center shadow-md"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                        GENERATE REPORT
                                    </button>
                                </div>
                            </div>
                            {resultData.student_id && !searchId && (
                                <p className="text-[10px] text-green-600 font-bold mt-2 uppercase tracking-tighter italic">Tip: Currently selected student ({resultData.student_id}) will be used if search is empty.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Printable Report Card (Hidden normally) */}
            {printingData && (
                <div className="fixed inset-0 bg-white z-[9999] p-12 printable-area overflow-auto">
                    <style>{`
                        @media print {
                            body * { visibility: hidden; }
                            .printable-area, .printable-area * { visibility: visible; }
                            .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
                        }
                    `}</style>
                    <div className="border-8 border-double border-primary p-10 max-w-4xl mx-auto bg-white">
                        <div className="text-center border-b-4 border-primary pb-6 mb-8">
                            <h2 className="text-5xl font-black text-primary tracking-tighter italic">BEST LEGACY DIVINE SCHOOL</h2>
                            <p className="text-lg font-bold text-gray-700 uppercase tracking-widest mt-2">To the Glory of God</p>
                            <div className="flex justify-center space-x-4 mt-2 text-sm text-gray-500 font-bold uppercase">
                                <span>Lagos, Nigeria</span>
                                <span>•</span>
                                <span>info@bestlegacy.school</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8 mb-10 bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <div className="space-y-3">
                                <p><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Name</span><br/><span className="text-2xl font-black text-gray-900">{printingData.student_name}</span></p>
                                <p><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Registration No</span><br/><span className="text-xl font-mono font-bold text-primary">{printingData.student_id}</span></p>
                            </div>
                            <div className="text-right space-y-3">
                                <p><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Academic Session</span><br/><span className="text-lg font-bold text-gray-800">{printingData.session}</span></p>
                                <p><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Term</span><br/><span className="text-lg font-bold text-gray-800">{printingData.term}</span></p>
                                <p><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date Issued</span><br/><span className="text-sm font-bold text-gray-500">{new Date().toLocaleDateString()}</span></p>
                            </div>
                        </div>

                        <div className="mb-10">
                            <table className="min-w-full border-2 border-gray-200">
                                <thead className="bg-primary">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-wider border-b-2 border-primary-dark">Subject Name</th>
                                        <th className="px-6 py-3 text-center text-xs font-black text-white uppercase tracking-wider border-b-2 border-primary-dark">Score (100)</th>
                                        <th className="px-6 py-3 text-center text-xs font-black text-white uppercase tracking-wider border-b-2 border-primary-dark">Grade</th>
                                        <th className="px-6 py-3 text-center text-xs font-black text-white uppercase tracking-wider border-b-2 border-primary-dark">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y-2 divide-gray-100">
                                    {printingData.results.map((r, idx) => (
                                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-700 border-r border-gray-100 uppercase">{r.subject}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-black text-primary border-r border-gray-100">{r.score}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-black text-gray-900 border-r border-gray-100">{r.grade}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold text-gray-500">
                                                {parseInt(r.score) >= 70 ? 'Distinction' : parseInt(r.score) >= 60 ? 'Credit' : parseInt(r.score) >= 40 ? 'Pass' : 'Fail'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-primary/5">
                                    <tr className="border-t-4 border-primary/20">
                                        <td className="px-6 py-4 text-sm font-black text-primary uppercase border-r border-gray-200">Aggregate Total</td>
                                        <td className="px-6 py-4 text-center text-2xl font-black text-primary border-r border-gray-200">
                                            {printingData.results.reduce((acc, curr) => acc + parseInt(curr.score), 0)}
                                            <span className="text-xs text-gray-400 font-bold ml-1">/{printingData.results.length * 100}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-2xl font-black text-primary" colSpan="2">
                                            {(printingData.results.reduce((acc, curr) => acc + parseInt(curr.score), 0) / printingData.results.length).toFixed(1)}%
                                            <p className="text-[10px] font-black text-gray-400 uppercase -mt-1">Average Percentage</p>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="grid grid-cols-2 gap-12 mt-16 px-10">
                            <div className="text-center pt-4 border-t-2 border-gray-400">
                                <p className="text-sm font-black text-gray-900 uppercase">Class Teacher's Signature</p>
                            </div>
                            <div className="text-center pt-4 border-t-2 border-gray-400">
                                <p className="text-sm font-black text-gray-900 uppercase">Principal's Signature & Stamp</p>
                            </div>
                        </div>
                        
                        <div className="mt-16 pt-6 border-t border-gray-100 text-[10px] text-gray-400 text-center uppercase tracking-widest font-black flex justify-center space-x-4">
                            <span>Official Academic Record</span>
                            <span>|</span>
                            <span>Generated by BLS Digital Portal</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherPortal;
