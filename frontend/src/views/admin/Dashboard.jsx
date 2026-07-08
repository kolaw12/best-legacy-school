import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, Clock, CheckCircle2, Inbox, Wallet, ShieldCheck } from 'lucide-react';
import AdminPageHeader from '../../components/admin/PageHeader';
import KpiCard from '../../components/admin/KpiCard';
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
    const nurseryCount = data?.section_breakdown?.nursery || 0;
    const basicCount = data?.section_breakdown?.basic || 0;
    const totalActive = nurseryCount + basicCount;

    return (
        <>
            <WelcomeCard
                storageKey="bls.tour.admin.v1"
                title="Welcome to the Admin Console"
                subtitle="What you can do from here — dismiss when you're oriented."
                steps={[
                    { icon: <Inbox className="w-4 h-4 text-primary" strokeWidth={2} />, label: 'Review admissions & accept / enrol new pupils' },
                    { icon: <Users className="w-4 h-4 text-primary" strokeWidth={2} />, label: 'Manage students, teachers, classes and subjects' },
                    { icon: <Wallet className="w-4 h-4 text-primary" strokeWidth={2} />, label: 'Set fees, generate invoices, record payments' },
                    { icon: <ShieldCheck className="w-4 h-4 text-primary" strokeWidth={2} />, label: 'Audit log shows every write across the system' },
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
                         hint={`${nurseryCount} Nursery · ${basicCount} Basic`} />
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
                {/* Section breakdown */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
                    <div className="flex items-end justify-between mb-5">
                        <div>
                            <h3 className="font-bold text-ink">Students by Class</h3>
                            <p className="text-xs text-gray-500">Active students only, this session.</p>
                        </div>
                        <Link to="/admin/classes" className="text-xs font-semibold text-primary hover:underline">View all →</Link>
                    </div>
                    <div className="space-y-3">
                        {(data?.per_class || []).map(c => {
                            const pct = totalActive ? Math.round((c.count / totalActive) * 100) : 0;
                            return (
                                <div key={c.name}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-ink flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${c.section === 'nursery' ? 'bg-secondary' : 'bg-primary'}`}></span>
                                            {c.name}
                                        </span>
                                        <span className="text-gray-500 tabular-nums">{c.count} · {pct}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${c.section === 'nursery' ? 'bg-secondary' : 'bg-primary'} transition-all`} style={{ width: `${pct}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                        {!loading && !(data?.per_class || []).length && (
                            <div className="text-sm text-gray-400 text-center py-6">No class data yet. Run the seed command.</div>
                        )}
                    </div>
                </div>

                {/* Gender split + quick actions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
                        <h3 className="font-bold text-ink mb-4">Gender Split</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-primary-soft p-4">
                                <div className="text-xs font-semibold text-primary-dark">Boys</div>
                                <div className="text-2xl font-black text-ink mt-1">{data?.gender_split?.male ?? 0}</div>
                            </div>
                            <div className="rounded-xl bg-secondary-soft p-4">
                                <div className="text-xs font-semibold text-secondary-dark">Girls</div>
                                <div className="text-2xl font-black text-ink mt-1">{data?.gender_split?.female ?? 0}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
                        <h3 className="font-bold text-ink mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <Link to="/admin/students" className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-ink">Add a student <span className="text-gray-300">→</span></Link>
                            <Link to="/admin/teachers" className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-ink">Add a teacher <span className="text-gray-300">→</span></Link>
                            <Link to="/admin/admissions" className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-ink">Review applications <span className="text-gray-300">→</span></Link>
                            <Link to="/admin/classes" className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-ink">Manage classes <span className="text-gray-300">→</span></Link>
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
