import { useMemo, useState } from 'react';
import axios from 'axios';
import PageHero from '../components/PageHero';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import SectionEyebrow from '../components/ui/SectionEyebrow';
import Field, { Input, Select, Textarea, FileInput } from '../components/ui/Field';
import API_URL from '../config/api';
import { CLASS_LEVELS, NURSERY_LEVELS } from '../config/school';
import ConfettiBurst from '../components/ui/ConfettiBurst';
import CopyButton from '../components/ui/CopyButton';
import { useToast } from '../components/ui/ToastProvider';
import { motion } from 'framer-motion';
import Reveal from '../components/ui/Reveal';

// --- inline validation rules -------------------------------------------------
const validators = {
    student_name: (v) => !v?.trim() ? 'Please enter your child\'s full name.'
        : v.trim().length < 2 ? 'Name looks too short.' : '',
    date_of_birth: (v) => {
        if (!v) return 'Date of birth is required.';
        const d = new Date(v);
        if (isNaN(d)) return 'Please enter a valid date.';
        const ageMs = Date.now() - d.getTime();
        const ageYrs = ageMs / (365.25 * 24 * 3600 * 1000);
        if (ageYrs < 2)  return 'Best Legacy admits from age 3. Please double-check the date.';
        if (ageYrs > 13) return 'We admit up to Basic 6 (age ~11). For older children, please contact us.';
        return '';
    },
    class_applying_for: (v) => !v ? 'Pick a class level.' : '',
    parent_name: (v) => !v?.trim() ? 'Please enter your full name.'
        : v.trim().length < 2 ? 'Name looks too short.' : '',
    phone_number: (v) => {
        if (!v) return 'A phone number we can call is required.';
        const digits = v.replace(/\D/g, '');
        if (digits.length < 10) return 'That doesn\'t look like a complete number.';
        return '';
    },
    email: (v) => {
        if (!v) return 'An email we can write to is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'That email address doesn\'t look quite right.';
        return '';
    },
    address: (v) => !v?.trim() ? 'A residential address helps us with school-runs.' : '',
};

// --- fee calculator & currency data ---------------------------------------------
const FEE_BANDS = [
    { match: ['Nursery 1', 'Nursery 2'],            amount: 75000,  label: 'Nursery (1 & 2)' },
    { match: ['Basic 1', 'Basic 2', 'Basic 3'],     amount: 95000,  label: 'Basic 1 – 3' },
    { match: ['Basic 4', 'Basic 5', 'Basic 6'],     amount: 115000, label: 'Basic 4 – 6' },
];

const EXCHANGE_RATES = {
    NGN: 1,
    USD: 0.00075,
    GBP: 0.00060,
    EUR: 0.00069,
};

