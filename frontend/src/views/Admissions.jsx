import { useState } from 'react';
import axios from 'axios';
import PageHero from '../components/PageHero';
import API_URL from '../config/api';

const Admissions = () => {
    const [formData, setFormData] = useState({
        student_name: '',
        date_of_birth: '',
        gender: 'M',
        class_applying_for: '',
        previous_school: '',
        parent_name: '',
        phone_number: '',
        email: '',
        address: ''
    });
    const [passport_photo, setPassportPhoto] = useState(null);
    const [status, setStatus] = useState('');

    const handleChange = (e) => {
        if (e.target.name === 'passport_photo') {
            setPassportPhoto(e.target.files[0]);
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');
        
        const data = new FormData();
        // Append all form data
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });
        
        // Append photo if it exists
        if (passport_photo) {
            data.append('passport_photo', passport_photo);
        }

        try {
            console.log('Attempting to submit to:', `${API_URL}/api/admissions/`);
            const response = await axios.post(`${API_URL}/api/admissions/`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('Submission successful:', response.data);
            setStatus('success');
            setFormData({
                student_name: '', date_of_birth: '', gender: 'M', class_applying_for: '',
                previous_school: '', parent_name: '', phone_number: '', email: '', address: ''
            });
            setPassportPhoto(null);
        } catch (error) {
            console.error('Submission FAILED!');
            console.error('URL:', `${API_URL}/api/admissions/`);
            
            if (error.response) {
                // Server responded with a status code outside the 2xx range
                console.error('Backend Error Data:', error.response.data);
                console.error('Status:', error.response.status);
                setStatus(`error: ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                // Request was made but no response was received
                console.error('No response received from server. Check if backend is running and CORS is allowed.');
                setStatus('error: Network error - No response from server');
            } else {
                // Something happened in setting up the request
                console.error('Request setup error:', error.message);
                setStatus(`error: ${error.message}`);
            }
        }
    };

    return (
        <div>
            <PageHero 
                title="Admissions" 
                subtitle="Join our community of learners."
                bgImage="/school_hero_Section.png"
            />
            <div className="bg-gray-50 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Admission Application</h2>
                        <p className="mt-4 text-xl text-gray-500">Apply for a place at Best Legacy Divine School</p>
                    </div>

                    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
                     {status === 'success' && (
                        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                            <strong className="font-bold">Application Submitted!</strong>
                            <span className="block sm:inline"> We will review your application and contact you shortly.</span>
                        </div>
                    )}

                     {status.startsWith('error') && (
                        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <strong className="font-bold">Submission Failed!</strong>
                            <span className="block sm:inline"> {status.replace('error: ', '')}</span>
                            <p className="text-xs mt-2 font-bold">Please check your internet connection or ensure the backend server is running.</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Student Details */}
                            <div className="col-span-1 md:col-span-2">
                                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Student Details</h3>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input type="text" name="student_name" required value={formData.student_name} onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                <input type="date" name="date_of_birth" required value={formData.date_of_birth} onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Gender</label>
                                <select name="gender" value={formData.gender} onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Passport Photograph</label>
                                <input type="file" name="passport_photo" accept="image/*" onChange={handleChange} required
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Class Applying For</label>
                                <input type="text" name="class_applying_for" required placeholder="e.g. Nursery 1, Primary 3" value={formData.class_applying_for} onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Previous School (if any)</label>
                                <input type="text" name="previous_school" value={formData.previous_school} onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>

                            {/* Parent Details */}
                            <div className="col-span-1 md:col-span-2">
                                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4 mt-4">Parent/Guardian Details</h3>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Parent Full Name</label>
                                <input type="text" name="parent_name" required value={formData.parent_name} onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                <input type="tel" name="phone_number" required value={formData.phone_number} onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                <input type="email" name="email" required value={formData.email} onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Residential Address</label>
                                <textarea name="address" rows="3" required value={formData.address} onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button type="submit" disabled={status === 'sending'}
                                className="w-full inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-300">
                                {status === 'sending' ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    );
};

export default Admissions;
