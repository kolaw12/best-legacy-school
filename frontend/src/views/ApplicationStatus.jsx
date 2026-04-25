import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import PageHero from '../components/PageHero';
import API_URL from '../config/api';

const STAGE_ICONS = {
    applied:   '📝',
    assessed:  '📋',
    offered:   '✉️',
    accepted:  '🎉',
    rejected:  '✋',
    withdrawn: '↩',
    enrolled:  '🎓',
};

const ApplicationStatus = () => {
    const [ref, setRef] = useState('');
    const [phone, setPhone] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const lookup = async (e) => {
        e.preventDefault();
        setLoading(true); setError(null); setData(null);
        try {
            const { data: res } = await axios.get(`${API_URL}/api/application-status/`, {
                params: { ref, phone: phone.slice(-4) },
            });
            setData(res);
        } catch (err) {
            setError(err.response?.data?.error || 'Could not find your application.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <PageHero eyebrow="ADMISSIONS" title="Track your application"
                      subtitle="Enter your reference and phone — see exactly where you are."
                      bgImage="/school_hero_Section.png" />
            <section className="max-w-2xl mx-auto px-4 py-16">
                <form onSubmit={lookup} className="bg-white rounded-3xl shadow-card-lg p-6 md:p-8 space-y-4 mb-8">
                    <Field label="Application reference" required>
                        <input value={ref} onChange={e => setRef(e.target.value)} required placeholder="e.g. BLS/A/2026/0042"
                               className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary font-mono" />
                    </Field>
                    <Field label="Last 4 digits of the phone you applied with" required>
                        <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} required maxLength={4}
                               placeholder="3966"
                               className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary tabular-nums" />
                    </Field>
                    {error && <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">{error}</div>}
                    <button type="submit" disabled={loading || !ref || phone.length < 4}
                            className="w-full bg-primary text-white font-bold py-3 rounded-full hover:bg-primary-dark transition disabled:opacity-50">
                        {loading ? 'Looking up…' : 'Check status →'}
                    </button>
                </form>

                {data && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-3xl shadow-card p-6 md:p-8">
                        <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">Reference</div>
                        <div className="font-mono text-sm text-ink">{data.ref}</div>
                        <h2 className="mt-2 text-2xl md:text-3xl font-black text-primary">{data.student_name}</h2>
                        <p className="text-sm text-gray-500 mt-1">Applying for {data.class_applying_for}</p>

                        <div className="mt-6">
                            <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Progress</div>
                            {data.stages?.length === 0 ? (
                                <p className="text-sm text-gray-400">Application received — awaiting next step.</p>
                            ) : (
                                <ol className="space-y-3">
                                    {data.stages.map((s, i) => (
                                        <li key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                                            <div className="text-2xl">{STAGE_ICONS[s.stage] || '·'}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-ink text-sm capitalize">{s.stage.replace('_', ' ')}</div>
                                                {s.note && <div className="text-xs text-gray-500 mt-0.5">{s.note}</div>}
                                                <div className="text-[11px] text-gray-400 mt-0.5">
                                                    {new Date(s.happened_at).toLocaleString('en-NG', {
                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit',
                                                    })}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100 text-xs text-gray-500">
                            Questions? <Link to="/contact" className="text-primary font-semibold hover:underline">Contact admissions</Link>.
                        </div>
                    </motion.div>
                )}
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

export default ApplicationStatus;
