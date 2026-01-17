import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

const AdminDashboard = () => {
    const [inquiries, setInquiries] = useState([]);
    const [admissions, setAdmissions] = useState([]);
    const [activeTab, setActiveTab] = useState('inquiries'); // 'inquiries' | 'admissions'
    const [editingAdmission, setEditingAdmission] = useState(null);
    const [viewingAdmission, setViewingAdmission] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile toggle
    const navigate = useNavigate();

    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin');
        if (!isAdmin) {
            navigate('/admin-login');
            return;
        }
        fetchInquiries();
        fetchAdmissions();
    }, [navigate]);

    const fetchInquiries = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/inquiries/`);
            setInquiries(response.data);
        } catch (error) {
            console.error('Error fetching inquiries from:', `${API_URL}/api/inquiries/`);
            console.error('Detailed Error:', error.message);
            if (error.response) {
                console.error('Status Code:', error.response.status);
                console.error('Response Data:', error.response.data);
            }
        }
    };

    const fetchAdmissions = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/admissions/`);
            setAdmissions(response.data);
        } catch (error) {
            console.error('Error fetching admissions from:', `${API_URL}/api/admissions/`);
            console.error('Detailed Error:', error.message);
            if (error.response) {
                console.error('Status Code:', error.response.status);
            }
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await axios.patch(`${API_URL}/api/inquiries/${id}/`, { status: newStatus });
            fetchInquiries();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleEditAdmission = (admission) => {
        setEditingAdmission(admission);
        setViewingAdmission(null);
    };

    const handleViewAdmission = (admission) => {
        setViewingAdmission(admission);
        setEditingAdmission(null);
    };

    const handleDeleteAdmission = async (id) => {
        if (window.confirm('Are you sure you want to delete this student record? This action cannot be undone.')) {
            try {
                await axios.delete(`${API_URL}/api/admissions/${id}/`);
                fetchAdmissions();
                setViewingAdmission(null);
                setEditingAdmission(null);
            } catch (error) {
                console.error('Error deleting admission:', error);
                alert('Failed to delete the record.');
            }
        }
    };

    const handleUpdateAdmission = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_URL}/api/admissions/${editingAdmission.id}/`, editingAdmission);
            setEditingAdmission(null);
            fetchAdmissions();
        } catch (error) {
            console.error('Error updating admission:', error);
        }
    };

    const handleAdmissionChange = (e) => {
        setEditingAdmission({ ...editingAdmission, [e.target.name]: e.target.value });
    };

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        navigate('/');
    };

    // --- Components ---

    const Sidebar = () => (
        <div className={`fixed inset-y-0 left-0 bg-gray-900 w-64 text-white transition-transform transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:inset-auto z-20 flex flex-col`}>
            <div className="flex items-center justify-center h-20 border-b border-gray-800">
                <h1 className="text-2xl font-bold">Admin Panel</h1>
            </div>
            <nav className="flex-1 px-4 py-8 space-y-4">
                <button 
                    onClick={() => { setActiveTab('inquiries'); setSidebarOpen(false); }}
                    className={`flex items-center w-full px-4 py-3 rounded transition-colors ${activeTab === 'inquiries' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                >
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    Inquiries
                </button>
                <button 
                    onClick={() => { setActiveTab('admissions'); setSidebarOpen(false); }}
                    className={`flex items-center w-full px-4 py-3 rounded transition-colors ${activeTab === 'admissions' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                >
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    Admissions
                </button>
            </nav>
            <div className="p-4 border-t border-gray-800">
                <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    Logout
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <Sidebar />
            
            {/* Mobile Overlay */}
            {sidebarOpen && <div className="fixed inset-0 bg-black opacity-50 z-10 md:hidden" onClick={() => setSidebarOpen(false)}></div>}

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="flex justify-between items-center py-4 px-6 bg-white shadow-sm md:hidden">
                    <button onClick={() => setSidebarOpen(true)} className="text-gray-500 focus:outline-none">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>
                    <span className="text-lg font-bold">Best Legacy Admin</span>
                    <div></div> {/* Spacer */}
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6 capitalize">{activeTab} Management</h2>

                        {activeTab === 'inquiries' && (
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                                <ul className="divide-y divide-gray-200">
                                    {inquiries.map((inquiry) => (
                                        <li key={inquiry.id} className="p-6 hover:bg-gray-50 transition">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-lg font-medium text-primary">{inquiry.subject}</h3>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                                                    ${inquiry.status === 'new' ? 'bg-green-100 text-green-800' : 
                                                      inquiry.status === 'read' ? 'bg-yellow-100 text-yellow-800' : 
                                                      'bg-gray-100 text-gray-800'}`}>
                                                    {inquiry.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-4">{inquiry.name} • {inquiry.email}</p>
                                            <p className="text-gray-700 bg-gray-50 p-3 rounded mb-4">{inquiry.message}</p>
                                             <div className="flex space-x-3">
                                                 {inquiry.status === 'new' && (
                                                    <button onClick={() => updateStatus(inquiry.id, 'read')} className="text-indigo-600 hover:text-indigo-900 font-medium">Mark as Read</button>
                                                )}
                                                {inquiry.status !== 'responded' && (
                                                    <button onClick={() => updateStatus(inquiry.id, 'responded')} className="text-green-600 hover:text-green-900 font-medium">Mark as Responded</button>
                                                )}
                                                <p className="text-xs text-gray-400 ml-auto pt-2">{new Date(inquiry.created_at).toLocaleString()}</p>
                                            </div>
                                        </li>
                                    ))}
                                    {inquiries.length === 0 && <li className="p-6 text-center text-gray-500">No inquiries found.</li>}
                                </ul>
                            </div>
                        )}

                        {activeTab === 'admissions' && (
                            <div className="bg-white shadow rounded-lg p-6">
                                {viewingAdmission ? (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center border-b pb-4">
                                            <h3 className="text-2xl font-bold text-gray-900">Application Details</h3>
                                            <button onClick={() => setViewingAdmission(null)} className="text-gray-400 hover:text-gray-600">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-blue-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600 mb-1">Student ID</p>
                                                <p className="text-lg font-bold text-primary">{viewingAdmission.student_id}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600 mb-1">Application Date</p>
                                                <p className="text-lg font-semibold">{new Date(viewingAdmission.created_at).toLocaleDateString()}</p>
                                            </div>
                                            {viewingAdmission.passport_photo && (
                                                <div className="md:col-span-2 flex justify-center py-4">
                                                    <div className="bg-white p-2 border rounded shadow-sm">
                                                        <img 
                                                            src={viewingAdmission.passport_photo.startsWith('http') ? viewingAdmission.passport_photo : `${API_URL}${viewingAdmission.passport_photo}`} 
                                                            alt="Passport Photograph" 
                                                            className="h-40 w-40 object-cover rounded"
                                                        />
                                                        <p className="text-center text-xs text-gray-500 mt-2 font-medium uppercase tracking-wider">Passport Photograph</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t pt-6">
                                            <h4 className="text-lg font-bold text-gray-900 mb-4">Student Information</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-600">Full Name</p>
                                                    <p className="font-medium">{viewingAdmission.student_name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Date of Birth</p>
                                                    <p className="font-medium">{viewingAdmission.date_of_birth}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Gender</p>
                                                    <p className="font-medium">{viewingAdmission.gender === 'M' ? 'Male' : 'Female'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Class Applying For</p>
                                                    <p className="font-medium">{viewingAdmission.class_applying_for}</p>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <p className="text-sm text-gray-600">Previous School</p>
                                                    <p className="font-medium">{viewingAdmission.previous_school || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t pt-6">
                                            <h4 className="text-lg font-bold text-gray-900 mb-4">Parent/Guardian Information</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-600">Parent/Guardian Name</p>
                                                    <p className="font-medium">{viewingAdmission.parent_name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Phone Number</p>
                                                    <p className="font-medium">{viewingAdmission.phone_number}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Email Address</p>
                                                    <p className="font-medium">{viewingAdmission.email}</p>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <p className="text-sm text-gray-600">Address</p>
                                                    <p className="font-medium">{viewingAdmission.address}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end space-x-3 pt-6 border-t">
                                            <button onClick={() => handleDeleteAdmission(viewingAdmission.id)} className="bg-red-500 text-white py-2 px-6 rounded-md shadow-sm hover:bg-red-600 font-medium">
                                                Delete Record
                                            </button>
                                            <button onClick={() => handleEditAdmission(viewingAdmission)} className="bg-primary text-white py-2 px-6 rounded-md shadow-sm hover:bg-primary-dark font-medium">
                                                Edit Information
                                            </button>
                                        </div>
                                    </div>
                                ) : editingAdmission ? (
                                    <form onSubmit={handleUpdateAdmission} className="space-y-6">
                                        <div className="flex justify-between items-center border-b pb-4">
                                            <h3 className="text-xl font-bold text-gray-900">Edit Applicant: {editingAdmission.student_name}</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Student Name</label>
                                                <input type="text" name="student_name" value={editingAdmission.student_name} onChange={handleAdmissionChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                                <input type="date" name="date_of_birth" value={editingAdmission.date_of_birth} onChange={handleAdmissionChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Gender</label>
                                                <select name="gender" value={editingAdmission.gender} onChange={handleAdmissionChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm">
                                                    <option value="M">Male</option>
                                                    <option value="F">Female</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Class</label>
                                                <input type="text" name="class_applying_for" value={editingAdmission.class_applying_for} onChange={handleAdmissionChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Previous School</label>
                                                <input type="text" name="previous_school" value={editingAdmission.previous_school || ''} onChange={handleAdmissionChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Parent Name</label>
                                                <input type="text" name="parent_name" value={editingAdmission.parent_name} onChange={handleAdmissionChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                                <input type="text" name="phone_number" value={editingAdmission.phone_number} onChange={handleAdmissionChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                                <input type="email" name="email" value={editingAdmission.email} onChange={handleAdmissionChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700">Address</label>
                                                <textarea name="address" value={editingAdmission.address} onChange={handleAdmissionChange} rows="3" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm"></textarea>
                                            </div>
                                        </div>
                                        <div className="flex justify-end space-x-3 pt-4 border-t">
                                            <button type="button" onClick={() => setEditingAdmission(null)} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                                            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark">Save Changes</button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {admissions.map((admission) => (
                                                    <tr key={admission.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {admission.passport_photo ? (
                                                                <img 
                                                                    src={admission.passport_photo.startsWith('http') ? admission.passport_photo : `${API_URL}${admission.passport_photo}`} 
                                                                    alt="" 
                                                                    className="h-10 w-10 rounded-full object-cover border"
                                                                />
                                                            ) : (
                                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">{admission.student_id}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{admission.student_name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admission.class_applying_for}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admission.parent_name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admission.phone_number}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                            <button onClick={() => handleViewAdmission(admission)} className="text-blue-600 hover:text-blue-900 font-bold">View</button>
                                                            <button onClick={() => handleEditAdmission(admission)} className="text-indigo-600 hover:text-indigo-900 font-bold">Edit</button>
                                                            <button onClick={() => handleDeleteAdmission(admission.id)} className="text-red-600 hover:text-red-900 font-bold">Delete</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {admissions.length === 0 && (
                                                    <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No applications found.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
