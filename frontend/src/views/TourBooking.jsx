import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import PageHero from '../components/PageHero';
import API_URL from '../config/api';

const SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00'];
const CLASSES = ['Nursery 1', 'Nursery 2', 'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6'];

const TourBooking = () => {
    const [form, setForm] = useState({
        parent_name: '', parent_phone: '', parent_email: '',
        children_count: 1, interest_class: '',
        requested_date: '', requested_slot: '10:00', note: '',
    });
    const [saving, setSaving] = useState(false);
    const [done, setDone] = useState(null);
    const [error, setError] = useState(null);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true); setError(null);
        try {
            const { data } = await axios.post(`${API_URL}/api/tour-bookings/`, form);
            setDone(data);
        } catch (err) {
            const d = err.response?.data;
            setError(d && typeof d === 'object'
                ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')
                : err.message);
        } finally {
            setSaving(false);
        }
    };

    const minDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    if (done) {
        return (
            <>
                <PageHero eyebrow="TOUR BOOKED" title="Thank you — see you soon." subtitle="We'll confirm via WhatsApp + email shortly." bgImage="/school_hero_Section.png" />
                <section className="max-w-2xl mx-auto px-4 py-16 text-center">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                className="bg-mint border-2 border-primary/20 rounded-3xl p-8">
                        <div className="text-5xl mb-3">🎉</div>
                        <h2 className="text-2xl font-black text-primary-dark">Booking received</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            <strong>{done.parent_name}</strong>, you're on for{' '}
                            <strong>{new Date(done.requested_date).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
                            {' '}at <strong>{done.requested_slot}</strong>.
                        </p>
                        <p className="mt-4 text-xs text-gray-500">
                            We'll send a reminder the day before. If something changes, just reply to the confirmation.
                        </p>
                    </motion.div>
                </section>
            </>
        );
    }

    return (
        <>
            <PageHero eyebrow="VISIT THE SCHOOL" title="Book a campus tour"
                      subtitle="Pick a day, pick a time, walk the halls. Fifteen minutes is enough to know."
                      bgImage="/school_hero_Section.png" />
            <section className="max-w-2xl mx-auto px-4 py-16">
                {error && <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700 whitespace-pre-wrap">{error}</div>}
                <form onSubmit={submit} className="bg-white rounded-3xl shadow-card-lg p-6 md:p-8 space-y-4">
                    <Field label="Your full name" required>
                        <input value={form.parent_name} onChange={e => set('parent_name', e.target.value)} required
                               className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
                    </Field>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Field label="Phone (WhatsApp)" required>
                            <input value={form.parent_phone} onChange={e => set('parent_phone', e.target.value)} required
                                   placeholder="0803…"
                                   className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
                        </Field>
                        <Field label="Email">
                            <input type="email" value={form.parent_email} onChange={e => set('parent_email', e.target.value)}
                                   className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
                        </Field>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Field label="How many children are you visiting for?">
                            <select value={form.children_count} onChange={e => set('children_count', Number(e.target.value))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </Field>
                        <Field label="Interest in which class?">
                            <select value={form.interest_class} onChange={e => set('interest_class', e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
                                <option value="">Open / not sure</option>
                                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </Field>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Field label="Preferred date" required>
                            <input type="date" min={minDate}
                                   value={form.requested_date} onChange={e => set('requested_date', e.target.value)} required
                                   className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
                        </Field>
                        <Field label="Preferred time" required>
                            <select value={form.requested_slot} onChange={e => set('requested_slot', e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
                                {SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </Field>
                    </div>
                    <Field label="Anything we should know? (Allergies, transport, special requests)">
                        <textarea rows={3} value={form.note} onChange={e => set('note', e.target.value)}
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
                    </Field>
                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={saving}
                                className="bg-primary text-white font-bold px-8 py-3 rounded-full hover:bg-primary-dark transition disabled:opacity-50">
                            {saving ? 'Booking…' : 'Request tour →'}
                        </button>
                    </div>
                </form>
            </section>
        </>
    );
};

const Field = ({ label, required, children }) => (
    <label className="block">
        <span className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
            {label}{required && <span className="text-rose-500"> *</span>}
        </span>
        {children}
    </label>
);

export default TourBooking;