const formatCurrency = (amount, currency = 'NGN') => {
    if (currency === 'NGN') return `₦${Number(amount).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
    const converted = amount * EXCHANGE_RATES[currency];
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(converted);
};

const ageToClass = (dobStr) => {
    if (!dobStr) return null;
    const dob = new Date(dobStr);
    if (isNaN(dob)) return null;
    // Cut-off: 1 September of the current academic year.
    const cutoff = new Date(new Date().getFullYear(), 8, 1);
    const ageOnCutoff = (cutoff - dob) / (365.25 * 24 * 3600 * 1000);
    if (ageOnCutoff < 3)   return null;
    if (ageOnCutoff < 4)   return 'Nursery 1';
    if (ageOnCutoff < 5)   return 'Nursery 2';
    if (ageOnCutoff < 6)   return 'Basic 1';
    if (ageOnCutoff < 7)   return 'Basic 2';
    if (ageOnCutoff < 8)   return 'Basic 3';
    if (ageOnCutoff < 9)   return 'Basic 4';
    if (ageOnCutoff < 10)  return 'Basic 5';
    if (ageOnCutoff < 12)  return 'Basic 6';
    return null;
};

const STEPS = [
    { n: '01', title: 'Enquire or Visit', desc: 'Send an enquiry or book a school tour. Meet our teachers and see the classrooms.' },
    { n: '02', title: 'Submit Application', desc: 'Complete the admission form below with the child and parent details.' },
    { n: '03', title: 'Assessment & Interview', desc: 'We invite the child for a short, friendly assessment and a parent conversation.' },
    { n: '04', title: 'Offer & Enrolment', desc: 'On acceptance we send an offer email, fee details, and your child\'s welcome pack.' },
];

const WHAT_TO_BRING = [
    'Child\'s birth certificate',
    'Two recent passport photographs',
    'Previous school report (if transferring)',
    'Parent / guardian valid ID',
    'Immunisation record',
    'Current address proof',
];

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
        address: '',
        nationality: 'Nigerian', // Added for international support
    });
    const [passport_photo, setPassportPhoto] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});
    const [submission, setSubmission] = useState(null);
    const [currency, setCurrency] = useState('NGN');
    const [currentStep, setCurrentStep] = useState(1);
    const toast = useToast();

    const validateField = (name, value) => {
        const fn = validators[name];
        return fn ? fn(value) : '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'passport_photo') {
            setPassportPhoto(e.target.files[0]);
            return;
        }
        setFormData(f => ({ ...f, [name]: value }));
        // If field already touched, re-validate on every keystroke so they see the
        // error clear in real time.
        if (touched[name]) {
            setErrors(errs => ({ ...errs, [name]: validateField(name, value) }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(t => ({ ...t, [name]: true }));
        setErrors(errs => ({ ...errs, [name]: validateField(name, value) }));
    };

    const recommendedClass = useMemo(() => ageToClass(formData.date_of_birth), [formData.date_of_birth]);
    const recommendedFee = useMemo(() => {
        const band = FEE_BANDS.find(b => b.match.includes(recommendedClass));
        return band ? { class: recommendedClass, label: band.label, amount: band.amount } : null;
    }, [recommendedClass]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate everything; reveal errors and bail early if any fail.
        const allErrors = Object.keys(validators).reduce((acc, name) => {
            const err = validateField(name, formData[name]);
            if (err) acc[name] = err;
            return acc;
        }, {});
        if (!passport_photo) allErrors.passport_photo = 'Please attach a passport photo.';

        if (Object.keys(allErrors).length) {
            setErrors(allErrors);
            setTouched(Object.keys(validators).reduce((a, k) => ({ ...a, [k]: true }), {}));
            toast.error(`Please fix ${Object.keys(allErrors).length} field(s) before submitting.`);
            
            // Auto-navigate to the step with the first error
            if (allErrors.student_name || allErrors.date_of_birth || allErrors.class_applying_for) setCurrentStep(1);
            else if (allErrors.parent_name || allErrors.phone_number || allErrors.email || allErrors.address) setCurrentStep(2);
            else setCurrentStep(3);
            
            return;
        }

        setStatus({ type: 'sending', message: 'Submitting application...' });

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (passport_photo) data.append('passport_photo', passport_photo);

        try {
            const response = await axios.post(`${API_URL}/api/admissions/`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setStatus({ type: 'success', message: `Application received. Your reference ID is ${response.data.student_id}. We'll email you within 2 working days.` });
            setSubmission({
                refId:   response.data.student_id,
                student: response.data.student_name || formData.student_name,
                klass:   formData.class_applying_for,
            });
            toast.success('Application submitted!');
            setFormData({
                student_name: '', date_of_birth: '', gender: 'M', class_applying_for: '',
                previous_school: '', parent_name: '', phone_number: '', email: '', address: '', nationality: 'Nigerian'
            });
            setPassportPhoto(null);
            setErrors({});
            setTouched({});
            setCurrentStep(1);
            e.target.reset();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            let errorMessage = 'Failed to submit application. Please try again.';
            if (error.response && error.response.data) {
                const data = error.response.data;
                if (typeof data === 'object') {
                    errorMessage = Object.entries(data)
                        .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                        .join('\n');
                } else if (typeof data === 'string') {
                    errorMessage = data;
                }
            } else if (error.request) {
                errorMessage = 'No response from server. Please check your internet connection.';
            }
            setStatus({ type: 'error', message: errorMessage });
            toast.error('Submission failed — see details on the page.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const selectedIsNursery = NURSERY_LEVELS.includes(formData.class_applying_for);

    return (
        <div className="bg-white">
            <PageHero
                eyebrow="ADMISSIONS 2026 / 2027"
                title="A warm start for every new Legacy learner."
                subtitle="Applications are open for Nursery 1 through Basic 6. Here's how the process works and how to apply."
                bgImage="/group_celebration.jpg"
            >
                <div className="flex flex-wrap gap-3">
                    <Button href="#apply">Start Application</Button>
                    <Button to="/contact" variant="outline">Speak to Admissions</Button>
                </div>
            </PageHero>

            {/* ============ NARRATIVE LEAD (design audit #5) ============ */}
            <section className="bg-bg py-16 md:py-20 border-b border-gray-100 relative overflow-hidden">
                <div className="absolute -top-12 right-0 w-72 h-72 rounded-full blob-warm blur-3xl pointer-events-none"></div>
                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-start">
                    <Reveal>
                        <motion.article 
                            whileHover={{ y: -8 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="bg-white rounded-3xl shadow-card hover:shadow-card-lg p-7 md:p-9 relative transition-shadow"
                        >
                            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-2xl bg-secondary text-ink flex items-center justify-center text-2xl shadow-md">✉️</div>
                            <div className="text-xs font-bold uppercase tracking-widest text-secondary">A note from us</div>
                            <h2 className="mt-3 text-2xl md:text-3xl font-black text-primary leading-tight text-balance">
                                Admissions here is a conversation, not a queue.
                            </h2>
                            <div className="mt-5 space-y-4 text-gray-600 leading-relaxed">
                                <p>
                                    Every September we admit about 40 new pupils across Nursery 1 to Basic 6. Before we ever ask for paperwork, we'd rather meet your child — at a low-pressure 30-minute visit where they play, we listen, and you ask anything.
                                </p>
                                <p>
                                    Fill the form below to begin. We reply by email within <span className="font-semibold text-ink">2 working days</span>; if it's urgent, the head teacher's number is on the contact page and she answers it herself.
                                </p>
                            </div>
                            <div className="mt-6 flex items-center gap-3 pt-5 border-t border-gray-100">
                                <img src="/staff_members.jpg" alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-mint" loading="lazy" width={48} height={48}/>
                                <div className="text-sm">
                                    <div className="font-bold text-ink">Mrs Olusola Kolawole</div>
                                    <div className="text-xs text-gray-500">Head Teacher · Best Legacy Divine School</div>
                                </div>
                            </div>
                        </motion.article>
                    </Reveal>

                    <div className="md:pt-6">
                        <Reveal>
                            <Badge tone="mint" dot>What to expect</Badge>
                            <h3 className="mt-3 text-2xl md:text-3xl font-black text-primary leading-tight">Three things we promise.</h3>
                        </Reveal>
                        <Reveal stagger gap={0.15}>
                            <ul className="mt-6 space-y-5">
                                {[
                                    { icon: '⏱️', title: 'A reply within 2 working days', body: 'No silent application forms. If you don\'t hear back, our system has failed you — please call us.' },
                                    { icon: '🤝', title: 'No large-group "assessments"',  body: 'Your child\'s visit is one-on-one with their would-be class teacher. Less stress, more honest.' },
                                    { icon: '🧾', title: 'Fees in writing, no surprises',  body: 'Tuition, books, feeding, uniform — all itemised before you commit. No mid-term add-ons.' },
                                ].map(p => (
                                    <motion.li 
                                        key={p.title} 
                                        whileHover={{ x: 8 }}
                                        className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/50 transition-colors"
                                    >
                                        <span className="shrink-0 w-11 h-11 rounded-2xl bg-mint flex items-center justify-center text-xl shadow-sm">{p.icon}</span>
                                        <div>
                                            <div className="font-bold text-ink">{p.title}</div>
                                            <p className="mt-1 text-sm text-gray-600 leading-relaxed">{p.body}</p>
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* 4-STEP ADMISSIONS JOURNEY */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <Reveal>
                    <SectionEyebrow
                        eyebrow="Admissions Journey"
                        title="Four simple steps from enquiry to first day."
                        description="We keep the process personal. Every family meets with a teacher before we confirm a place."
                    />
                </Reveal>
                <Reveal stagger gap={0.1}>
                    <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {STEPS.map((s) => (
                            <motion.div 
                                key={s.n} 
                                whileHover={{ y: -6, scale: 1.02 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className="relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-primary/40 hover:shadow-card-lg transition-all"
                            >
                                <div className="text-xs font-bold text-primary">{s.n}</div>
                                <h4 className="mt-3 font-bold text-ink text-lg">{s.title}</h4>
                                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </Reveal>
            </section>

            {/* CLASSES + WHAT TO BRING */}
            <section className="bg-bg py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-10">
                    <Reveal delay={0}>
                        <motion.div 
                            whileHover={{ y: -8 }}
                            className="bg-white rounded-3xl p-8 shadow-card hover:shadow-card-lg transition-shadow h-full"
                        >
                            <Badge tone="mint" dot>Open for 2026 / 2027</Badge>
                            <h3 className="mt-4 text-2xl font-black text-ink">Class levels currently admitting</h3>
                            <p className="mt-2 text-gray-600 text-sm">We admit from Nursery 1 and continue through Basic 6. Class sizes are limited to maintain quality.</p>
                            <div className="mt-6 grid grid-cols-2 gap-3">
                                {CLASS_LEVELS.map((c) => (
                                    <motion.div 
                                        key={c} 
                                        whileHover={{ scale: 1.05 }}
                                        className="flex items-center gap-2 text-sm text-ink bg-primary-soft/60 rounded-xl px-4 py-2.5 cursor-default"
                                    >
                                        <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z"/></svg>
                                        {c}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </Reveal>
                    
                    <Reveal delay={0.15}>
                        <motion.div 
                            whileHover={{ y: -8 }}
                            className="bg-white rounded-3xl p-8 shadow-card hover:shadow-card-lg transition-shadow h-full"
                        >
                            <Badge tone="warm" dot>Documents</Badge>
                            <h3 className="mt-4 text-2xl font-black text-ink">What to bring to the assessment</h3>
                            <ul className="mt-6 space-y-3">
                                {WHAT_TO_BRING.map((item) => (
                                    <motion.li 
                                        key={item} 
                                        whileHover={{ x: 6 }}
                                        className="flex items-start gap-3 text-sm text-ink p-2 rounded-xl hover:bg-gray-50"
                                    >
                                        <span className="w-6 h-6 rounded-full bg-secondary-soft text-secondary-dark flex items-center justify-center shrink-0">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z"/></svg>
                                        </span>
                                        {item}
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>
                    </Reveal>
                </div>
            </section>

            {/* FEE CALCULATOR + AGE-TO-CLASS MAPPER (agent #6) */}
            <section className="bg-white pt-10 pb-4">
                <Reveal>
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-gradient-to-br from-primary-soft via-white to-secondary-soft rounded-3xl p-6 md:p-8 border border-gray-100 shadow-card">
                            <div className="md:flex items-start gap-8">
                                <div className="md:w-1/3 mb-5 md:mb-0">
                                    <Badge tone="warm" dot>Quick check</Badge>
                                    <h3 className="mt-3 text-xl md:text-2xl font-black text-primary leading-tight">Which class? What's the fee?</h3>
                                    <p className="mt-2 text-sm text-gray-600">Pop in your child's date of birth — we'll suggest a class level and the termly fee.</p>
                                </div>
                                <div className="md:w-2/3">
                                    <Field label="Child's date of birth">
                                        <Input
                                            type="date"
                                            value={formData.date_of_birth}
                                            onChange={(e) => setFormData(f => ({ ...f, date_of_birth: e.target.value }))}
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                    </Field>
                                    {recommendedFee ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.98 }} 
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            className="mt-4 grid sm:grid-cols-3 gap-3"
                                        >
                                            <div className="bg-white rounded-2xl p-4 shadow-sm">
                                                <div className="text-xs text-gray-500 font-bold uppercase">Class</div>
                                                <div className="mt-1 font-black text-ink">{recommendedFee.class}</div>
                                            </div>
                                            <div className="bg-white rounded-2xl p-4 shadow-sm">
                                                <div className="text-xs text-gray-500 font-bold uppercase">Tier</div>
                                                <div className="mt-1 font-black text-ink">{recommendedFee.label}</div>
                                            </div>
                                            <div className="bg-primary text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
                                                <div className="absolute top-2 right-2 flex gap-1 bg-white/20 p-1 rounded-lg z-10">
                                                    {['NGN', 'USD', 'GBP'].map(c => (
                                                        <button
                                                            key={c} onClick={() => setCurrency(c)}
                                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${currency === c ? 'bg-white text-primary' : 'text-white hover:bg-white/10'}`}
                                                        >
                                                            {c}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="text-xs text-white/80 font-bold uppercase">Termly fee</div>
                                                <div className="mt-1 font-black text-xl">{formatCurrency(recommendedFee.amount, currency)}</div>
                                                {currency !== 'NGN' && (
                                                    <div className="mt-1 text-[10px] text-white/70 leading-snug">
                                                        Indicative only — fees are paid in NGN at the school rate on the day.
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ) : formData.date_of_birth ? (
                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-xs text-secondary-dark">
                                            That age sits outside our Nursery 1 → Basic 6 range. <a href="/contact" className="font-semibold underline hover:text-primary">Send us a note</a> and we'll discuss.
                                        </motion.p>
                                    ) : (
                                        <p className="mt-3 text-xs text-gray-500">Sibling discount: 10% off the second child's tuition.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* APPLICATION FORM */}
            <section id="apply" className="py-20 scroll-mt-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionEyebrow
                        eyebrow="Application Form"
                        title="Submit your child's application."
                        description="Takes about 5 minutes. We'll email a confirmation to the address you enter below."
                        align="center"
                    />

                    <div className="mt-10 bg-white rounded-3xl shadow-card-lg border border-gray-100 p-6 md:p-10">
                        {status.type === 'success' && submission && (
                            <motion.div
                                initial={{ scale: 0.92, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                                className="mb-8 bg-primary-soft border border-primary/30 rounded-2xl p-5 md:p-6 relative overflow-visible"
                            >
                                <ConfettiBurst fire={true} originY="40%" />
                                <div className="flex items-center gap-2 font-bold text-primary-dark text-lg">
                                    <motion.span
                                        animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
                                        transition={{ duration: 1.4, ease: 'easeInOut' }}
                                        className="inline-block text-xl"
                                    >🎉</motion.span>
                                    Welcome to the Best Legacy journey!
                                </div>
                                <p className="mt-2 text-sm text-ink">
                                    We've received <span className="font-semibold">{submission.student}</span>'s application for <span className="font-semibold">{submission.klass}</span>.
                                    We'll email you within 2 working days.
                                </p>

                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    <div className="bg-white rounded-xl px-3 py-2 flex items-center gap-2 border border-primary/20">
                                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Ref ID</span>
                                        <span className="font-mono font-bold text-ink">{submission.refId}</span>
                                        <CopyButton value={submission.refId} label="reference ID" />
                                    </div>
                                </div>

                                <div className="mt-5 flex flex-wrap gap-3 pt-4 border-t border-primary/15">
                                    <span className="text-xs text-gray-500 self-center">Forward this confirmation to your spouse or family:</span>
                                    <a
                                        href={`https://wa.me/?text=${encodeURIComponent(
                                            `Best Legacy admission submitted ✅\n` +
                                            `Pupil: ${submission.student}\n` +
                                            `Class: ${submission.klass}\n` +
                                            `Ref ID: ${submission.refId}\n\n` +
                                            `bestlegacy.sch will email back within 2 working days.`
                                        )}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366] text-white text-xs font-semibold hover:bg-[#1ebe5b] transition shadow-sm"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.05 4.91A9.82 9.82 0 0012.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.93 9.93 0 004.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01zm-7.01 15.24h-.01a8.21 8.21 0 01-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.18 8.18 0 01-1.26-4.4c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 012.41 5.83c0 4.54-3.7 8.25-8.25 8.25z"/></svg>
                                        Send to WhatsApp
                                    </a>
                                    <a
                                        href={`mailto:?subject=${encodeURIComponent('Best Legacy admission — ' + submission.student)}&body=${encodeURIComponent(
                                            `Pupil: ${submission.student}\nClass: ${submission.klass}\nRef ID: ${submission.refId}\n\nBest Legacy will email back within 2 working days.`
                                        )}`}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-ink text-xs font-semibold border border-gray-200 hover:border-primary hover:text-primary transition"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.9 5.27a2 2 0 002.2 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                        Email it
                                    </a>
                                </div>
                            </motion.div>
                        )}
                        {status.type === 'error' && (
                            <div className="mb-8 bg-rose-50 border border-rose-200 rounded-2xl p-5">
                                <div className="font-bold text-rose-700">Something didn't go through</div>
                                <pre className="mt-1 text-xs text-rose-700 whitespace-pre-wrap">{status.message}</pre>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            
                            {/* Step Progress Indicators */}
                            <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
                                {[
                                    { step: 1, label: 'Student Details' },
                                    { step: 2, label: 'Parent Details' },
                                    { step: 3, label: 'Documents & Review' }
                                ].map((s) => (
                                    <div key={s.step} className={`flex flex-col items-center gap-2 cursor-pointer ${currentStep === s.step ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`} onClick={() => setCurrentStep(s.step)}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${currentStep === s.step ? 'bg-primary text-white shadow-md' : currentStep > s.step ? 'bg-mint text-ink' : 'bg-gray-100 text-gray-400'}`}>
                                            {currentStep > s.step ? '✓' : s.step}
                                        </div>
                                        <span className={`text-xs font-bold uppercase tracking-widest hidden md:block ${currentStep === s.step ? 'text-primary' : 'text-gray-500'}`}>{s.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* STEP 1 */}
                            {currentStep === 1 && (
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                    <div className="grid md:grid-cols-2 gap-5">
                                        <Field label="Full Name" required error={touched.student_name && errors.student_name}>
                                            <Input name="student_name" required value={formData.student_name} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. Tomi Adebayo" error={!!(touched.student_name && errors.student_name)} />
                                        </Field>
                                        <Field label="Date of Birth" required error={touched.date_of_birth && errors.date_of_birth}>
                                            <Input type="date" name="date_of_birth" required value={formData.date_of_birth} onChange={handleChange} onBlur={handleBlur} error={!!(touched.date_of_birth && errors.date_of_birth)} max={new Date().toISOString().split('T')[0]} />
                                        </Field>
                                        <Field label="Gender" required>
                                            <Select name="gender" value={formData.gender} onChange={handleChange}>
                                                <option value="M">Male</option>
                                                <option value="F">Female</option>
                                            </Select>
                                        </Field>
                                        <Field label="Nationality" required>
                                            <Input name="nationality" value={formData.nationality} onChange={handleChange} placeholder="e.g. Nigerian, British, American" />
                                        </Field>
                                        <Field label="Class Applying For" required
                                            error={touched.class_applying_for && errors.class_applying_for}
                                            hint={!errors.class_applying_for && (selectedIsNursery ? 'Play-based programme with developmental assessment.' : formData.class_applying_for ? 'Full primary curriculum with termly reports.' : (recommendedFee ? `We suggest ${recommendedFee.class} based on the date of birth above.` : null))}
                                        >
                                            <Select name="class_applying_for" required value={formData.class_applying_for} onChange={handleChange} onBlur={handleBlur} error={!!(touched.class_applying_for && errors.class_applying_for)}>
                                                <option value="" disabled>Select a class level</option>
                                                <optgroup label="Nursery Section">
                                                    {['Nursery 1','Nursery 2'].map(c => <option key={c} value={c}>{c}</option>)}
                                                </optgroup>
                                                <optgroup label="Basic Section">
                                                    {['Basic 1','Basic 2','Basic 3','Basic 4','Basic 5','Basic 6'].map(c => <option key={c} value={c}>{c}</option>)}
                                                </optgroup>
                                            </Select>
                                        </Field>
                                        <Field label="Previous School" hint="Leave blank if this is the child's first school.">
                                            <Input name="previous_school" value={formData.previous_school} onChange={handleChange} />
                                        </Field>
                                    </div>
                                    <div className="mt-8 flex justify-end">
                                        <Button type="button" onClick={() => setCurrentStep(2)}>Next: Parent Details →</Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2 */}
                            {currentStep === 2 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                    <div className="grid md:grid-cols-2 gap-5">
                                        <Field label="Parent / Guardian Full Name" required error={touched.parent_name && errors.parent_name}>
                                            <Input name="parent_name" required value={formData.parent_name} onChange={handleChange} onBlur={handleBlur} error={!!(touched.parent_name && errors.parent_name)} />
                                        </Field>
                                        <Field label="Phone Number (Include Country Code)" required error={touched.phone_number && errors.phone_number}>
                                            <Input type="tel" name="phone_number" required value={formData.phone_number} onChange={handleChange} onBlur={handleBlur} error={!!(touched.phone_number && errors.phone_number)} placeholder="+234 803 000 0000" />
                                        </Field>
                                        <Field label="Email Address" required error={touched.email && errors.email}>
                                            <Input type="email" name="email" required value={formData.email} onChange={handleChange} onBlur={handleBlur} error={!!(touched.email && errors.email)} placeholder="you@example.com" />
                                        </Field>
                                        <Field label="Residential Address" required error={touched.address && errors.address}>
                                            <Textarea name="address" required value={formData.address} onChange={handleChange} onBlur={handleBlur} error={!!(touched.address && errors.address)} rows={3} placeholder="Full address (Street, City, Country)" />
                                        </Field>
                                    </div>
                                    <div className="mt-8 flex justify-between">
                                        <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>← Back</Button>
                                        <Button type="button" onClick={() => setCurrentStep(3)}>Next: Documents →</Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3 */}
                            {currentStep === 3 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-8 text-center">
                                        <Field label="Passport Photograph" required error={errors.passport_photo}>
                                            <FileInput name="passport_photo" accept="image/*" onChange={handleChange} required />
                                        </Field>
                                        <p className="mt-2 text-xs text-gray-500">Ensure the photo is clear and recently taken against a plain background.</p>
                                    </div>

                                    <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
                                        <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>← Back</Button>
                                        <div className="flex items-center gap-4">
                                            <p className="text-[10px] text-gray-400 max-w-[200px] text-right hidden md:block">By submitting, you agree to our international data handling policies.</p>
                                            <Button type="submit" size="lg" disabled={status.type === 'sending'}>
                                                {status.type === 'sending' ? 'Submitting...' : 'Submit Global Application'}
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Admissions;
