import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Baby, CalendarDays, Wallet, Phone, Users, ClipboardList, ArrowRight } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Reveal from '../../components/ui/Reveal';
import KpiCard from '../../components/admin/KpiCard';
import WelcomeCard from '../../components/ui/WelcomeCard';
import { useAuth } from '../../context/AuthContext';
import useMyChildren from '../../context/useMyChildren';
import API_URL from '../../config/api';

const naira = (v) => `₦${Number(v || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

const ParentDashboard = () => {
    const { profile } = useAuth();
    const { children, loading } = useMyChildren();
    const [invoices, setInvoices] = useState([]);
    const [assignments, setAssignments] = useState([]);

    useEffect(() => {
        axios.get(`${API_URL}/api/finance/invoices/`).then(r => setInvoices(r.data || []));
        axios.get(`${API_URL}/api/assignments/`).then(r => setAssignments(r.data || []));
    }, []);

    // Never trust an unscoped invoice/assignment fetch on its own — an admin
    // previewing the parent portal (PARENT_ROLES intentionally includes
    // ADMIN_ROLES) hits the same endpoints as a real parent but isn't
    // guardian-scoped server-side, so without this filter they'd see every
    // invoice in the school summed into "Outstanding fees".
    const childIds = new Set(children.map(c => c.id));
    const myInvoices = invoices.filter(i => childIds.has(i.student));
    const outstanding = myInvoices.reduce((acc, i) => acc + Number(i.balance || 0), 0);
    const unpaidCount = myInvoices.filter(i => i.status !== 'paid').length;
    const dueAssignments = assignments.filter(a => a.is_published).length;

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    })();

    return (
        <>
            <WelcomeCard
                storageKey="bls.tour.parent.v1"
                title="Welcome to your Parent Portal"
                subtitle="A 30-second tour of what you can do here."
                steps={[
                    { icon: <Baby className="w-4 h-4 text-primary" strokeWidth={2} />, label: 'View each child\'s class, attendance and report card' },
                    { icon: <CalendarDays className="w-4 h-4 text-primary" strokeWidth={2} />, label: 'See homework set by their class teacher' },
                    { icon: <Wallet className="w-4 h-4 text-primary" strokeWidth={2} />, label: 'Pay fees by transfer; the bursary verifies within 24 hours' },
                    { icon: <Phone className="w-4 h-4 text-primary" strokeWidth={2} />, label: 'Mrs Kolawole answers her phone — 0806 766 3966' },
                ]}
            />

            <Reveal>
                <header className="mb-8">
                    <Badge tone="mint" dot>Parent Portal</Badge>
                    <h1 className="mt-3 text-3xl md:text-4xl font-black text-primary">
                        {greeting}, {profile?.first_name || 'parent'}.
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Here's what's happening with {children.length === 1 ? children[0]?.first_name : 'your children'} this week.
                    </p>
                </header>
            </Reveal>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <KpiCard tone="primary" label="Children" value={loading ? '—' : children.length} hint="enrolled at Best Legacy"
                    icon={<Users className="w-5 h-5" strokeWidth={2} />}/>
                <KpiCard tone="warm" label="Outstanding fees" value={naira(outstanding)} hint={`${unpaidCount} unpaid invoice${unpaidCount === 1 ? '' : 's'}`}
                    icon={<span className="text-lg">₦</span>}/>
                <KpiCard tone="sage" label="Open assignments" value={dueAssignments} hint="across your children's classes"
                    icon={<ClipboardList className="w-5 h-5" strokeWidth={2} />}/>
            </div>

            <Reveal>
                <h2 className="text-lg font-bold text-ink mb-4">Your children</h2>
            </Reveal>

            {loading ? (
                <div className="grid sm:grid-cols-2 gap-4">
                    {[...Array(2)].map((_, i) => <div key={i} className="h-48 rounded-2xl bg-white border border-gray-100 animate-pulse"/>)}
                </div>
            ) : children.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-secondary-soft text-secondary mx-auto flex items-center justify-center text-2xl">!</div>
                    <h3 className="mt-4 text-lg font-bold text-ink">No children linked yet</h3>
                    <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                        Your account isn't linked to any pupil records. Contact the school office and we'll connect you within a day.
                    </p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-5">
                    {children.map(c => {
                        const childInvoices = invoices.filter(i => i.student === c.id);
                        const childOutstanding = childInvoices.reduce((acc, i) => acc + Number(i.balance || 0), 0);
                        const childAssignments = assignments.filter(a => a.class_level === c.class_level);
                        return (
                            <motion.div
                                key={c.id}
                                whileHover={{ y: -4 }}
                                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                                className="bg-white rounded-3xl border border-gray-100 shadow-card p-6"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-primary-soft text-primary-dark flex items-center justify-center font-black text-lg">
                                        {(c.first_name?.[0] || '') + (c.last_name?.[0] || '')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-ink text-lg truncate">{c.full_name}</div>
                                        <div className="text-xs text-gray-500 font-mono">{c.admission_no}</div>
                                    </div>
                                    <Badge tone={c.class_section === 'nursery' ? 'warm' : 'mint'}>{c.class_name}</Badge>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                                    <div className="bg-gray-50 rounded-xl py-3">
                                        <div className="text-xs text-gray-500">Outstanding</div>
                                        <div className={`mt-1 font-black ${childOutstanding > 0 ? 'text-secondary' : 'text-primary'}`}>{naira(childOutstanding)}</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl py-3">
                                        <div className="text-xs text-gray-500">Assignments</div>
                                        <div className="mt-1 font-black text-ink">{childAssignments.length}</div>
                                    </div>
                                </div>

                                <Link
                                    to={`/parent/child/${c.id}`}
                                    className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition"
                                >
                                    View {c.first_name}'s portal
                                    <ArrowRight className="w-4 h-4" strokeWidth={2} />
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <Reveal>
                <div className="mt-10 bg-gradient-to-br from-primary to-primary-dark text-white rounded-3xl p-7 md:p-9 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1">
                        <h3 className="text-xl md:text-2xl font-black leading-tight">Pay this term's fees from here.</h3>
                        <p className="mt-2 text-white/80 text-sm">Self-report a transfer or visit the bursary. Receipts arrive within 24 hours.</p>
                    </div>
                    <Button to="/parent/fees" variant="dark" size="md">View invoices →</Button>
                </div>
            </Reveal>
        </>
    );
};

export default ParentDashboard;
