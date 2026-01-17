import { useState } from 'react';
import axios from 'axios';
import PageHero from '../components/PageHero';
import API_URL from '../config/api';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');
        try {
            await axios.post(`${API_URL}/api/inquiries/`, formData);
            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            console.error('Error submitting form:', error);
            setStatus('error');
        }
    };

    return (
        <div className="bg-gray-50">
             <PageHero 
                title="Contact Us" 
                subtitle="We'd love to hear from you."
                bgImage="/school_hero_Section.png"
            />
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Get in Touch</h2>
                        <p className="mt-4 text-xl text-gray-500">
                             Have questions? We'd love to hear from you.
                        </p>
                    </div>

                    {status === 'success' && (
                        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                            <strong className="font-bold">Success!</strong>
                            <span className="block sm:inline"> Your message has been sent. We'll get back to you shortly.</span>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                            <input type="text" name="name" id="name" required
                                value={formData.name} onChange={handleChange}
                                className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-3 px-4 border"
                            />
                        </div>
                         <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" name="email" id="email" required
                                value={formData.email} onChange={handleChange}
                                className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-3 px-4 border"
                            />
                        </div>
                         <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                            <input type="text" name="subject" id="subject" required
                                value={formData.subject} onChange={handleChange}
                                className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-3 px-4 border"
                            />
                        </div>
                         <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                            <textarea name="message" id="message" rows="4" required
                                value={formData.message} onChange={handleChange}
                                className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-3 px-4 border"
                            ></textarea>
                        </div>
                        <div>
                            <button type="submit" disabled={status === 'sending'}
                                className="w-full inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-300">
                                {status === 'sending' ? 'Sending...' : 'Send Message'}
                            </button>
                        </div>
                    </form>
                </div>
             </div>
        </div>
    );
};

export default Contact;
