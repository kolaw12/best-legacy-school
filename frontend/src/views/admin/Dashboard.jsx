import { useEffect, useState, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, Clock, CheckCircle2, Inbox, Wallet, ShieldCheck } from 'lucide-react';
import AdminPageHeader from '../../components/admin/PageHeader';
import KpiCard from '../../components/admin/KpiCard';
import { StudentsByClassChart, GenderPieChart } from '../../components/admin/Charts';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import WelcomeCard from '../../components/ui/WelcomeCard';
import adminApi from '../../config/adminApi';

const ICONS = {
    students: <Users className="w-5 h-5" strokeWidth={2} />,
    teachers: <GraduationCap className="w-5 h-5" strokeWidth={2} />,
    pending: <Clock className="w-5 h-5" strokeWidth={2} />,
    accepted: <CheckCircle2 className="w-5 h-5" strokeWidth={2} />,
};

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const statusBadge = (s) => {
    const map = { pending: 'neutral', accepted: 'mint', rejected: 'warm' };
    return <Badge tone={map[s] || 'neutral'}>{s}</Badge>;
};

const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.summary()
            .then(r => setData(r.data))
            .finally(() => setLoading(false));
    }, []);

    const kpis = data?.kpis || {};
    const kgCount = data?.section_breakdown?.kg || 0;
    const nurseryCount = data?.section_breakdown?.nursery || 0;
    const primaryCount = data?.section_breakdown?.basic || 0;
    const totalActive = kgCount + nurseryCount + primaryCount;

    return (
        <>
            <WelcomeCard
                storageKey="bls.tour.admin.v1"
                title="Welcome to the Admin Console"
                subtitle="What you can do from here — dismiss when you're oriented."
                steps={[
                    { icon: <Inbox className="w-4 h-4 text-primary" strokeWidth={2} />, label: 'Admissions', description: 'Review applications and enrol new pupils into classes.' },
                    { icon: <Users className="w-4 h-4 text-primary" strokeWidth={2} />, label: 'People', description: 'Manage students, teachers, guardians, and class assignments.' },
                    { icon: <Wallet className="w-4 h-4 text-primary" strokeWidth={2} />, label: 'Finance', description: 'Set fees, generate invoices, record payments, and print receipts.' },
                    { icon: <ShieldCheck className="w-4 h-4 text-primary" strokeWidth={2} />, label: 'Audit Log', description: 'Every write action across the system is recorded here.' },
                ]}
            />
            <AdminPageHeader
                title="Good day — here's the school today."
                subtitle={`${data?.current_session || 'Current session'} · ${data?.current_term || ''}`}
                actions={[
                    <Button key="adm" to="/admin/admissions" variant="outline" size="sm">Review admissions</Button>,
                ]}
            />

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KpiCard tone="primary" icon={ICONS.students} label="Active Students" value={loading ? '—' : kpis.total_students ?? 0}
                         hint={`${kgCount} KG · ${nurseryCount} Nursery · ${primaryCount} Primary`} />
                <KpiCard tone="sage" icon={ICONS.teachers} label="Teaching Staff" value={loading ? '—' : kpis.total_teachers ?? 0}
                         hint="Active teachers" />
                <KpiCard tone="warm" icon={ICONS.pending} label="Admissions Pending" value={loading ? '—' : kpis.admission_pending ?? 0}
                         hint="Awaiting review" />
                <KpiCard tone="ink" icon={ICONS.accepted}
                         label={kpis.attendance_marked_today ? "Attendance Today" : "Accepted This Term"}
                         value={loading ? '—' : (kpis.attendance_marked_today
                             ? `${kpis.attendance_rate_today ?? 0}%`
                             : kpis.admission_accepted ?? 0)}
                         hint={kpis.attendance_marked_today
                             ? `${kpis.attendance_marked_today} students marked`
                             : "New enrolments"} />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Students by Class chart */}
                <div className="lg:col-span-2">
                    <StudentsByClassChart data={data?.per_class || []} />
                </div>

                {/* Gender chart + quick actions */}
                <div className="space-y-6">
                    <GenderPieChart male={data?.gender_split?.male || 0} female={data?.gender_split?.female || 0} />

                    <div className="bg-white dark:bg-[#1A1D2B] rounded-2xl border border-gray-100 dark:border-[#2D3348] p-6 shadow-card">
                        <h3 className="font-bold text-ink mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <Link to="/admin/students" className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#22253A] text-sm text-ink">Add a student <span className="text-gray-300">→</span></Link>
                            <Link to="/admin/teachers" className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#22253A] text-sm text-ink">Add a teacher <span className="text-gray-300">→</span></Link>
                            <Link to="/admin/admissions" className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#22253A] text-sm text-ink">Review applications <span className="text-gray-300">→</span></Link>
                            <Link to="/admin/classes" className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#22253A] text-sm text-ink">Manage classes <span className="text-gray-300">→</span></Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent admissions */}
            <div className="mt-8">
                <div className="flex items-end justify-between mb-3">
                    <div>
                        <h3 className="font-bold text-ink">Recent Admissions</h3>
                        <p className="text-xs text-gray-500">Latest 5 applications across all classes.</p>
                    </div>
                    <Link to="/admin/admissions" className="text-xs font-semibold text-primary hover:underline">See all →</Link>
                </div>
                <DataTable
                    loading={loading}
                    empty="No admission applications yet."
                    columns={[
                        { key: 'student_id', label: 'App ID', render: r => <span className="font-mono text-xs">{r.student_id}</span> },
                        { key: 'student_name', label: 'Student', render: r => <span className="font-semibold">{r.student_name}</span> },
                        { key: 'class_applying_for', label: 'Class' },
                        { key: 'parent_name', label: 'Parent' },
                        { key: 'status', label: 'Status', render: r => statusBadge(r.status) },
                        { key: 'created_at', label: 'Applied', render: r => fmtDate(r.created_at) },
                    ]}
                    rows={data?.recent_admissions || []}
                />
            </div>
        </>
    );
};

export default AdminDashboard;
