import { useState } from 'react';
import axios from 'axios';
import PageHero from '../components/PageHero';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Field, { Input, Textarea } from '../components/ui/Field';
import API_URL from '../config/api';

const CHANNELS = [
    {
        title: 'Call the school',
        value: '+234 (0) 806 766 3966',
        href: 'tel:+2348067663966',
        hint: 'Mon–Fri, 8:00 AM – 4:30 PM',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h2.3a1 1 0 01.95.68l1.2 3.6a1 1 0 01-.23 1.05l-1.4 1.4a13 13 0 006 6l1.4-1.4a1 1 0 011.05-.23l3.6 1.2a1 1 0 01.68.95V19a2 2 0 01-2 2A16 16 0 013 5z"/></svg>
        ),
    },
    {
        title: 'Email admissions',
        value: 'towshk3@gmail.com',
        href: 'mailto:towshk3@gmail.com',
        hint: 'We reply within 1 working day',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
        ),
    },
    {
        title: 'Visit the campus',
        value: '8, Kolawole Street, Mowe, Ogun State',
        href: 'https://maps.google.com/?q=Kolawole+Street+Mowe+Ogun',
        hint: 'Tours by appointment',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0L6.343 16.657A8 8 0 1117.657 16.657z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        ),
    },
];

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [status, setStatus] = useState('');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
        <div className="bg-white">
            <PageHero
                eyebrow="GET IN TOUCH"
                title="Questions, visits, admissions — we'd love to hear from you."
                subtitle="Reach us by phone, email, or just drop in. Prospective parents are always welcome."
                bgImage="/staff_members.jpg"
            />

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid md:grid-cols-5 gap-10">
                <div className="md:col-span-2 space-y-4">
                    {CHANNELS.map((c) => (
                        <a key={c.title} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                           className="block bg-white rounded-2xl p-5 border border-gray-100 hover:border-primary/40 hover:shadow-card-lg transition">
                            <div className="flex items-start gap-4">
                                <span className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                                    {c.icon}
                                </span>
                                <div>
                                    <div className="text-xs font-semibold text-gray-500">{c.title}</div>
                                    <div className="mt-1 font-bold text-ink">{c.value}</div>
                                    <div className="mt-1 text-xs text-gray-500">{c.hint}</div>
                                </div>
                            </div>
                        </a>
                    ))}
                    <div className="bg-primary-soft rounded-2xl p-5">
                        <Badge tone="white" dot>School Hours</Badge>
                        <dl className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between"><dt className="text-gray-600">Monday – Friday</dt><dd className="font-semibold text-ink">7:30 AM – 3:30 PM</dd></div>
                            <div className="flex justify-between"><dt className="text-gray-600">Saturday (tours)</dt><dd className="font-semibold text-ink">9:00 AM – 12:00 PM</dd></div>
                            <div className="flex justify-between"><dt className="text-gray-600">Sunday</dt><dd className="font-semibold text-ink">Closed</dd></div>
                        </dl>
                    </div>
                </div>

                <div className="md:col-span-3">
                    <div className="bg-white rounded-3xl shadow-card-lg border border-gray-100 p-6 md:p-10">
                        <Badge tone="mint" dot>Send a message</Badge>
                        <h3 className="mt-3 text-2xl md:text-3xl font-black text-ink">Tell us what you need.</h3>
                        <p className="mt-2 text-gray-500 text-sm">Whether it's an admissions question, a tour request, or feedback — we read every message.</p>

                        {status === 'success' && (
                            <div className="mt-6 bg-primary-soft border border-primary/30 rounded-2xl p-4 text-sm text-primary-dark font-semibold">
                                Message sent. We'll be in touch shortly.
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="mt-6 bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-700">
                                We couldn't send your message. Please try again or email us directly.
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                            <div className="grid md:grid-cols-2 gap-5">
                                <Field label="Your Name" required>
                                    <Input name="name" required value={formData.name} onChange={handleChange} />
                                </Field>
                                <Field label="Email Address" required>
                                    <Input type="email" name="email" required value={formData.email} onChange={handleChange} />
                                </Field>
                            </div>
                            <Field label="Subject" required>
                                <Input name="subject" required value={formData.subject} onChange={handleChange} placeholder="Admissions enquiry / Tour request / Other" />
                            </Field>
                            <Field label="Message" required>
                                <Textarea name="message" required value={formData.message} onChange={handleChange} rows={5} />
                            </Field>
                            <Button type="submit" size="lg" disabled={status === 'sending'} className="w-full">
                                {status === 'sending' ? 'Sending...' : 'Send Message'}
                            </Button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;
