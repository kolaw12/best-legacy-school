import { useState } from 'react';
import axios from 'axios';
import { motion, useReducedMotion } from 'framer-motion';
import { Phone, Mail, MapPin } from 'lucide-react';
import Button from '../components/ui/Button';
import Field, { Input, Textarea } from '../components/ui/Field';
import API_URL from '../config/api';
import Seo from '../components/Seo';

const EASE = [0.22, 1, 0.36, 1];

const Fade = ({ children, delay = 0, className }) => {
    const reduced = useReducedMotion();
    if (reduced) return <div className={className}>{children}</div>;
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay, ease: EASE }}
        >
            {children}
        </motion.div>
    );
};

const Eyebrow = ({ children, center = false }) => (
    <div className={`flex items-center gap-3 ${center ? 'justify-center' : ''}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-gold" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">{children}</span>
    </div>
);

const CHANNELS = [
    {
        title: 'Call the school',
        value: '+234 (0) 806 766 3966',
        href: 'tel:+2348067663966',
        hint: 'Mon–Fri, 8:00 AM – 4:30 PM',
        icon: <Phone className="w-5 h-5" strokeWidth={2} />,
    },
    {
        title: 'Email admissions',
        value: 'towshk3@gmail.com',
        href: 'mailto:towshk3@gmail.com',
        hint: 'We reply within 1 working day',
        icon: <Mail className="w-5 h-5" strokeWidth={2} />,
    },
    {
        title: 'Visit the campus',
        value: '8, Kolawole Street, Mowe, Ogun State',
        href: 'https://maps.google.com/?q=Kolawole+Street+Mowe+Ogun',
        hint: 'Tours by appointment',
        icon: <MapPin className="w-5 h-5" strokeWidth={2} />,
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
        <div className="bg-white -mt-16 md:-mt-[4.5rem]">
            <Seo
                title="Contact Us"
                description="Reach Best Legacy Divine School by phone, email, or visit us at 8, Kolawole Street, Mowe, Ogun State. Prospective parents are always welcome."
                path="/contact"
            />
            {/* Minimal, photo-free hero — deliberately different from every
                other page's imagery-led hero: just type, on quiet paper. */}
            <section className="relative bg-paper overflow-hidden pt-28 md:pt-32 pb-12 md:pb-16">
                <div className="absolute inset-0 mesh-gradient-premium opacity-70 pointer-events-none" />
                <div className="relative max-w-3xl mx-auto px-6 sm:px-8 text-center">
                    <Fade>
                        <Eyebrow center>Get in touch</Eyebrow>
                        <h1 className="mt-6 font-serif text-4xl sm:text-5xl md:text-6xl font-medium text-ink leading-[1.1] text-balance">
                            Questions, visits, admissions. <span className="italic text-primary">We&rsquo;d love to hear from you.</span>
                        </h1>
                        <p className="mt-6 max-w-xl mx-auto text-gray-600 text-lg leading-relaxed">
                            Reach us by phone, email, or just drop in. Prospective parents are always welcome.
                        </p>
                    </Fade>
                </div>
            </section>

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
                        <Eyebrow>School hours</Eyebrow>
                        <dl className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between"><dt className="text-gray-600">Monday – Friday</dt><dd className="font-semibold text-ink">7:30 AM – 3:30 PM</dd></div>
                            <div className="flex justify-between"><dt className="text-gray-600">Saturday (tours)</dt><dd className="font-semibold text-ink">9:00 AM – 12:00 PM</dd></div>
                            <div className="flex justify-between"><dt className="text-gray-600">Sunday</dt><dd className="font-semibold text-ink">Closed</dd></div>
                        </dl>
                    </div>
                </div>

                <div className="md:col-span-3">
                    <div className="bg-white rounded-3xl shadow-card-lg border border-gray-100 p-6 md:p-10">
                        <Eyebrow>Send a message</Eyebrow>
                        <h3 className="mt-4 font-serif text-2xl md:text-3xl text-ink">Tell us what you need.</h3>
                        <p className="mt-2 text-gray-500 text-sm">Whether it's an admissions question, a tour request, or feedback, we read every message.</p>

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
