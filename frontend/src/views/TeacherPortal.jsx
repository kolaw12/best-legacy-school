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
    const [teacherClass, setTeacherClass] = useState('');
    const [classStudents, setClassStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentRecords, setStudentRecords] = useState([]);

    useEffect(() => {
        const storedClass = localStorage.getItem('teacherClass');
        if (!storedClass) {
            setTeacherClass('JSS 1'); // Fallback
        } else {
            setTeacherClass(storedClass);
        }
        fetchResults(storedClass || 'JSS 1');
        fetchClassStudents(storedClass || 'JSS 1');
    }, [navigate]);

    const fetchClassStudents = async (className) => {
        try {
            const response = await axios.get(`${API_URL}/api/admissions/?class=${className}`);
            setClassStudents(response.data);
        } catch (error) {
            console.error('Error fetching class students:', error);
        }
    };

    const fetchResults = async (className) => {
        try {
            const response = await axios.get(`${API_URL}/api/results/${className ? `?student_class=${className}` : ''}`);
            setResults(response.data.slice(0, 20)); // Last 20 for this class
        } catch (error) {
            console.error('Error fetching results:', error);
        }
    };

    const fetchStudentRecords = async (studentId) => {
        try {
            const response = await axios.get(`${API_URL}/api/results/?student_id=${studentId}`);
            setStudentRecords(response.data);
        } catch (error) {
            console.error('Error fetching student records:', error);
        }
    };

    const handleStudentSelect = (student) => {
        setSelectedStudent(student);
        setResultData({ 
            ...resultData, 
            student_id: student.student_id, 
            student_name: student.student_name,
            subject: '',
            score: '',
            grade: ''
        });
        fetchStudentRecords(student.student_id);
        setIsEditing(false);
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
            const payload = { ...resultData, student_class: teacherClass };
            if (isEditing) {
                await axios.put(`${API_URL}/api/results/${resultData.id}/`, payload);
                setMessage('Result Updated Successfully!');
                setIsEditing(false);
            } else {
                await axios.post(`${API_URL}/api/results/`, payload);
                setMessage('Result Uploaded Successfully!');
            }
            setResultData({ ...resultData, subject: '', score: '', grade: '' });
            fetchResults(teacherClass);
            if (selectedStudent) {
                fetchStudentRecords(selectedStudent.student_id);
            }
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
                fetchResults(teacherClass);
                if (selectedStudent) {
                    fetchStudentRecords(selectedStudent.student_id);
                }
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
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-md border-l-8 border-primary">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Teacher Portal</h1>
                        <p className="text-primary font-bold uppercase tracking-widest text-[10px] bg-primary/10 px-3 py-1 rounded-full inline-block mt-2">
                            Academic Management • {teacherClass}
                        </p>
                    </div>
                    <button onClick={handleLogout} className="mt-4 md:mt-0 bg-red-50 text-red-600 border border-red-100 px-6 py-2 rounded-full font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm">
                        Logout
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar: Class Students */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 sticky top-8">
                            <h3 className="font-black text-gray-800 uppercase text-[10px] mb-4 border-b pb-2 tracking-widest">Students in {teacherClass}</h3>
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {classStudents.length > 0 ? (
                                    classStudents.map(student => (
                                        <div 
                                            key={student.student_id}
                                            onClick={() => handleStudentSelect(student)}
                                            className={`p-3 rounded border transition group cursor-pointer ${selectedStudent?.student_id === student.student_id ? 'bg-primary/10 border-primary' : 'bg-gray-50 border-transparent hover:border-primary hover:bg-primary/5'}`}
                                        >
                                            <p className="text-sm font-black text-gray-900 group-hover:text-primary transition">{student.student_name}</p>
                                            <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-tighter">{student.student_id}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 italic">No students found in this class.</p>
                                )}
                            </div>
                            <div className="mt-4 pt-4 border-t">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center leading-tight">Click a student name to load their details</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3 space-y-8">
                        {message && (
                            <div className={`p-4 rounded-lg font-bold text-sm shadow-sm flex items-center ${message.includes('Successfully') ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012-0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                                {message}
                            </div>
                        )}

                        {/* Student Records History (appears when student selected) */}
                        {selectedStudent && (
                            <div className="bg-white rounded-lg shadow-sm border-2 border-primary/20 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-primary/5">
                                    <div>
                                        <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest">Record History for {selectedStudent.student_name}</h3>
                                        <p className="text-[10px] text-primary font-bold">{selectedStudent.student_id} • All Subjects</p>
                                    </div>
                                    <button 
                                        onClick={() => handlePrint(selectedStudent.student_id)}
                                        className="text-[10px] bg-primary text-white px-4 py-1.5 rounded font-black uppercase tracking-widest hover:bg-primary-dark transition"
                                    >
                                        Print Slip
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-100">
                                        <thead className="bg-gray-50/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Term/Session</th>
                                                <th className="px-6 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Subject</th>
                                                <th className="px-6 py-3 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Score</th>
                                                <th className="px-6 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {studentRecords.length > 0 ? studentRecords.map((res) => (
                                                <tr key={res.id} className="hover:bg-primary/5 transition">
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs font-bold text-gray-700">{res.term}</p>
                                                        <p className="text-[9px] text-gray-400 font-bold">{res.session}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">{res.subject}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="px-3 py-1 bg-white border border-gray-200 rounded font-black text-primary text-sm shadow-sm">{res.score}</span>
                                                        <span className="ml-1 text-[10px] font-black text-gray-400">{res.grade}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <button onClick={() => handleEdit(res)} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Edit</button>
                                                        <button onClick={() => handleDelete(res.id)} className="text-[10px] font-black text-red-600 uppercase hover:underline">Delete</button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400 italic text-xs">No records found for this student.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Result Form */}
                        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                            <h2 className="text-xl font-black text-gray-800 mb-6 border-b-2 border-primary/20 pb-2 uppercase tracking-widest flex items-center">
                                {isEditing ? 'Update Academic Result' : 'Upload New Result'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Student ID</label>
                                        <input type="text" name="student_id" required value={resultData.student_id} onChange={handleChange} className="w-full border-2 border-gray-100 rounded-lg py-2.5 px-4 focus:border-primary outline-none transition font-bold" placeholder="BLS/2026/XXX" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Full Name</label>
                                        <input type="text" name="student_name" required value={resultData.student_name} onChange={handleChange} className="w-full border-2 border-gray-100 rounded-lg py-2.5 px-4 focus:border-primary outline-none transition font-bold" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Subject</label>
                                        <input type="text" name="subject" required value={resultData.subject} onChange={handleChange} className="w-full border-2 border-gray-100 rounded-lg py-2.5 px-4 focus:border-primary outline-none transition font-bold" placeholder="e.g. Mathematics" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Score</label>
                                            <input type="number" name="score" required value={resultData.score} onChange={handleScoreChange} max="100" min="0" className="w-full border-2 border-gray-100 rounded-lg py-2.5 px-4 focus:border-primary outline-none transition font-bold text-center text-xl" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Grade</label>
                                            <input type="text" readOnly value={resultData.grade} className="w-full bg-gray-50 border-2 border-gray-100 rounded-lg py-2.5 px-4 text-center font-black text-xl text-primary" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Term</label>
                                        <select name="term" value={resultData.term} onChange={handleChange} className="w-full border-2 border-gray-100 rounded-lg py-2.5 px-4 focus:border-primary outline-none transition font-bold">
                                            <option>First Term</option>
                                            <option>Second Term</option>
                                            <option>Third Term</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Session</label>
                                        <input type="text" name="session" value={resultData.session} onChange={handleChange} className="w-full border-2 border-gray-100 rounded-lg py-2.5 px-4 focus:border-primary outline-none transition font-bold" />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button type="submit" className="flex-1 bg-primary text-white font-black py-4 rounded-lg shadow-lg hover:bg-primary-dark transition-all transform hover:-translate-y-1 active:scale-95 uppercase tracking-widest">
                                        {isEditing ? 'Save Changes' : 'Upload Result Now'}
                                    </button>
                                    {isEditing && (
                                        <button type="button" onClick={() => { setIsEditing(false); setResultData({...resultData, subject: '', score: '', grade: ''}); }} className="px-8 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition">
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Recent results Table */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest">Recent Records in {teacherClass}</h3>
                                <span className="text-[10px] bg-gray-200 px-2 py-1 rounded font-bold text-gray-600 uppercase italic">Showing last 20</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-white">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject/Score</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {results.map((res) => (
                                            <tr key={res.id} className="hover:bg-gray-50/50 transition">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-black text-gray-900">{res.student_name}</p>
                                                    <p className="text-[10px] font-mono text-gray-400 font-bold">{res.student_id}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-gray-700">{res.subject}</span>
                                                    <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-black">{res.score} ({res.grade})</span>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-3">
                                                    <button onClick={() => handleEdit(res)} className="text-xs font-black text-indigo-600 uppercase hover:underline">Edit</button>
                                                    <button onClick={() => handleDelete(res.id)} className="text-xs font-black text-red-600 uppercase hover:underline">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {results.length === 0 && (
                                            <tr><td colSpan="3" className="px-6 py-12 text-center text-gray-400 italic text-sm">No results recorded for this class yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Print Tool */}
                        <div className="bg-gradient-to-r from-green-600 to-green-500 p-8 rounded-2xl shadow-xl border-4 border-white">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="text-white">
                                    <h4 className="text-2xl font-black italic tracking-tighter uppercase">Report Card Generator</h4>
                                    <p className="text-green-50 font-medium text-sm leading-snug mt-1 opacity-90">Generate a full session record for any student in your class.</p>
                                </div>
                                <div className="flex-1 w-full flex gap-3">
                                    <input 
                                        type="text" 
                                        placeholder="Enter Reg No" 
                                        value={searchId}
                                        onChange={(e) => setSearchId(e.target.value)}
                                        className="flex-1 bg-white/20 border-2 border-white/30 rounded-xl px-5 py-3 text-white placeholder-white/60 focus:bg-white focus:text-gray-900 focus:outline-none transition-all font-black text-lg shadow-inner"
                                    />
                                    <button 
                                        onClick={() => handlePrint(searchId || resultData.student_id)} 
                                        className="bg-white text-green-600 px-8 py-3 rounded-xl font-black hover:bg-green-50 transition-all shadow-lg active:scale-95 uppercase tracking-widest"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Overlay */}
            {printingData && (
                <div className="fixed inset-0 bg-white z-[9999] p-4 md:p-12 printable-area overflow-auto">
                    <style>{`
                        @media print {
                            body * { visibility: hidden; }
                            .printable-area, .printable-area * { visibility: visible; }
                            .printable-area { position: absolute; left: 0; top: 0; width: 100%; border: none; }
                        }
                    `}</style>
                    <div className="border-[12px] border-double border-primary p-6 md:p-12 max-w-5xl mx-auto bg-white shadow-2xl">
                        <div className="text-center border-b-4 border-primary pb-8 mb-10">
                            <h2 className="text-4xl md:text-6xl font-black text-primary tracking-tighter italic leading-none">BEST LEGACY DIVINE SCHOOL</h2>
                            <p className="text-xl md:text-2xl font-bold text-gray-700 uppercase tracking-[0.3em] mt-3">To the Glory of God</p>
                            <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 mt-4 text-[10px] md:text-xs text-gray-500 font-black uppercase tracking-widest">
                                <span>Lagos, Nigeria</span>
                                <span className="hidden md:inline">•</span>
                                <span>Academic Excellence</span>
                                <span className="hidden md:inline">•</span>
                                <span>Moral Integrity</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                            <div className="space-y-4 border-l-4 border-primary/20 pl-6">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Student Particulars</p>
                                    <p className="text-3xl font-black text-gray-900 leading-none">{printingData.student_name}</p>
                                </div>
                                <div className="flex gap-8">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Class</p>
                                        <p className="text-lg font-black text-gray-800">{teacherClass}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reg No</p>
                                        <p className="text-lg font-mono font-bold text-primary">{printingData.student_id}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col justify-between">
                                <div className="flex justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Academic Session</p>
                                        <p className="text-base font-bold text-gray-800">{printingData.session}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Term</p>
                                        <p className="text-base font-bold text-gray-800">{printingData.term}</p>
                                    </div>
                                </div>
                                <div className="text-right border-t border-gray-200 mt-4 pt-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Official Internal Document</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-12">
                            <table className="min-w-full border-4 border-primary">
                                <thead className="bg-primary">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-white uppercase tracking-[0.2em]">Subject Title</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-white uppercase tracking-[0.2em]">Score</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-white uppercase tracking-[0.2em]">Grade</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-white uppercase tracking-[0.2em]">Verdict</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y-2 divide-gray-100">
                                    {printingData.results.map((r, idx) => (
                                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                                            <td className="px-6 py-4 text-sm font-black text-gray-800 uppercase tracking-tighter">{r.subject}</td>
                                            <td className="px-6 py-4 text-center text-xl font-black text-primary border-x-2 border-gray-50">{r.score}</td>
                                            <td className="px-6 py-4 text-center text-xl font-black text-gray-900 border-r-2 border-gray-50">{r.grade}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${parseInt(r.score) >= 70 ? 'bg-green-100 text-green-700' : parseInt(r.score) >= 40 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                    {parseInt(r.score) >= 70 ? 'Excellent' : parseInt(r.score) >= 60 ? 'V.Good' : parseInt(r.score) >= 50 ? 'Good' : parseInt(r.score) >= 40 ? 'Pass' : 'Weak'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-primary/5">
                                    <tr className="border-t-4 border-primary">
                                        <td className="px-6 py-6 text-sm font-black text-primary uppercase tracking-widest">Aggregate Performance</td>
                                        <td className="px-6 py-6 text-center">
                                            <p className="text-3xl font-black text-primary leading-none">{printingData.results.reduce((acc, curr) => acc + parseInt(curr.score), 0)}</p>
                                            <p className="text-[10px] text-gray-400 font-black mt-1 uppercase">Total Points</p>
                                        </td>
                                        <td className="px-6 py-6 text-center bg-primary/10" colSpan="2">
                                            <p className="text-4xl font-black text-primary leading-none italic">{(printingData.results.reduce((acc, curr) => acc + parseInt(curr.score), 0) / printingData.results.length).toFixed(1)}%</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase mt-2 tracking-widest">Weighted Average</p>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mt-20 px-4 md:px-10">
                            <div className="text-center pt-6 border-t-[3px] border-gray-900">
                                <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Class Teacher</p>
                                <p className="text-[10px] text-gray-400 italic mt-1 font-bold italic lowercase">E-Signed via Portal</p>
                            </div>
                            <div className="text-center pt-6 border-t-[3px] border-gray-900">
                                <p className="text-xs font-black text-gray-900 uppercase tracking-widest">School Principal</p>
                                <p className="text-[10px] text-gray-400 italic mt-1 font-bold italic uppercase">Stamp Required</p>
                            </div>
                        </div>
                        
                        <div className="mt-20 pt-8 border-t border-gray-200 text-[9px] text-gray-400 text-center uppercase tracking-[0.4em] font-black flex flex-wrap justify-center gap-x-8 gap-y-2">
                            <span>Official Academic Transcript</span>
                            <span className="hidden md:inline">|</span>
                            <span>Best Legacy Divine School</span>
                            <span className="hidden md:inline">|</span>
                            <span>{new Date().getFullYear()} Session</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherPortal;
