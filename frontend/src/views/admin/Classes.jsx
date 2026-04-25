import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminPageHeader from '../../components/admin/PageHeader';
import Badge from '../../components/ui/Badge';
import adminApi from '../../config/adminApi';

const ClassesPage = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.classes()
            .then(r => setRows(Array.isArray(r.data) ? r.data : r.data.results || []))
            .finally(() => setLoading(false));
    }, []);

    const nursery = rows.filter(r => r.section === 'nursery');
    const basic = rows.filter(r => r.section === 'basic');

    return (
        <>
            <AdminPageHeader
                title="Classes"
                subtitle="Best Legacy has exactly 8 class levels. The structure is permanent — don't add JSS/SSS."
            />

            <Section title="Nursery Section" rows={nursery} loading={loading} tone="warm" />
            <Section title="Basic Section" rows={basic} loading={loading} tone="mint" className="mt-8" />
        </>
    );
};

const Section = ({ title, rows, loading, tone, className = '' }) => (
    <div className={className}>
        <div className="flex items-center gap-3 mb-4">
            <h2 className="font-bold text-ink">{title}</h2>
            <Badge tone={tone}>{loading ? '—' : `${rows.length} classes`}</Badge>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading && [...Array(4)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl h-40 animate-pulse" />
            ))}
            {!loading && rows.map(c => (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-card-lg transition group">
                    <div className="flex items-center justify-between">
                        <Badge tone={tone}>{c.section}</Badge>
                        <span className="text-[10px] uppercase tracking-widest text-gray-400">#{c.order}</span>
                    </div>
                    <h3 className="mt-4 text-xl font-black text-ink">{c.name}</h3>
                    <div className="mt-1 text-xs text-gray-500">
                        Class Teacher: {c.class_teacher_name || <span className="text-gray-300">unassigned</span>}
                    </div>
                    <div className="mt-5 pt-5 border-t border-gray-50 flex items-end justify-between">
                        <div>
                            <div className="text-3xl font-black text-ink">{c.student_count}</div>
                            <div className="text-xs text-gray-500">Active students</div>
                        </div>
                        <Link to={`/admin/students?class=${c.id}`} className="text-xs font-semibold text-primary hover:underline opacity-0 group-hover:opacity-100 transition">
                            View roster →
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default ClassesPage;
